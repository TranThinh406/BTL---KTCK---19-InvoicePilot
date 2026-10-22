/**
 * customer-balance.js — Trang "Số dư công nợ khách hàng" (vai trò Kinh doanh)
 * Danh sách khách hàng có thanh hạn mức + cơ cấu tuổi nợ, drawer sổ chi tiết công nợ.
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
  const demoState = params.get('state');   // empty | error | conflict

  const AGE_KEYS = ['b1', 'b2', 'b3', 'b4'];
  const AGE_LABELS = ['0 – 30 ngày', '31 – 60 ngày', '61 – 90 ngày', 'trên 90 ngày'];

  const state = {
    loading: true,
    error: false,
    empty: demoState === 'empty',
    filter: 'all',
    query: '',
    sort: { key: 'balance', dir: 'desc' },
    selectedId: null,
    data: null
  };

  // ------------------------------------------------------------------
  // Suy ra các chỉ tiêu từ 4 nhóm tuổi nợ
  // ------------------------------------------------------------------
  function hydrate(c) {
    const a = c.aging;
    c.balance = AGE_KEYS.reduce((s, k) => s + a[k], 0);
    c.overdue = a.b3 + a.b4;
    c.duesoon = a.b2;
    c.current = a.b1;
    c.usage = c.limit > 0 ? c.balance / c.limit : 0;
    c.risk = c.usage > 1 || c.overdue > 200000000 ? 'high'
      : c.overdue > 0 || c.usage > 0.8 ? 'mid' : 'low';
    return c;
  }

  // ------------------------------------------------------------------
  // Toast
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

  // ------------------------------------------------------------------
  // Modal
  // ------------------------------------------------------------------
  function openModal(opts) {
    return new Promise(resolve => {
      const modal = $('#modal');
      $('#modal-title').textContent = opts.title || 'Xác nhận';
      $('#modal-desc').innerHTML = opts.html || fmt.esc(opts.message || '');
      $('#modal-ok').textContent = opts.okText || 'Xác nhận';
      $('#modal-cancel').textContent = opts.cancelText || 'Hủy bỏ';
      $('#modal-send').hidden = opts.mode !== 'send';
      $('#modal-pay').hidden = opts.mode !== 'pay';
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

  // ------------------------------------------------------------------
  // KPI
  // ------------------------------------------------------------------
  function renderKpis() {
    const list = state.data.customers;
    const total = list.reduce((s, c) => s + c.balance, 0);
    const overdue = list.reduce((s, c) => s + c.overdue, 0);
    const soon = list.reduce((s, c) => s + c.duesoon, 0);
    const current = list.reduce((s, c) => s + c.current, 0);
    const limit = list.reduce((s, c) => s + c.limit, 0);

    $('#k-total').textContent = fmt.vnd(total);
    $('#k-total-sub').textContent = list.length + ' khách hàng có công nợ';
    $('#k-overdue').textContent = fmt.vnd(overdue);
    $('#k-duesoon').textContent = fmt.vnd(soon);
    $('#k-current').textContent = fmt.vnd(current);
    const pct = limit > 0 ? Math.round(total / limit * 100) : 0;
    $('#k-limit').textContent = pct + '%';
    $('#k-meter').style.width = Math.min(pct, 100) + '%';
    $('#k-meter').style.background = pct > 100 ? 'var(--sienna)' : pct > 80 ? 'var(--ochre)' : 'var(--green)';
    $('#k-limit-sub').textContent = 'trên tổng hạn mức ' + fmt.vnd(limit);
  }

  // ------------------------------------------------------------------
  // Bảng số dư
  // ------------------------------------------------------------------
  function visibleCustomers() {
    let list = state.data.customers.slice();
    const q = state.query.trim().toLowerCase();

    if (q) {
      list = list.filter(c => (c.name + ' ' + c.code).toLowerCase().indexOf(q) > -1);
    }
    if (state.filter === 'overdue') list = list.filter(c => c.overdue > 0);
    if (state.filter === 'duesoon') list = list.filter(c => c.duesoon > 0);
    if (state.filter === 'current') list = list.filter(c => c.overdue === 0 && c.duesoon === 0);
    if (state.filter === 'overlimit') list = list.filter(c => c.usage > 1);

    const k = state.sort.key, dir = state.sort.dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (k === 'name') return a.name.localeCompare(b.name, 'vi') * dir;
      return ((a[k] || 0) - (b[k] || 0)) * dir;
    });
    return list;
  }

  function ageStack(c) {
    const total = c.balance || 1;
    return '<div class="age-stack">' + AGE_KEYS.map((k, i) => {
      const w = c.aging[k] / total * 100;
      return c.aging[k] > 0
        ? '<span class="age-seg age-' + (i + 1) + '" style="width:' + w.toFixed(1) + '%" title="' +
          AGE_LABELS[i] + ': ' + fmt.vnd(c.aging[k]) + '"></span>'
        : '';
    }).join('') + '</div>' +
    '<p class="age-legend">' + (c.overdue > 0
      ? fmt.vnd(c.overdue) + ' quá hạn'
      : 'không có khoản quá hạn') + '</p>';
  }

  function limitMeter(c) {
    const pct = Math.round(c.usage * 100);
    const cls = pct > 100 ? 'is-over' : pct > 80 ? 'is-warn' : '';
    return `
      <div class="lim">
        <div class="lim-top">
          <span class="lim-pct ${pct > 100 ? 'is-over' : ''}">${pct}%</span>
          <span class="lim-pct">${fmt.vnd(c.limit)}</span>
        </div>
        <div class="lim-track">
          <span class="lim-fill ${cls}" style="width:${Math.min(pct, 100)}%"></span>
          <i class="lim-tick"></i>
        </div>
      </div>`;
  }

  function riskStamp(c) {
    if (c.risk === 'high') return '<span class="stamp stamp--danger">Cao</span>';
    if (c.risk === 'mid') return '<span class="stamp stamp--warn">Theo dõi</span>';
    return '<span class="stamp stamp--success">Ổn định</span>';
  }

  function renderTable() {
    const list = visibleCustomers();
    $('#bal-empty').hidden = list.length > 0;
    $('#shown').textContent = list.length;
    $('#total').textContent = state.data.customers.length;

    $('#bal-body').innerHTML = list.map(c => `
      <tr data-id="${c.id}" class="${state.selectedId === c.id ? 'is-selected' : ''}">
        <td class="c-cus-cell">
          <p class="cus-name">${fmt.esc(c.name)}</p>
          <p class="cus-meta">${fmt.esc(c.code)} · ${fmt.esc(c.owner)} · GD gần nhất ${fmt.esc(c.lastActivity)}</p>
        </td>
        <td class="c-lim-cell">${limitMeter(c)}</td>
        <td class="num" data-label="Số dư">
          <span class="val">${fmt.vnd(c.balance)}</span>
        </td>
        <td class="num" data-label="Quá hạn">
          <span class="val ${c.overdue ? 'is-overdue' : 'is-flat'}">${c.overdue ? fmt.vnd(c.overdue) : '—'}</span>
        </td>
        <td class="num" data-label="Sắp đến hạn">
          <span class="val ${c.duesoon ? 'is-soon' : 'is-flat'}">${c.duesoon ? fmt.vnd(c.duesoon) : '—'}</span>
        </td>
        <td class="c-age-cell">${ageStack(c)}</td>
        <td class="c-risk-cell">${riskStamp(c)}</td>
        <td class="c-act-cell">
          <span class="row-go"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </td>
      </tr>`).join('');

    $$('.sort-th').forEach(b => {
      b.classList.toggle('is-asc', b.dataset.sort === state.sort.key && state.sort.dir === 'asc');
      b.classList.toggle('is-desc', b.dataset.sort === state.sort.key && state.sort.dir === 'desc');
    });
  }

  // ------------------------------------------------------------------
  // Trace
  // ------------------------------------------------------------------
  function renderTrace() {
    $('#trace').innerHTML = state.data.trace.map(t => `
      <div class="trace-item tone-${t.tone || 'info'}">
        <span class="trace-dot"></span>
        <p class="trace-time">${fmt.esc(t.time)}</p>
        <div class="trace-head">
          <span class="trace-action">${fmt.esc(t.action)}</span>
          <span class="trace-actor">bởi ${fmt.esc(t.actor)}</span>
        </div>
        ${t.note ? '<p class="trace-note">"' + fmt.esc(t.note) + '"</p>' : ''}
      </div>`).join('');
  }

  // ------------------------------------------------------------------
  // Drawer — sổ chi tiết công nợ
  // ------------------------------------------------------------------
  function openDrawer(id) {
    const c = state.data.customers.find(x => x.id === id);
    if (!c) return;
    state.selectedId = id;
    renderTable();

    $('#dw-code').textContent = c.code;
    $('#dw-name').textContent = c.name;
    $('#dw-owner').textContent = c.owner;
    $('#dw-balance').textContent = fmt.vnd(c.balance);
    $('#dw-limit').textContent = fmt.vnd(c.limit);
    $('#dw-oldest').textContent = c.oldest;

    // Hạn mức
    const pct = Math.round(c.usage * 100);
    $('#dw-pct').textContent = pct + '%';
    $('#dw-pct').className = 'mono lim-pct' + (pct > 100 ? ' is-over' : '');
    const fill = $('#dw-fill');
    fill.style.width = Math.min(pct, 100) + '%';
    fill.className = 'lim-fill ' + (pct > 100 ? 'is-over' : pct > 80 ? 'is-warn' : '');
    $('#dw-limnote').textContent = pct > 100
      ? 'Khách hàng đã vượt hạn mức ' + fmt.vnd(c.balance - c.limit) +
        '. Cần xác nhận của trưởng nhóm trước khi bán thêm.'
      : 'Còn ' + fmt.vnd(c.limit - c.balance) + ' hạn mức có thể sử dụng.';

    // Tuổi nợ
    const max = Math.max.apply(null, AGE_KEYS.map(k => c.aging[k]).concat([1]));
    $('#dw-aging').innerHTML = AGE_KEYS.map((k, i) => `
      <div class="age-row">
        <span class="age-key"><i class="sw age-${i + 1}"></i>${AGE_LABELS[i]}</span>
        <span class="age-bar"><span class="age-${i + 1}" style="width:${(c.aging[k] / max * 100).toFixed(1)}%"></span></span>
        <span class="age-amt ${c.aging[k] ? '' : 'is-zero'}">${c.aging[k] ? fmt.vnd(c.aging[k]) : '—'}</span>
      </div>`).join('');

    // Sổ chi tiết — số dư chạy
    let running = 0;
    const rows = c.statement.slice().reverse();
    const maxBal = Math.max.apply(null, rows.map(r => {
      running += (r.debit || 0) - (r.credit || 0);
      return Math.abs(running);
    }).concat([1]));

    running = 0;
    $('#dw-stmt-body').innerHTML = rows.map(r => {
      running += (r.debit || 0) - (r.credit || 0);
      return `
      <tr>
        <td class="mono">${fmt.esc(r.date)}</td>
        <td>
          <span class="mono">${fmt.esc(r.ref)}</span>
          <p class="stmt-desc">${fmt.esc(r.desc)}</p>
        </td>
        <td class="num mono stmt-debit">${r.debit ? fmt.vnd(r.debit) : '—'}</td>
        <td class="num mono stmt-credit">${r.credit ? fmt.vnd(r.credit) : '—'}</td>
        <td class="num">
          <div class="bal-cell">
            <span class="bal-track"><span style="width:${(Math.abs(running) / maxBal * 100).toFixed(1)}%"></span></span>
            <span class="bal-num">${fmt.vnd(running)}</span>
          </div>
        </td>
      </tr>`;
    }).join('');

    const totalDebit = c.statement.reduce((s, r) => s + (r.debit || 0), 0);
    const totalCredit = c.statement.reduce((s, r) => s + (r.credit || 0), 0);
    $('#dw-stmt-foot').innerHTML = `
      <tr>
        <td colspan="2" class="mono">Tổng phát sinh</td>
        <td class="num mono">${fmt.vnd(totalDebit)}</td>
        <td class="num mono">${fmt.vnd(totalCredit)}</td>
        <td class="num mono">${fmt.vnd(totalDebit - totalCredit)}</td>
      </tr>`;

    $('#drawer').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    $('#drawer').hidden = true;
    document.body.style.overflow = '';
  }

  // ------------------------------------------------------------------
  // Gửi bảng kê
  // ------------------------------------------------------------------
  async function sendStatement() {
    const c = state.data.customers.find(x => x.id === state.selectedId) || state.data.customers[0];
    if (!c) return;

    const res = await openModal({
      title: 'Gửi bảng kê công nợ',
      html: 'Bảng kê sẽ được gửi tới <strong>' + fmt.esc(c.name) +
        '</strong> với số dư hiện tại <strong>' + fmt.vnd(c.balance) + '</strong>. ' +
        'Thao tác này được ghi vào nhật ký công nợ.',
      okText: 'Gửi bảng kê',
      mode: 'send',
      collect: () => ({ period: $('#m-period').value, note: $('#m-note').value.trim() })
    });
    if (!res) return;

    try {
      const done = api.balances
        ? await api.balances.sendStatement(c.id, res)
        : { at: nowText(), by: 'Phạm Thu Hà', period: res.period };

      if (demoState === 'conflict' && c.id === 'cus-02') throw {
        code: 'CONFLICT',
        message: 'Số dư ' + c.name + ' vừa được Đỗ Quốc Huy cập nhật lúc 14:05.'
      };

      c.statementSent = done;
      state.data.trace.unshift({
        time: nowText(), actor: 'Phạm Thu Hà', action: 'Gửi bảng kê công nợ', tone: 'ok',
        note: c.name + ' · kỳ ' + res.period + (res.note ? '. ' + res.note : '')
      });
      render();
      if (!$('#drawer').hidden) openDrawer(c.id);
      toast('Đã gửi bảng kê', c.name + ' · kỳ ' + res.period + '.');
    } catch (err) {
      handleConflict(err, c);
    }
  }

  // ------------------------------------------------------------------
  // Ghi nhận thu tiền
  // ------------------------------------------------------------------
  async function recordPayment() {
    const c = state.data.customers.find(x => x.id === state.selectedId);
    if (!c) return;

    const res = await openModal({
      title: 'Ghi nhận thu tiền',
      html: 'Ghi nhận cho <strong>' + fmt.esc(c.name) + '</strong> · số dư hiện tại ' +
        '<strong>' + fmt.vnd(c.balance) + '</strong>. Tiền thu sẽ được trừ vào khoản nợ lâu nhất trước.',
      okText: 'Ghi nhận',
      mode: 'pay',
      validate: () => {
        const raw = parseInt($('#m-amount').value.replace(/\D/g, ''), 10);
        const ok = raw > 0 && raw <= c.balance;
        $('#pay-error').hidden = ok;
        $('#m-amount').classList.toggle('is-invalid', !ok);
        return ok;
      },
      collect: () => ({
        amount: parseInt($('#m-amount').value.replace(/\D/g, ''), 10),
        date: $('#m-date').value.trim() || nowText(),
        note: $('#m-paynote').value.trim()
      })
    });
    if (!res) return;

    try {
      const updated = api.balances
        ? await api.balances.recordPayment(c.id, res)
        : fakePayment(c, res);

      const idx = state.data.customers.findIndex(x => x.id === c.id);
      state.data.customers[idx] = hydrate(Object.assign({}, updated));
      state.data.trace.unshift({
        time: nowText(), actor: 'Phạm Thu Hà', action: 'Ghi nhận thu tiền', tone: 'info',
        note: c.name + ' · ' + fmt.vnd(res.amount) + (res.note ? '. ' + res.note : '')
      });
      render();
      openDrawer(c.id);
      toast('Đã ghi nhận thu tiền', fmt.vnd(res.amount) + ' · số dư còn lại ' +
        fmt.vnd(state.data.customers[idx].balance) + '.');
    } catch (err) {
      handleConflict(err, c);
    }
  }

  function fakePayment(c, res) {
    return new Promise(resolve => setTimeout(() => {
      const clone = JSON.parse(JSON.stringify(c));
      let left = res.amount;
      ['b4', 'b3', 'b2', 'b1'].forEach(k => {
        const cut = Math.min(clone.aging[k], left);
        clone.aging[k] -= cut;
        left -= cut;
      });
      clone.statement.unshift({
        date: res.date, ref: 'PT-2026-0388',
        desc: 'Thu tiền theo ghi nhận của kinh doanh', debit: 0, credit: res.amount
      });
      resolve(clone);
    }, 620));
  }

  // ------------------------------------------------------------------
  // Xung đột dữ liệu
  // ------------------------------------------------------------------
  function handleConflict(err, item) {
    if (err && err.code === 'CONFLICT') {
      if (item) item.stale = true;
      $('#conflict-text').innerHTML = '<strong>' + fmt.esc(err.message) +
        '</strong> Thao tác của bạn bị hủy vì dựa trên số liệu cũ. Hãy tải lại để xem số dư mới nhất.';
      $('#conflict-band').hidden = false;
      $('#conflict-band').scrollIntoView({ behavior: 'smooth', block: 'center' });
      render();
      return;
    }
    toast('Không hoàn tất được thao tác', (err && err.message) || 'Vui lòng thử lại.', 'error');
  }

  function nowText() {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' · ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;

    if (state.loading || state.error || state.empty || !state.data) return;
    renderKpis();
    renderTable();
    renderTrace();
  }

  // ------------------------------------------------------------------
  // Sự kiện
  // ------------------------------------------------------------------
  function bind() {
    $('#bal-body').addEventListener('click', e => {
      const tr = e.target.closest('tr[data-id]');
      if (tr) openDrawer(tr.dataset.id);
    });

    $$('.chip').forEach(b => b.addEventListener('click', () => {
      $$('.chip').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      state.filter = b.dataset.filter;
      renderTable();
    }));

    $$('.sort-th').forEach(b => b.addEventListener('click', () => {
      const key = b.dataset.sort;
      if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      else state.sort = { key: key, dir: key === 'name' ? 'asc' : 'desc' };
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
      state.empty = false;
      load();
    });
    $('#btn-retry').addEventListener('click', load);

    $('#dw-close').addEventListener('click', closeDrawer);
    $('#drawer').addEventListener('click', e => {
      if (e.target === $('#drawer')) closeDrawer();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer();
    });

    $('#dw-send').addEventListener('click', sendStatement);
    $('#dw-pay').addEventListener('click', recordPayment);
    $('#btn-send-all').addEventListener('click', sendStatement);
    $('#btn-export').addEventListener('click', () => {
      toast('Đang tạo báo cáo', 'Báo cáo công nợ kỳ 10/2026 sẽ được tải xuống trong ít giây.', 'warn');
    });

    $('#conflict-reload').addEventListener('click', () => {
      $('#conflict-band').hidden = true;
      load();
      toast('Đã tải bản mới nhất', 'Hãy kiểm tra số dư trước khi thao tác lại.');
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
      state.data = api.balances
        ? await api.balances.get()
        : JSON.parse(JSON.stringify(window.MOCK.balances));
      state.data.customers.forEach(hydrate);
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