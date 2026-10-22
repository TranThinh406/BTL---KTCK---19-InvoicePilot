/**
 * payment-reminders.js — Trang "Nhắc nợ thanh toán" (vai trò Kinh doanh)
 * Hàng đợi nhắc nợ, thang nhắc 4 nấc, soạn thư theo mẫu và lịch sử gửi.
 */
(function () {
  'use strict';

  if (!window.api || !window.fmt || !window.MOCK) {
    document.getElementById('panel').innerHTML =
      '<div class="state-block"><p class="state-desc">Chưa nạp tệp dữ liệu mẫu (mock-data.js, utils.js, api.js).</p></div>';
    return;
  }

  const api = window.api;
  const fmt = window.fmt;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  const params = new URLSearchParams(location.search);
  const demoState = params.get('state');   // empty | error

  const STEPS = [
    { label: 'Nhắc nợ lần 1', tone: 1, tpl: 't1' },
    { label: 'Nhắc nợ lần 2', tone: 2, tpl: 't2' },
    { label: 'Cảnh báo quá hạn', tone: 3, tpl: 't3' },
    { label: 'Chuyển xử lý nợ', tone: 4, tpl: 't4' }
  ];
  const CHANNEL_LABEL = { email: 'Email', zalo: 'Zalo', sms: 'SMS', phone: 'Điện thoại' };
  const CHANNEL_ICON = {
    email: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 6.5l8.5 6 8.5-6" stroke="currentColor" stroke-width="1.6"/></svg>',
    zalo: '<svg viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 11-3.2-6.9" stroke="currentColor" stroke-width="1.6"/><path d="M8 11h8M8 14h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    sms: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H9l-5 4V5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 3h3l2 5-2.2 1.4a12 12 0 005.8 5.8L16 13l5 2v3a2 2 0 01-2.2 2A17 17 0 014 5.2 2 2 0 016 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
  };

  const state = {
    loading: true,
    error: false,
    empty: demoState === 'empty',
    filter: 'all',
    query: '',
    selectedId: null,
    checked: {},
    data: null
  };

  // ------------------------------------------------------------------
  // Toast / Modal
  // ------------------------------------------------------------------
  function toast(title, desc, tone) {
    const el = document.createElement('div');
    el.className = 'toast' + (tone ? ' toast--' + tone : '');
    el.innerHTML = '<p class="toast-title">' + fmt.esc(title) + '</p>' +
      (desc ? '<p class="toast-desc">' + fmt.esc(desc) + '</p>' : '');
    $('#toasts').appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 220);
    }, 4200);
  }

  function openModal(opts) {
    return new Promise(resolve => {
      const modal = $('#modal');
      $('#modal-title').textContent = opts.title || 'Xác nhận';
      $('#modal-desc').innerHTML = opts.html || fmt.esc(opts.message || '');
      $('#modal-ok').textContent = opts.okText || 'Xác nhận';
      $('#modal-cancel').textContent = opts.cancelText || 'Hủy bỏ';
      $('#modal-send').hidden = opts.mode !== 'send';
      $('#modal-promise').hidden = opts.mode !== 'promise';
      $('#modal-bulk').hidden = opts.mode !== 'bulk';
      $('#modal-ok').disabled = false;
      modal.hidden = false;
      setTimeout(() => {
        const first = modal.querySelector('.modal-form:not([hidden]) .input');
        (first || $('#modal-ok')).focus();
      }, 30);

      function cleanup(v) {
        modal.hidden = true;
        $('#modal-ok').removeEventListener('click', onOk);
        $('#modal-cancel').removeEventListener('click', onCancel);
        $('#modal-x').removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdrop);
        document.removeEventListener('keydown', onEsc);
        resolve(v);
      }
      function onOk() {
        if (opts.validate && !opts.validate()) return;
        cleanup(opts.collect ? opts.collect() : true);
      }
      function onCancel() { cleanup(null); }
      function onBackdrop(e) { if (e.target === modal) cleanup(null); }
      function onEsc(e) { if (e.key === 'Escape') cleanup(null); }

      $('#modal-ok').addEventListener('click', onOk);
      $('#modal-cancel').addEventListener('click', onCancel);
      $('#modal-x').addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);
      document.addEventListener('keydown', onEsc);
    });
  }

  function nowText() {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' · ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  // ------------------------------------------------------------------
  // KPI
  // ------------------------------------------------------------------
  function renderKpis() {
    const list = state.data.customers;
    const overdue = list.reduce((s, c) => s + c.overdue, 0);
    const lateList = list.filter(c => c.daysLate > 0);
    const avgLate = lateList.length
      ? Math.round(lateList.reduce((s, c) => s + c.daysLate, 0) / lateList.length) : 0;
    const promised = list.filter(c => c.promise);
    const promiseSum = promised.reduce((s, c) => s + c.promise.amount, 0);
    const sentToday = list.reduce((s, c) =>
      s + c.history.filter(h => h.date === '12/10/2026').length, 0);

    $('#k-need').textContent = list.length;
    $('#k-need-sub').textContent = list.filter(c => c.type === 'overdue').length +
      ' quá hạn · ' + list.filter(c => c.type === 'due-soon').length + ' nhắc trước hạn';
    $('#k-overdue').textContent = fmt.vnd(overdue);
    $('#k-late-sub').textContent = 'chậm trễ trung bình ' + avgLate + ' ngày';
    $('#k-sent').textContent = sentToday;
    $('#k-promise').textContent = fmt.vnd(promiseSum);
    $('#k-promise-sub').textContent = promised.length + ' khách hàng cam kết';
    $('#k-rate').textContent = state.data.recoveryRate + '%';
    $('#k-rate-bar').style.width = state.data.recoveryRate + '%';
  }

  // ------------------------------------------------------------------
  // Bảng nhắc nợ
  // ------------------------------------------------------------------
  function visible() {
    let list = state.data.customers.slice();
    const q = state.query.trim().toLowerCase();
    if (q) list = list.filter(c => (c.name + ' ' + c.code).toLowerCase().indexOf(q) > -1);

    if (state.filter === 'overdue') list = list.filter(c => c.type === 'overdue');
    if (state.filter === 'due-soon') list = list.filter(c => c.type === 'due-soon');
    if (state.filter === 'unreminded') list = list.filter(c => c.stage === 0);
    if (state.filter === 'promised') list = list.filter(c => !!c.promise);
    if (state.filter === 'escalated') list = list.filter(c => c.stage >= 3);

    return list.sort((a, b) => b.daysLate - a.daysLate || b.overdue - a.overdue);
  }

  function ladderHtml(c) {
    const segs = STEPS.map((s, i) =>
      '<span class="ladder-seg tone-' + s.tone + (i < c.stage ? ' is-done' : '') + '"></span>'
    ).join('');
    let label = 'Chưa nhắc · kế tiếp ' + c.nextAt;
    if (c.stage > 0) label = 'Đã ' + STEPS[c.stage - 1].label.toLowerCase() +
      (c.stage < 4 ? ' · kế tiếp ' + c.nextAt : '');
    return '<div class="ladder">' + segs + '</div>' +
      '<p class="ladder-label' + (c.stage ? ' is-done' : '') + '">' + label + '</p>';
  }

  function renderTable() {
    const list = visible();
    $('#rem-empty').hidden = list.length > 0;
    $('#shown').textContent = list.length;
    $('#total').textContent = state.data.customers.length;

    $('#rem-body').innerHTML = list.map(c => `
      <tr data-id="${c.id}" class="${state.selectedId === c.id ? 'is-selected' : ''} ${c.stage >= 3 ? 'is-escalated' : ''}">
        <td class="c-chk-cell">
          <label class="chk"><input type="checkbox" class="row-chk" data-id="${c.id}"
            ${state.checked[c.id] ? 'checked' : ''} aria-label="Chọn ${fmt.esc(c.name)}"></label>
        </td>
        <td>
          <p class="cus-name">${fmt.esc(c.name)}</p>
          <p class="cus-meta">${fmt.esc(c.code)} · ${fmt.esc(c.owner)} · ${c.type === 'overdue' ? 'QUÁ HẠN' : 'NHẮC TRƯỚC HẠN'}</p>
        </td>
        <td class="num" data-label="Số dư"><span class="val">${fmt.vnd(c.balance)}</span></td>
        <td class="num" data-label="Quá hạn">
          <span class="val ${c.overdue ? 'is-overdue' : 'is-flat'}">${c.overdue ? fmt.vnd(c.overdue) : '—'}</span>
        </td>
        <td>
          <p class="late-num ${c.daysLate > 60 ? 'is-hot' : c.daysLate > 0 ? 'is-warm' : 'is-cool'}">
            ${c.daysLate > 0 ? c.daysLate + ' ngày' : 'trong hạn'}</p>
          <p class="late-note">${c.daysLate > 0 ? 'nợ cũ nhất ' + c.oldest : 'hạn ' + c.nextAt}</p>
        </td>
        <td class="c-ladder-cell">${ladderHtml(c)}</td>
        <td>
          <div class="chan-list">
            ${c.channels.map(k => '<span class="chan-tag">' + CHANNEL_ICON[k] + CHANNEL_LABEL[k] + '</span>').join('')}
          </div>
        </td>
        <td>
          <p class="mono" style="font-size:11.5px">${c.lastAt ? fmt.esc(c.lastAt) : '—'}</p>
          <p class="late-note">${c.promise ? 'đã hứa thanh toán' : c.lastAt ? 'đã gửi' : 'chưa gửi'}</p>
        </td>
        <td>
          <span class="row-go"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </td>
      </tr>`).join('');

    $('#chk-all').checked = list.length > 0 && list.every(c => state.checked[c.id]);
    $('#btn-bulk').disabled = Object.keys(state.checked).filter(k => state.checked[k]).length === 0;
  }

  // ------------------------------------------------------------------
  // Mẫu nhắc nợ
  // ------------------------------------------------------------------
  function renderTemplates() {
    $('#tpl-cards').innerHTML = state.data.templates.map(t => `
      <article class="tpl-card">
        <div class="tpl-top">
          <p class="tpl-name">${fmt.esc(t.name)}</p>
          <span class="stamp stamp--${t.tone === 'soft' ? 'info' : t.tone === 'info' ? 'neutral'
            : t.tone === 'warn' ? 'warn' : 'danger'}">${fmt.esc(t.label)}</span>
        </div>
        <p class="tpl-when">${fmt.esc(t.when)}</p>
        <p class="tpl-subject">${fmt.esc(t.subject)}</p>
        <button class="tpl-use" type="button" data-tpl="${t.id}">Soạn với mẫu này</button>
      </article>`).join('');
  }

  // ------------------------------------------------------------------
  // Trace
  // ------------------------------------------------------------------
  function traceHtml(items) {
    if (!items || !items.length) return '<p class="trace-empty">Chưa có hoạt động nào.</p>';
    return items.map(t => `
      <div class="trace-item tone-${t.tone || 'info'}">
        <span class="trace-dot"></span>
        <p class="trace-time">${fmt.esc(t.time || t.date)}</p>
        <div class="trace-head">
          <span class="trace-action">${fmt.esc(t.action || t.result)}</span>
          <span class="trace-actor">bởi ${fmt.esc(t.actor || t.by)}</span>
        </div>
        ${t.note ? '<p class="trace-note">"' + fmt.esc(t.note) + '"</p>' : ''}
      </div>`).join('');
  }

  function renderTrace() {
    $('#trace').innerHTML = traceHtml(state.data.trace);
  }

  // ------------------------------------------------------------------
  // Drawer
  // ------------------------------------------------------------------
  function currentCustomer() {
    return state.data.customers.find(x => x.id === state.selectedId);
  }

  function renderLadder(c) {
    $('#dw-ladder').innerHTML = STEPS.map((s, i) => {
      const done = i < c.stage;
      const next = i === c.stage;
      const h = c.history.filter(x => x.stage === i + 1).pop();
      return `
      <li class="v-step ${done ? 'is-done tone-' + s.tone : next ? 'is-next' : 'is-todo'}">
        <span class="v-dot">${done ? '<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span>
        <div>
          <p class="v-title">${s.label}</p>
          <p class="v-meta">${done
            ? fmt.esc(h.date) + ' · ' + fmt.esc(h.channel) + ' · ' + fmt.esc(h.result)
            : next ? 'dự kiến ' + fmt.esc(c.nextAt) : 'chưa thực hiện'}</p>
        </div>
      </li>`;
    }).join('');
  }

  function renderPreview() {
    const c = currentCustomer();
    const t = state.data.templates.find(x => x.id === $('#dw-template').value);
    if (!c || !t) return;
    const map = {
      '{{KH}}': c.name,
      '{{TIEN}}': fmt.vnd(c.overdue || c.dueSoon || c.balance),
      '{{HAN}}': '12/10/2026',
      '{{SONGAY}}': String(c.daysLate || 15),
      '{{NGUOIGUI}}': 'Phạm Thu Hà'
    };
    let subject = t.subject, body = t.body;
    Object.keys(map).forEach(k => {
      const re = new RegExp(k.replace(/[{}]/g, '\\$&'), 'g');
      subject = subject.replace(re, map[k]);
      body = body.replace(re, map[k]);
    });
    $('#dw-subject').textContent = subject;
    $('#dw-to').textContent = 'Đến: ' + c.email;
    $('#dw-preview').textContent = body;
  }

  function openDrawer(id) {
    const c = state.data.customers.find(x => x.id === id);
    if (!c) return;
    state.selectedId = id;
    renderTable();

    $('#dw-code').textContent = c.code;
    $('#dw-name').textContent = c.name;
    $('#dw-contact').textContent = c.email + ' · ' + c.phone;
    $('#dw-balance').textContent = fmt.vnd(c.balance);
    $('#dw-overdue').textContent = c.overdue ? fmt.vnd(c.overdue) : '—';
    $('#dw-overdue').className = 'mono is-big' + (c.overdue ? ' is-hot' : '');
    $('#dw-late').textContent = c.daysLate > 0 ? c.daysLate + ' ngày' : 'trong hạn';
    $('#dw-late').className = 'mono is-big' + (c.daysLate > 60 ? ' is-hot' : '');

    $('#dw-promise-band').hidden = !c.promise;
    if (c.promise) {
      $('#dw-promise-text').textContent = 'Khách hàng hứa thanh toán ' + fmt.vnd(c.promise.amount) +
        ' trước ngày ' + c.promise.date + '.';
    }

    renderLadder(c);

    // Mẫu gợi ý theo nấc nhắc hiện tại
    const sug = STEPS[Math.min(c.stage, 3)].tpl;
    $('#dw-template').innerHTML = state.data.templates.map(t =>
      '<option value="' + t.id + '"' + (t.id === sug ? ' selected' : '') + '>' +
      fmt.esc(t.name) + '</option>').join('');

    // Kênh gửi
    $$('#dw-channels input').forEach(i => { i.checked = c.channels.indexOf(i.value) > -1; });
    $('#chan-error').hidden = true;
    $('#dw-note').value = '';
    renderPreview();

    $('#dw-history').innerHTML = traceHtml(c.history.map(h => ({
      date: h.date, result: h.result, by: h.by, note: h.channel
    })));

    $('#drawer').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    $('#drawer').hidden = true;
    document.body.style.overflow = '';
  }

  // ------------------------------------------------------------------
  // Gửi nhắc nợ
  // ------------------------------------------------------------------
  async function sendOne() {
    const c = currentCustomer();
    if (!c) return;

    const channels = $$('#dw-channels input').filter(i => i.checked).map(i => i.value);
    if (!channels.length) {
      $('#chan-error').hidden = false;
      return;
    }
    const tpl = state.data.templates.find(t => t.id === $('#dw-template').value);

    const res = await openModal({
      title: 'Gửi nhắc nợ',
      html: 'Gửi <strong>' + fmt.esc(tpl.name) + '</strong> tới <strong>' + fmt.esc(c.name) +
        '</strong> qua <strong>' + channels.map(k => CHANNEL_LABEL[k]).join(', ') +
        '</strong>. Thao tác này được ghi vào nhật ký nhắc nợ.',
      okText: 'Gửi nhắc nợ',
      mode: 'send',
      collect: () => ({ note: $('#m-note2').value.trim() })
    });
    if (!res) return;

    const payload = {
      date: $('#dw-date').value.trim() || '12/10/2026',
      channels: channels,
      templateName: tpl.name,
      note: res.note || $('#dw-note').value.trim()
    };

    try {
      const updated = api.customerReminders
        ? await api.customerReminders.send(c.id, payload)
        : fakeSend(c, payload);
      const idx = state.data.customers.findIndex(x => x.id === c.id);
      state.data.customers[idx] = updated;
      render();
      openDrawer(c.id);
      toast('Đã gửi nhắc nợ', c.name + ' · ' + tpl.name + ' qua ' +
        channels.map(k => CHANNEL_LABEL[k]).join(', ') + '.');
    } catch (err) {
      handleConflict(err, c);
    }
  }

  function fakeSend(c, payload) {
    return new Promise((resolve, reject) => setTimeout(() => {
      if (c.stale) return reject({
        code: 'CONFLICT',
        message: c.name + ' vừa được Đỗ Quốc Huy gửi nhắc nợ lúc 14:05.'
      });
      const clone = JSON.parse(JSON.stringify(c));
      clone.stage = Math.min(4, clone.stage + 1);
      clone.lastAt = payload.date;
      clone.channels = payload.channels;
      clone.history.push({
        date: payload.date, channel: payload.channels.map(k => CHANNEL_LABEL[k]).join(' + '),
        stage: clone.stage, result: 'Đã gửi', by: 'Phạm Thu Hà'
      });
      state.data.trace.unshift({
        time: nowText(), actor: 'Phạm Thu Hà',
        action: 'Gửi nhắc nợ lần ' + clone.stage,
        tone: clone.stage >= 3 ? 'warn' : 'ok',
        note: clone.name + ' · mẫu ' + payload.templateName + '. ' + (payload.note || '')
      });
      resolve(clone);
    }, 700));
  }

  // ------------------------------------------------------------------
  // Gửi hàng loạt
  // ------------------------------------------------------------------
  async function sendBulk() {
    const ids = Object.keys(state.checked).filter(k => state.checked[k]);
    if (!ids.length) return;

    const names = ids.map(id => (state.data.customers.find(c => c.id === id) || {}).name).filter(Boolean);
    $('#m-scope').textContent = names.length + ' khách hàng: ' + names.join(' · ');
    $('#m-template').innerHTML = state.data.templates.map(t =>
      '<option value="' + t.id + '">' + fmt.esc(t.name) + '</option>').join('');

    const res = await openModal({
      title: 'Gửi nhắc nợ hàng loạt',
      html: 'Mỗi khách hàng sẽ nhận một thư riêng theo mẫu đã chọn, ' +
        'đi kèm số dư và ngày quá hạn của chính họ.',
      okText: 'Gửi ' + names.length + ' nhắc nợ',
      mode: 'bulk',
      collect: () => ({ templateId: $('#m-template').value })
    });
    if (!res) return;

    const tpl = state.data.templates.find(t => t.id === res.templateId);
    try {
      const out = api.customerReminders
        ? await api.customerReminders.sendBulk(ids, { date: '12/10/2026', templateName: tpl.name })
        : fakeBulk(ids, tpl);
      state.checked = {};
      render();
      toast('Đã gửi nhắc nợ hàng loạt', out.sent + '/' + out.total + ' nhắc nợ · mẫu ' + tpl.name + '.',
        out.sent < out.total ? 'warn' : '');
    } catch (err) {
      handleConflict(err);
    }
  }

  function fakeBulk(ids, tpl) {
    return new Promise(resolve => setTimeout(() => {
      let sent = 0;
      ids.forEach(id => {
        const c = state.data.customers.find(x => x.id === id);
        if (!c || c.stale) return;
        c.stage = Math.min(4, c.stage + 1);
        c.lastAt = '12/10/2026';
        c.history.push({ date: '12/10/2026', channel: 'Email', stage: c.stage, result: 'Đã gửi', by: 'Phạm Thu Hà' });
        sent++;
      });
      state.data.trace.unshift({
        time: nowText(), actor: 'Phạm Thu Hà', action: 'Gửi nhắc nợ hàng loạt', tone: 'info',
        note: sent + ' khách hàng · mẫu ' + tpl.name + '.'
      });
      resolve({ sent: sent, total: ids.length });
    }, 800));
  }

  // ------------------------------------------------------------------
  // Hứa thanh toán
  // ------------------------------------------------------------------
  async function promiseToPay() {
    const c = currentCustomer();
    if (!c) return;

    const res = await openModal({
      title: 'Ghi nhận hứa thanh toán',
      html: 'Ghi nhận cam kết của <strong>' + fmt.esc(c.name) + '</strong> · số dư hiện tại ' +
        '<strong>' + fmt.vnd(c.balance) + '</strong>. Hẹn nhắc sẽ tự lùi tới ngày khách cam kết.',
      okText: 'Ghi nhận',
      mode: 'promise',
      validate: () => {
        const raw = parseInt($('#m-amount').value.replace(/\D/g, ''), 10);
        const ok = raw > 0 && raw <= c.balance;
        $('#pay-error').hidden = ok;
        $('#m-amount').classList.toggle('is-invalid', !ok);
        return ok;
      },
      collect: () => ({
        amount: parseInt($('#m-amount').value.replace(/\D/g, ''), 10),
        date: $('#m-date2').value.trim() || '20/10/2026'
      })
    });
    if (!res) return;

    try {
      const updated = api.customerReminders
        ? await api.customerReminders.promise(c.id, res)
        : fakePromise(c, res);
      const idx = state.data.customers.findIndex(x => x.id === c.id);
      state.data.customers[idx] = updated;
      render();
      openDrawer(c.id);
      toast('Đã ghi nhận hứa thanh toán', fmt.vnd(res.amount) + ' · hẹn ngày ' + res.date + '.');
    } catch (err) {
      handleConflict(err, c);
    }
  }

  function fakePromise(c, res) {
    return new Promise(resolve => setTimeout(() => {
      const clone = JSON.parse(JSON.stringify(c));
      clone.promise = res;
      clone.history.push({
        date: '12/10/2026', channel: 'Ghi nhận', stage: clone.stage,
        result: 'Hứa thanh toán ' + fmt.vnd(res.amount) + ' ngày ' + res.date, by: 'Phạm Thu Hà'
      });
      state.data.trace.unshift({
        time: nowText(), actor: 'Phạm Thu Hà', action: 'Ghi nhận hứa thanh toán', tone: 'info',
        note: clone.name + ' · ' + fmt.vnd(res.amount) + ' · hẹn ' + res.date + '.'
      });
      resolve(clone);
    }, 640));
  }

  // ------------------------------------------------------------------
  // Xung đột dữ liệu
  // ------------------------------------------------------------------
  function handleConflict(err, item) {
    if (err && err.code === 'CONFLICT') {
      if (item) item.stale = true;
      $('#conflict-text').innerHTML = '<strong>' + fmt.esc(err.message) +
        '</strong> Thao tác của bạn bị hủy để tránh gửi trùng nhắc nợ. Hãy tải lại danh sách.';
      $('#conflict-band').hidden = false;
      $('#conflict-band').scrollIntoView({ behavior: 'smooth', block: 'center' });
      render();
      return;
    }
    toast('Không hoàn tất được thao tác', (err && err.message) || 'Vui lòng thử lại.', 'error');
  }

  // ------------------------------------------------------------------
  // Render & sự kiện
  // ------------------------------------------------------------------
  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;
    if (state.loading || state.error || state.empty || !state.data) return;
    renderKpis();
    renderTable();
    renderTemplates();
    renderTrace();
  }

  function bind() {
    $('#rem-body').addEventListener('click', e => {
      const chk = e.target.closest('.row-chk');
      if (chk) {
        state.checked[chk.dataset.id] = chk.checked;
        renderTable();
        return;
      }
      const tr = e.target.closest('tr[data-id]');
      if (tr) openDrawer(tr.dataset.id);
    });

    $('#chk-all').addEventListener('change', e => {
      visible().forEach(c => { state.checked[c.id] = e.target.checked; });
      renderTable();
    });

    $$('.chip').forEach(b => b.addEventListener('click', () => {
      $$('.chip').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      state.filter = b.dataset.filter;
      renderTable();
    }));

    $('#q').addEventListener('input', e => {
      state.query = e.target.value;
      renderTable();
    });

    $('#btn-clear').addEventListener('click', () => {
      state.query = '';
      state.filter = 'all';
      $('#q').value = '';
      $$('.chip').forEach((x, i) => x.classList.toggle('is-active', i === 0));
      renderTable();
    });

    $('#btn-empty-reset').addEventListener('click', () => {
      location.href = 'sales-customer-balance.html';
    });
    $('#btn-retry').addEventListener('click', load);

    $('#tpl-cards').addEventListener('click', e => {
      const b = e.target.closest('.tpl-use');
      if (!b) return;
      const first = visible()[0] || state.data.customers[0];
      if (!first) return;
      openDrawer(first.id);
      $('#dw-template').value = b.dataset.tpl;
      renderPreview();
    });

    $('#dw-template').addEventListener('change', renderPreview);
    $$('#dw-channels input').forEach(i => i.addEventListener('change', () => {
      const any = $$('#dw-channels input').some(x => x.checked);
      $('#chan-error').hidden = any;
    }));

    $('#dw-close').addEventListener('click', closeDrawer);
    $('#drawer').addEventListener('click', e => {
      if (e.target === $('#drawer')) closeDrawer();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer();
    });

    $('#dw-send').addEventListener('click', sendOne);
    $('#dw-promise').addEventListener('click', promiseToPay);
    $('#btn-bulk').addEventListener('click', sendBulk);
    $('#btn-export').addEventListener('click', () => {
      toast('Đang tạo danh sách', 'Tệp nhắc nợ kỳ 10/2026 sẽ được tải xuống trong ít giây.', 'warn');
    });

    $('#conflict-reload').addEventListener('click', () => {
      $('#conflict-band').hidden = true;
      load();
      toast('Đã tải bản mới nhất', 'Hãy kiểm tra trước khi gửi lại nhắc nợ.');
    });
  }

  // ------------------------------------------------------------------
  // Nạp dữ liệu
  // ------------------------------------------------------------------
  async function load() {
    state.loading = true;
    state.error = false;
    render();

    try {
      state.data = api.customerReminders
        ? await api.customerReminders.get()
        : JSON.parse(JSON.stringify(window.MOCK.customerReminderData));
    } catch (e) {
      state.error = true;
    } finally {
      state.loading = false;
      if (demoState === 'error') state.error = true;
      if (state.data && state.data.customers.length === 0) state.empty = true;
      render();
    }
  }

  (function init() {
    bind();
    load();
  })();
})();