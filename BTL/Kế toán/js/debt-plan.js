/**
 * debt-plan.js — Trang "Kế hoạch xử lý nợ"
 * Luồng duyệt 2 bước (đề xuất → duyệt/từ chối) + nhật ký hành động đầy đủ.
 * Mọi thao tác thay đổi trạng thái đều đi qua hộp thoại xác nhận.
 */
(function () {
  'use strict';

  if (!window.api || !window.fmt || !window.MOCK) {
    document.getElementById('plans-body').innerHTML =
      '<tr><td colspan="9"><div class="state-block"><p class="state-desc">Chưa nạp tệp dữ liệu mẫu (mock-data.js, utils.js, api.js).</p></div></td></tr>';
    document.getElementById('state-loading').hidden = true;
    return;
  }

  const api = window.api;
  const fmt = window.fmt;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  const PAGE_SIZE = 4;
  const STATUS = {
    pending:   { label: 'Chờ duyệt',       tone: 'warn' },
    approved:  { label: 'Đã duyệt',        tone: 'success' },
    executing: { label: 'Đang thực hiện',  tone: 'info' },
    rejected:  { label: 'Từ chối',         tone: 'danger' },
    draft:     { label: 'Bản nháp',        tone: 'neutral' }
  };
  const RAIL_STEPS = ['Dự thảo', 'Chờ duyệt', 'Đã duyệt', 'Hoàn tất'];

  const state = {
    role: 'manager',            // 'staff' | 'manager'
    tab: 'mine',
    page: 1,
    openId: null,
    loading: true,
    error: false,
    plans: [],
    filters: { q: '', method: '', status: '', from: '', to: '' }
  };

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
  // Modal (3 chế độ: xác nhận / tạo mới / lý do)
  // ------------------------------------------------------------------
  function openModal(opts) {
    return new Promise(resolve => {
      const modal = $('#modal');
      $('#modal-title').textContent = opts.title || 'Xác nhận';
      $('#modal-desc').innerHTML = opts.html || fmt.esc(opts.message || '');
      $('#modal-ok').textContent = opts.okText || 'Xác nhận';
      $('#modal-ok').className = 'btn ' + (opts.danger ? 'btn--danger' : 'btn--primary');
      $('#modal-cancel').textContent = opts.cancelText || 'Hủy bỏ';

      $('#modal-form').hidden = opts.mode !== 'create';
      $('#modal-reason').hidden = opts.mode !== 'reason';
      $('#modal-note').hidden = opts.mode !== 'approve';

      modal.hidden = false;
      setTimeout(() => {
        const first = modal.querySelector('.modal-form:not([hidden]) .input') || $('#modal-ok');
        first.focus();
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
        if (opts.mode === 'reason' && !$('#m-reason').value.trim()) {
          $('#reason-error').hidden = false;
          $('#m-reason').classList.add('is-invalid');
          $('#m-reason').focus();
          return;
        }
        cleanup(opts.collect ? opts.collect() : true);
      }
      function onCancel() { cleanup(opts.mode ? null : false); }
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
  // Bộ lọc & phân trang
  // ------------------------------------------------------------------
  function filtered() {
    const f = state.filters;
    const q = f.q.trim().toLowerCase();
    return state.plans.filter(p => {
      if (state.tab !== 'all' && p.role !== state.tab) return false;
      if (f.status && p.status !== f.status) return false;
      if (f.method && p.method !== f.method) return false;
      if (f.from && p.deadline < f.from) return false;
      if (f.to && p.deadline > f.to) return false;
      if (q) {
        const hay = (p.code + ' ' + p.customerName + ' ' + p.owner + ' ' + p.method).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderTabs() {
    ['mine', 'awaiting', 'team', 'all'].forEach(t => {
      const n = t === 'all'
        ? state.plans.length
        : state.plans.filter(p => p.role === t).length;
      const el = $('[data-count="' + t + '"]');
      if (el) el.textContent = n;
    });
    $$('.tab').forEach(b => {
      const on = b.dataset.tab === state.tab;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
  }

  function renderPager(total) {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > pages) state.page = pages;

    const start = total ? (state.page - 1) * PAGE_SIZE + 1 : 0;
    const end = Math.min(state.page * PAGE_SIZE, total);
    $('#pager-range').textContent = 'Hiển thị ' + start + '–' + end + ' / ' + total + ' kế hoạch';
    $('#result-count').textContent = total + ' kế hoạch';

    if (pages <= 1) { $('#pager').innerHTML = ''; $('#pager-foot').hidden = total === 0; return; }
    $('#pager-foot').hidden = false;

    let html = '<button class="pager-btn" data-page="prev" aria-label="Trang trước"' +
      (state.page === 1 ? ' disabled' : '') + '>‹</button>';

    for (let i = 1; i <= pages; i++) {
      if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - state.page) > 1) {
        if (html.indexOf('pager-ellip') === -1 || i === state.page + 2 || i === state.page - 2) {
          html += '<span class="pager-ellip">…</span>';
        }
        continue;
      }
      html += '<button class="pager-btn' + (i === state.page ? ' is-current' : '') +
        '" data-page="' + i + '" aria-label="Trang ' + i + '"' +
        (i === state.page ? ' aria-current="page"' : '') + '>' + i + '</button>';
    }

    html += '<button class="pager-btn" data-page="next" aria-label="Trang sau"' +
      (state.page === pages ? ' disabled' : '') + '>›</button>';
    $('#pager').innerHTML = html;
  }

  // ------------------------------------------------------------------
  // Render bảng
  // ------------------------------------------------------------------
  function railHtml(status) {
    const idx = { draft: 0, pending: 1, approved: 2, executing: 3, rejected: 1 }[status];
    const rejected = status === 'rejected';
    const steps = RAIL_STEPS.map((_, i) => {
      let cls = 'rail-step';
      if (rejected && i === 1) cls += ' is-rejected';
      else if (i < idx) cls += ' is-done';
      else if (i === idx) cls += ' is-current';
      return '<span class="' + cls + '"></span>';
    }).join('');
    return '<div class="rail-wrap"><div class="rail">' + steps + '</div></div>';
  }

  function traceHtml(trace) {
    return '<div class="trace">' + trace.map(t => `
      <div class="trace-item tone-${t.tone || 'info'}">
        <span class="trace-dot"></span>
        <p class="trace-time">${fmt.esc(t.time)}</p>
        <div class="trace-head">
          <span class="trace-action">${fmt.esc(t.action)}</span>
          <span class="trace-actor">bởi ${fmt.esc(t.actor)}</span>
        </div>
        ${t.note ? '<p class="trace-note">"' + fmt.esc(t.note) + '"</p>' : ''}
      </div>`).join('') + '</div>';
  }

  function fullRail(status) {
    const idx = { draft: 0, pending: 1, approved: 2, executing: 3, rejected: 1 }[status];
    const rejected = status === 'rejected';
    return '<div class="rail-full">' + RAIL_STEPS.map((name, i) => {
      let cls = 'rail-col';
      if (rejected && i === 1) cls += ' is-rejected';
      else if (i < idx) cls += ' is-done';
      else if (i === idx) cls += ' is-current';
      return `<div class="${cls}"><span class="rail-dot"></span><p class="rail-name">${name}</p></div>`;
    }).join('') + '</div>';
  }

  function detailHtml(p) {
    const canApprove = state.role === 'manager' && p.status === 'pending';
    return `
      <tr class="detail-row" data-detail="${p.id}">
        <td colspan="9">
          <div class="detail">
            <div>
              <p class="detail-title">Luồng xử lý</p>
              ${fullRail(p.status)}
              <p class="detail-title">Thông tin kế hoạch</p>
              <dl class="facts">
                <div class="fact"><dt>Mã kế hoạch</dt><dd class="mono">${fmt.esc(p.code)}</dd></div>
                <div class="fact"><dt>Khách hàng</dt><dd>${fmt.esc(p.customerName)}</dd></div>
                <div class="fact"><dt>Số tiền đề xuất</dt><dd class="mono">${fmt.vnd(p.amount)}</dd></div>
                <div class="fact"><dt>Phương án</dt><dd>${fmt.esc(p.method)}</dd></div>
                <div class="fact"><dt>Thời hạn hoàn tất</dt><dd class="mono">${fmt.date(p.deadline)}</dd></div>
                <div class="fact"><dt>Người phụ trách</dt><dd>${fmt.esc(p.owner)}</dd></div>
              </dl>
            </div>

            <div>
              <p class="detail-title">Nhật ký hành động</p>
              ${traceHtml(p.trace)}
            </div>

            <div class="detail-acts">
              ${canApprove
                ? `<button class="btn btn--primary btn--sm" data-act="approve" data-id="${p.id}">
                     <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                     Duyệt kế hoạch</button>
                   <button class="btn btn--ghost btn--sm" data-act="reject" data-id="${p.id}">Từ chối</button>`
                : `<span class="perm-note">
                     <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" stroke="currentColor" stroke-width="1.5"/></svg>
                     ${p.status !== 'pending'
                        ? 'Kế hoạch đã kết thúc luồng duyệt — chỉ còn theo dõi.'
                        : 'Chỉ Trưởng phòng Tài chính được phép duyệt / từ chối kế hoạch.'}
                   </span>`}
              <span class="spacer"></span>
              <button class="btn btn--ghost btn--sm" data-act="close-detail">Thu gọn</button>
            </div>
          </div>
        </td>
      </tr>`;
  }

  function render() {
    const list = filtered();
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const slice = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    const loading = $('#state-loading'), empty = $('#state-empty'), error = $('#state-error');
    loading.hidden = !state.loading;
    error.hidden = !state.error;
    empty.hidden = state.loading || state.error || total > 0;

    if (state.loading || state.error) {
      $('#plans-body').innerHTML = '';
      $('#pager-foot').hidden = true;
      renderTabs();
      return;
    }

    $('#plans-body').innerHTML = slice.map(p => {
      const st = STATUS[p.status] || STATUS.pending;
      const soon = p.deadline && p.deadline < window.MOCK.TODAY;
      return `
        <tr class="plan-row${state.openId === p.id ? ' is-open' : ''}${p.stale ? ' is-stale' : ''}" data-id="${p.id}">
          <td class="c-code"><a class="code-link" href="accountant-debt-plan.html?code=${p.code}">${fmt.esc(p.code)}</a></td>
          <td class="c-customer">
            <span class="cust-name">${fmt.esc(p.customerName)}</span>
            <span class="cust-code">${fmt.esc(p.customerId)}</span>
          </td>
          <td class="c-num"><span class="amount">${fmt.vnd(p.amount)}</span></td>
          <td class="c-method"><span class="method">${fmt.esc(p.method)}</span></td>
          <td class="c-date"><span class="date-cell${soon ? ' is-soon' : ''}">${fmt.date(p.deadline)}</span></td>
          <td class="c-owner">
            <span class="owner">
              <span class="owner-dot">${fmt.esc(p.owner.trim().charAt(0))}</span>
              ${fmt.esc(p.owner.split(' ').slice(-1)[0])}
            </span>
          </td>
          <td class="c-rail">${railHtml(p.status)}</td>
          <td class="c-status"><span class="stamp stamp--${st.tone}">${st.label}</span></td>
          <td class="c-act">
            <div class="row-acts">
              ${p.stale ? '<span class="stamp stamp--warn" title="Dữ liệu đã thay đổi">!</span>' : ''}
              <button class="icon-btn${state.openId === p.id ? ' is-open' : ''}" data-toggle="${p.id}"
                aria-label="Xem nhật ký ${fmt.esc(p.code)}" aria-expanded="${state.openId === p.id}">
                <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.5"/><path d="M12 7.5V12l3 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </div>
          </td>
        </tr>
        ${state.openId === p.id ? detailHtml(p) : ''}`;
    }).join('');

    renderTabs();
    renderPager(total);
  }

  // ------------------------------------------------------------------
  // Hành động duyệt / từ chối
  // ------------------------------------------------------------------
  async function approve(id) {
    const p = state.plans.find(x => x.id === id);
    const note = await openModal({
      title: 'Duyệt kế hoạch xử lý nợ?',
      html: 'Bạn xác nhận duyệt kế hoạch <strong>' + fmt.esc(p.code) + '</strong> của <strong>' +
        fmt.esc(p.customerName) + '</strong> với số tiền <strong>' + fmt.vnd(p.amount) +
        '</strong>.<br>Thao tác này sẽ được ghi vào nhật ký hoạt động.',
      okText: 'Duyệt kế hoạch',
      mode: 'approve',
      collect: () => ({ note: $('#m-approve-note').value.trim() })
    });
    if (!note) return;

    try {
      const updated = await api.debtPlans
        ? await api.debtPlans.approve(id, note.note)
        : fakeSave(id, 'approved', 'Duyệt kế hoạch', 'ok', note.note);
      applyLocal(updated, 'Duyệt kế hoạch', 'ok', note.note);
      toast('Đã duyệt kế hoạch', p.code + ' chuyển sang trạng thái Đã duyệt.');
    } catch (err) {
      handleActionError(err, p);
    }
  }

  async function reject(id) {
    const p = state.plans.find(x => x.id === id);
    const res = await openModal({
      title: 'Từ chối kế hoạch xử lý nợ?',
      html: 'Kế hoạch <strong>' + fmt.esc(p.code) + '</strong> sẽ bị trả về cho <strong>' +
        fmt.esc(p.owner) + '</strong>. Vui lòng nêu rõ lý do để người đề xuất biết cần bổ sung gì.',
      okText: 'Từ chối',
      danger: true,
      mode: 'reason',
      collect: () => ({ reason: $('#m-reason').value.trim() })
    });
    if (!res) return;

    try {
      const updated = await api.debtPlans
        ? await api.debtPlans.reject(id, res.reason)
        : fakeSave(id, 'rejected', 'Từ chối', 'bad', res.reason);
      applyLocal(updated, 'Từ chối', 'bad', res.reason);
      toast('Đã từ chối kế hoạch', p.code + ' được trả về ' + p.owner + '.', 'warn');
    } catch (err) {
      handleActionError(err, p);
    }
  }

  function fakeSave(id, status, action, tone, note) {
    return new Promise((resolve, reject) => setTimeout(() => {
      const p = state.plans.find(x => x.id === id);
      if (p.stale) return reject({
        code: 'CONFLICT',
        message: 'Kế hoạch ' + p.code + ' vừa được Lê Văn C cập nhật lúc 10:22.'
      });
      resolve(Object.assign({}, p, { status: status }));
    }, 620));
  }

  function applyLocal(updated, action, tone, note) {
    const idx = state.plans.findIndex(x => x.id === updated.id);
    const now = new Date();
    state.plans[idx] = Object.assign({}, state.plans[idx], updated, {
      trace: state.plans[idx].trace.concat([{
        time: now.toLocaleDateString('vi-VN') + ' · ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actor: state.role === 'manager' ? 'Trần Thị B' : 'Nguyễn Văn A',
        action: action, tone: tone, note: note
      }])
    });
    render();
  }

  function handleActionError(err, plan) {
    if (err && err.code === 'CONFLICT') {
      plan.stale = true;
      plan.trace.push({ time: '12/10/2026 · 10:22', actor: 'Lê Văn C', action: 'Cập nhật số tiền', tone: 'warn', note: 'Điều chỉnh số tiền đề xuất.' });
      $('#conflict-text').innerHTML =
        '<strong>' + fmt.esc(err.message) + '</strong> Bản của bạn dựa trên dữ liệu cũ nên thao tác bị hủy. ' +
        'Hãy tải lại để xem thay đổi trước khi duyệt.';
      $('#conflict-band').hidden = false;
      $('#conflict-band').scrollIntoView({ behavior: 'smooth', block: 'center' });
      render();
      return;
    }
    toast('Không hoàn tất được thao tác', (err && err.message) || 'Vui lòng thử lại.', 'error');
  }

  // ------------------------------------------------------------------
  // Tạo kế hoạch mới
  // ------------------------------------------------------------------
  async function createPlan() {
    const sel = $('#m-customer');
    if (sel.options.length <= 1) {
      try {
        const res = await api.customers.list({ pageSize: 100 });
        res.items.forEach(c => {
          const o = document.createElement('option');
          o.value = c.id; o.textContent = c.code + ' · ' + c.name;
          sel.appendChild(o);
        });
      } catch (e) { /* vẫn cho phép nhập tay */ }
    }

    const today = window.MOCK.TODAY;
    $('#m-deadline').value = today.slice(0, 8) + String(Math.min(31, parseInt(today.slice(8), 10) + 30)).padStart(2, '0');
    $('#m-amount').value = '';
    $('#m-note').value = '';
    $('#m-customer').value = '';

    const data = await openModal({
      title: 'Tạo kế hoạch xử lý nợ',
      html: 'Kế hoạch mới sẽ ở trạng thái <strong>Chờ duyệt</strong> và cần Trưởng phòng Tài chính phê duyệt trước khi thực hiện.',
      okText: 'Tạo và gửi duyệt',
      mode: 'create',
      collect: () => ({
        customerId: $('#m-customer').value,
        amount: parseInt(String($('#m-amount').value).replace(/[^\d]/g, ''), 10) || 0,
        deadline: $('#m-deadline').value,
        method: $('#m-method').value,
        note: $('#m-note').value.trim()
      })
    });
    if (!data) return;

    if (!data.customerId || !data.amount || !data.deadline) {
      toast('Chưa đủ thông tin', 'Cần chọn khách hàng, nhập số tiền và thời hạn.', 'error');
      return;
    }

    const cust = (state.customers || []).find(c => c.id === data.customerId);
    const now = new Date();
    const plan = {
      id: 'pl-' + Date.now(),
      code: 'KP-2026-' + String(20 + state.plans.length).padStart(3, '0'),
      customerId: data.customerId,
      customerName: cust ? cust.name : 'Khách hàng ' + data.customerId,
      amount: data.amount, method: data.method, deadline: data.deadline,
      owner: state.role === 'manager' ? 'Trần Thị B' : 'Nguyễn Văn A',
      role: 'mine', status: 'pending', stale: false,
      trace: [{
        time: now.toLocaleDateString('vi-VN') + ' · ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actor: state.role === 'manager' ? 'Trần Thị B' : 'Nguyễn Văn A',
        action: 'Tạo kế hoạch', tone: 'info', note: data.note
      }]
    };

    state.plans.unshift(plan);
    state.tab = 'mine';
    state.page = 1;
    render();
    toast('Đã tạo kế hoạch', plan.code + ' đã được gửi duyệt.');
  }

  // ------------------------------------------------------------------
  // Gắn sự kiện
  // ------------------------------------------------------------------
  function bind() {
    // Tabs
    $$('.tab').forEach(b => b.addEventListener('click', () => {
      state.tab = b.dataset.tab; state.page = 1; state.openId = null; render();
    }));

    // Bộ lọc
    const reFilter = () => {
      const f = state.filters;
      f.q = $('#f-search').value;
      f.method = $('#f-method').value;
      f.status = $('#f-status').value;
      f.from = $('#f-from').value;
      f.to = $('#f-to').value;
      state.page = 1;
      render();
    };
    ['#f-search', '#f-method', '#f-status', '#f-from', '#f-to'].forEach(s => {
      $(s).addEventListener('input', reFilter);
    });
    $('#btn-clear').addEventListener('click', () => {
      ['#f-search', '#f-method', '#f-status', '#f-from', '#f-to'].forEach(s => { $(s).value = ''; });
      state.filters = { q: '', method: '', status: '', from: '', to: '' };
      state.page = 1;
      render();
    });

    // Phân trang
    $('#pager').addEventListener('click', e => {
      const b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      const pages = Math.max(1, Math.ceil(filtered().length / PAGE_SIZE));
      if (b.dataset.page === 'prev') state.page = Math.max(1, state.page - 1);
      else if (b.dataset.page === 'next') state.page = Math.min(pages, state.page + 1);
      else state.page = parseInt(b.dataset.page, 10);
      render();
      $('.panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Bảng
    $('#plans-body').addEventListener('click', e => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        const id = toggle.dataset.toggle;
        state.openId = state.openId === id ? null : id;
        render();
        return;
      }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'approve') approve(act.dataset.id);
      else if (act.dataset.act === 'reject') reject(act.dataset.id);
      else if (act.dataset.act === 'close-detail') { state.openId = null; render(); }
    });

    // Nút
    $('#btn-create').addEventListener('click', createPlan);
    $('#btn-create-2').addEventListener('click', createPlan);
    $('#btn-retry').addEventListener('click', load);
    $('#btn-export').addEventListener('click', () => {
      toast('Đã chuẩn bị tệp Excel', filtered().length + ' kế hoạch sẽ được xuất ra tệp KP-' +
        window.MOCK.TODAY.replace(/-/g, '') + '.xlsx.', 'warn');
    });
    $('#conflict-reload').addEventListener('click', () => {
      $('#conflict-band').hidden = true;
      load();
      toast('Đã tải bản mới nhất', 'Hãy kiểm tra thay đổi trước khi duyệt lại.');
    });

    // Vai trò
    $$('.role-opt').forEach(b => b.addEventListener('click', () => {
      $$('.role-opt').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      state.role = b.dataset.role;
      const isManager = state.role === 'manager';
      $('#user-name').textContent = isManager ? 'Trần Thị B' : 'Nguyễn Văn A';
      $('#user-role').textContent = isManager ? 'Trưởng phòng Tài chính' : 'Kế toán';
      $('#user-avatar').textContent = isManager ? 'T' : 'A';
      $('.topbar-avatar').textContent = isManager ? 'T' : 'A';
      render();
      toast('Đã chuyển vai trò', isManager
        ? 'Bạn có quyền duyệt / từ chối kế hoạch.'
        : 'Vai trò Kế toán chỉ được tạo và theo dõi kế hoạch.', 'warn');
    }));
  }

  // ------------------------------------------------------------------
  // Nạp dữ liệu
  // ------------------------------------------------------------------
  async function load() {
    state.loading = true;
    state.error = false;
    render();

    try {
      const res = await api.debtPlans.list({});
      state.plans = res.items;
      const custs = await api.customers.list({ pageSize: 100 });
      state.customers = custs.items;
    } catch (e) {
      state.error = true;
    } finally {
      state.loading = false;
      render();
    }
  }

  (function init() {
    bind();
    load();
  })();
})();