/**
 * manager-overdue-invoices.js — Danh sách hóa đơn quá hạn (vai trò Quản lý)
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

  const TODAY = new Date(2026, 9, 12);          // 12/10/2026
  const params = new URLSearchParams(location.search);
  const demoState = params.get('state');         // empty | error

  const BUCKETS = {
    '1-30':  { label: '1 – 30 ngày', risk: 'low' },
    '31-60': { label: '31 – 60 ngày', risk: 'mid' },
    '61-90': { label: '61 – 90 ngày', risk: 'high' },
    '90+':   { label: 'Trên 90 ngày', risk: 'severe' }
  };

  const state = {
    loading: true, error: false, empty: false,
    all: [], view: [], page: 1, perPage: 8,
    filters: { q: '', bucket: 'all', owner: 'all', status: 'all', sort: 'days-desc' },
    selected: new Set(),
    open: null
  };

  // ------------------------------------------------------------------
  // Tiện ích
  // ------------------------------------------------------------------
  function parseDate(s) {
    const p = String(s).split('/').map(Number);
    return new Date(p[2], p[1] - 1, p[0]);
  }
  function daysLate(dueAt) {
    return Math.round((TODAY - parseDate(dueAt)) / 86400000);
  }
  function bucketOf(days) {
    if (days > 90) return '90+';
    if (days > 60) return '61-90';
    if (days > 30) return '31-60';
    return '1-30';
  }
  function statusStamp(s) {
    const map = (MOCK.DB.invoiceStatusMap || {})[s] ||
      { text: s, stamp: 'stamp--neutral' };
    return '<span class="stamp ' + map.stamp + '">' + fmt.esc(map.text) + '</span>';
  }
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
  // KPI + dải tuổi nợ
  // ------------------------------------------------------------------
  function renderKPI() {
    const all = state.all;
    const total = all.reduce((s, i) => s + i.remaining, 0);
    const over60 = all.filter(i => daysLate(i.dueAt) > 60);
    const dispute = all.filter(i => i.status === 'dispute');
    const promise = all.filter(i => i.promiseAmount > 0);
    const avgDays = all.length
      ? all.reduce((s, i) => s + daysLate(i.dueAt), 0) / all.length : 0;
    const maxDays = all.reduce((m, i) => Math.max(m, daysLate(i.dueAt)), 0);
    const sum = (arr) => arr.reduce((s, i) => s + i.remaining, 0);
    const sumPromise = promise.reduce((s, i) => s + i.promiseAmount, 0);

    $('#kpi-row').innerHTML = `
      <article class="kpi">
        <p class="kpi-label">Tổng giá trị quá hạn</p>
        <p class="kpi-value mono">${fmt.vnd(total)}</p>
        <p class="kpi-sub">${all.length} hóa đơn · ${new Set(all.map(i => i.customerId)).size} khách hàng</p>
      </article>
      <article class="kpi kpi--danger">
        <p class="kpi-label">Quá hạn trên 60 ngày</p>
        <p class="kpi-value mono">${fmt.vnd(sum(over60))}</p>
        <p class="kpi-sub">${over60.length} hóa đơn · ${fmt.percent(sum(over60) / total * 100)} tổng giá trị</p>
      </article>
      <article class="kpi kpi--danger">
        <p class="kpi-label">Tranh chấp / chờ xác nhận</p>
        <p class="kpi-value mono">${fmt.vnd(sum(dispute))}</p>
        <p class="kpi-sub">${dispute.length} hóa đơn · ${fmt.percent(sum(dispute) / total * 100)} tổng giá trị</p>
      </article>
      <article class="kpi kpi--ok">
        <p class="kpi-label">Khách cam kết thu</p>
        <p class="kpi-value mono">${fmt.vnd(sumPromise)}</p>
        <p class="kpi-sub">${promise.length} hóa đơn · hạn gần nhất 15/10/2026</p>
      </article>
      <article class="kpi kpi--warn">
        <p class="kpi-label">Số ngày quá hạn trung bình</p>
        <p class="kpi-value mono">${fmt.percent(avgDays).replace('%', '')} ngày</p>
        <p class="kpi-sub">Cao nhất ${maxDays} ngày · HD-2026-0731</p>
      </article>`;
  }

  function renderBand() {
    const all = state.all;
    const total = all.reduce((s, i) => s + i.remaining, 0) || 1;
    const groups = {};
    Object.keys(BUCKETS).forEach(k => { groups[k] = { amount: 0, count: 0, customers: new Set() }; });
    all.forEach(i => {
      const k = bucketOf(daysLate(i.dueAt));
      groups[k].amount += i.remaining;
      groups[k].count += 1;
      groups[k].customers.add(i.customerId);
    });

    $('#aging-band').innerHTML = Object.keys(BUCKETS).map(k => {
      const g = groups[k];
      const share = g.amount / total * 100;
      return `<div class="band-seg risk-${BUCKETS[k].risk}${state.filters.bucket === k ? ' is-active' : ''}"
                   data-bucket="${k}" style="width:${share.toFixed(2)}%"
                   role="button" tabindex="0"
                   aria-label="Nhóm ${fmt.esc(BUCKETS[k].label)}, ${fmt.vnd(g.amount, false)} đồng">
                <span>${fmt.percent(share)}</span>
              </div>`;
    }).join('');

    $('#band-legend').innerHTML = Object.keys(BUCKETS).map(k => {
      const g = groups[k];
      return `<div class="band-key risk-${BUCKETS[k].risk}${state.filters.bucket === k ? ' is-active' : ''}" data-bucket="${k}">
        <span class="band-key-name">${fmt.esc(BUCKETS[k].label)}</span>
        <span class="band-key-val">${fmt.vnd(g.amount)}</span>
        <span class="band-key-meta">${g.count} hóa đơn · ${g.customers.size} khách hàng</span>
      </div>`;
    }).join('');
  }

  // ------------------------------------------------------------------
  // Lọc / sắp xếp / bảng
  // ------------------------------------------------------------------
  function applyFilters() {
    const f = state.filters;
    const q = f.q.trim().toLowerCase();
    state.view = state.all.filter(i => {
      if (f.bucket !== 'all' && bucketOf(daysLate(i.dueAt)) !== f.bucket) return false;
      if (f.owner !== 'all' && i.owner !== f.owner) return false;
      if (f.status !== 'all' && i.status !== f.status) return false;
      if (q) {
        const hay = (i.code + ' ' + i.customerName + ' ' + i.customerId).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    const s = f.sort;
    state.view.sort((a, b) => {
      const da = daysLate(a.dueAt), db = daysLate(b.dueAt);
      if (s === 'days-desc') return db - da;
      if (s === 'days-asc') return da - db;
      if (s === 'amount-desc') return b.remaining - a.remaining;
      return a.remaining - b.remaining;
    });

    const maxPage = Math.max(1, Math.ceil(state.view.length / state.perPage));
    if (state.page > maxPage) state.page = maxPage;
  }

  function renderTable() {
    const rows = state.view;
    const total = rows.reduce((s, i) => s + i.remaining, 0);
    const allTotal = state.all.reduce((s, i) => s + i.remaining, 0);

    $('#filter-count').textContent = 'Hiển thị ' + rows.length + ' / ' + state.all.length +
      ' hóa đơn · ' + fmt.vnd(total) + (rows.length !== state.all.length ? ' / ' + fmt.vnd(allTotal) : '');
    $('#head-count').textContent = state.all.length + ' hóa đơn';

    $('#table-empty').hidden = rows.length !== 0;
    $('#inv-table').style.display = rows.length ? '' : 'none';

    const start = (state.page - 1) * state.perPage;
    const pageRows = rows.slice(start, start + state.perPage);

    $('#inv-rows').innerHTML = pageRows.map(i => {
      const days = daysLate(i.dueAt);
      const b = bucketOf(days);
      return `
      <tr data-id="${fmt.esc(i.id)}" class="${state.selected.has(i.id) ? 'is-selected' : ''}">
        <td class="col-check" data-label="Chọn">
          <input type="checkbox" data-check="${fmt.esc(i.id)}" ${state.selected.has(i.id) ? 'checked' : ''}
                 aria-label="Chọn hóa đơn ${fmt.esc(i.code)}">
        </td>
        <td data-label="Mã hóa đơn"><span class="inv-code">${fmt.esc(i.code)}</span></td>
        <td data-label="Khách hàng">
          <p class="cus-name">${fmt.esc(i.customerName)}</p>
          <p class="cus-code">${fmt.esc(i.customerId)}</p>
        </td>
        <td class="num" data-label="Hạn thanh toán"><span class="num-mono">${fmt.esc(i.dueAt)}</span></td>
        <td class="num" data-label="Số ngày quá hạn">
          <span class="day-badge b-${b === '90+' ? '90p' : b}">${days} ngày</span>
        </td>
        <td data-label="Nhóm tuổi nợ">
          <span class="bucket-tag risk-${BUCKETS[b].risk}"><i></i>${fmt.esc(BUCKETS[b].label)}</span>
        </td>
        <td class="num" data-label="Còn phải thu"><span class="amt-remain">${fmt.vnd(i.remaining)}</span></td>
        <td data-label="Cam kết thu">
          ${i.promiseAmount
            ? `<p class="promise">${fmt.esc(i.promiseDate)}<br>${fmt.vnd(i.promiseAmount)}</p>`
            : '<p class="promise--none">Chưa có</p>'}
        </td>
        <td data-label="Phụ trách"><span class="owner-cell">${fmt.esc(i.owner)}</span></td>
        <td data-label="Trạng thái">${statusStamp(i.status)}</td>
      </tr>`;
    }).join('');

    // Phân trang
    const maxPage = Math.max(1, Math.ceil(rows.length / state.perPage));
    $('#page-info').textContent = 'Trang ' + state.page + ' / ' + maxPage +
      ' · ' + rows.length + ' hóa đơn';
    let html = '<button class="page-btn" data-page="' + (state.page - 1) + '"' +
      (state.page === 1 ? ' disabled' : '') + '>Trước</button>';
    for (let p = 1; p <= maxPage; p++) {
      html += '<button class="page-btn' + (p === state.page ? ' is-active' : '') +
        '" data-page="' + p + '">' + p + '</button>';
    }
    html += '<button class="page-btn" data-page="' + (state.page + 1) + '"' +
      (state.page === maxPage ? ' disabled' : '') + '>Sau</button>';
    $('#pager').innerHTML = html;

    // Sắp xếp trên tiêu đề cột
    $$('.th-sort').forEach(b => b.classList.toggle('is-sorted',
      b.dataset.sort === 'days' ? state.filters.sort.indexOf('days') === 0
        : state.filters.sort.indexOf('amount') === 0));

    renderBulk();
  }

  function renderBulk() {
    const ids = Array.from(state.selected);
    const items = state.all.filter(i => ids.indexOf(i.id) !== -1);
    const value = items.reduce((s, i) => s + i.remaining, 0);
    $('#bulk-bar').hidden = items.length === 0;
    $('#bulk-count').textContent = items.length;
    $('#bulk-value').textContent = fmt.vnd(value);

    const pageRows = state.view.slice((state.page - 1) * state.perPage, state.page * state.perPage);
    $('#sel-all').checked = pageRows.length > 0 && pageRows.every(i => state.selected.has(i.id));
    $('#sel-all').indeterminate = pageRows.some(i => state.selected.has(i.id)) &&
      !pageRows.every(i => state.selected.has(i.id));
  }

  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;
    if (state.loading || state.error || state.empty || !state.all.length) return;
    renderKPI();
    renderBand();
    applyFilters();
    renderTable();
  }

  // ------------------------------------------------------------------
  // Drawer chi tiết hóa đơn
  // ------------------------------------------------------------------
  function defaultTimeline(inv) {
    const t = [
      { date: inv.issuedAt, user: 'Hệ thống', type: 'system',
        text: 'Phát hành hóa đơn ' + fmt.vnd(inv.total) + ' cho ' + inv.customerName },
      { date: inv.dueAt, user: 'Hệ thống', type: 'system',
        text: 'Hóa đơn đến hạn thanh toán, còn phải thu ' + fmt.vnd(inv.remaining) }
    ];
    if (inv.lastContact) {
      const parts = String(inv.lastContact).split(' · ');
      t.push({ date: parts[0], user: inv.owner, type: 'call', text: parts[1] || 'Liên hệ khách hàng' });
    }
    if (inv.promiseAmount) {
      t.push({ date: '12/10/2026', user: inv.owner, type: 'note',
        text: 'Khách cam kết thu ' + fmt.vnd(inv.promiseAmount) + ' trước ' + inv.promiseDate });
    }
    return t;
  }

  function openDrawer(id) {
    const inv = state.all.filter(i => i.id === id)[0];
    if (!inv) return;
    state.open = id;

    const days = daysLate(inv.dueAt);
    const b = bucketOf(days);
    const paidShare = inv.total ? (inv.paid / inv.total * 100) : 0;
    const tl = inv.timeline || defaultTimeline(inv);

    $('#drawer-title').textContent = inv.code;
    $('#drawer-body').innerHTML = `
      <div class="d-sum">
        <div>
          <p class="detail-title">Còn phải thu</p>
          <p class="d-sum-val">${fmt.vnd(inv.remaining)}</p>
        </div>
        <p class="d-sum-note">Quá hạn ${days} ngày<br>${fmt.esc(BUCKETS[b].label)}</p>
      </div>

      <div class="d-block">
        <p class="detail-title">Giá trị hóa đơn</p>
        <div class="d-bar">
          <span class="paid" style="width:${paidShare.toFixed(1)}%"></span>
          <span class="left" style="width:${(100 - paidShare).toFixed(1)}%"></span>
        </div>
        <div class="d-bar-legend">
          <span><i class="paid" style="background:var(--green)"></i>Đã thu ${fmt.vnd(inv.paid)}</span>
          <span><i class="left" style="background:var(--sienna)"></i>Còn nợ ${fmt.vnd(inv.remaining)}</span>
          <span>Tổng ${fmt.vnd(inv.total)}</span>
        </div>
      </div>

      <div class="d-block">
        <p class="detail-title">Thông tin</p>
        <dl class="d-grid">
          <dt class="d-k">Khách hàng</dt>
          <dd class="d-v"><a href="../../Kinh%20doanh/html/sales-customer-detail.html?id=${fmt.esc(inv.customerId)}">${fmt.esc(inv.customerName)}</a>
            <span class="mono"> · ${fmt.esc(inv.customerId)}</span></dd>
          <dt class="d-k">Ngày phát hành</dt>
          <dd class="d-v"><span class="mono">${fmt.esc(inv.issuedAt)}</span></dd>
          <dt class="d-k">Hạn thanh toán</dt>
          <dd class="d-v"><span class="mono">${fmt.esc(inv.dueAt)}</span> — quá hạn ${days} ngày</dd>
          <dt class="d-k">Người phụ trách</dt>
          <dd class="d-v">${fmt.esc(inv.owner)}</dd>
          <dt class="d-k">Trạng thái</dt>
          <dd class="d-v">${statusStamp(inv.status)} ${fmt.esc(inv.statusText || '')}</dd>
          <dt class="d-k">Cam kết thu</dt>
          <dd class="d-v">${inv.promiseAmount
            ? '<span class="mono">' + fmt.esc(inv.promiseDate) + ' · ' + fmt.vnd(inv.promiseAmount) + '</span>'
            : '<span class="promise--none">Chưa chốt lịch thanh toán</span>'}</dd>
          ${inv.caseId ? '<dt class="d-k">Hồ sơ</dt><dd class="d-v"><a class="d-case" href="manager-pending-approvals.html#' +
            fmt.esc(inv.caseId) + '">' + fmt.esc(inv.caseId) + ' · chờ phê duyệt →</a></dd>' : ''}
        </dl>
      </div>

      <div class="d-block">
        <p class="detail-title">Lịch sử theo dõi</p>
        <div class="tl">
          ${tl.slice().reverse().map(t => `
            <div class="tl-item tl-${fmt.esc(t.type)}">
              <div class="tl-head">
                <span class="tl-date">${fmt.esc(t.date)}</span>
                <span class="tl-user">${fmt.esc(t.user)}</span>
                <span class="tl-type">${fmt.esc(t.type)}</span>
              </div>
              <p class="tl-text">${fmt.esc(t.text)}</p>
            </div>`).join('')}
        </div>
      </div>`;

    $('#drawer-foot').innerHTML = `
      <button class="btn btn--primary" type="button" data-drawer="remind">Gửi nhắc nợ</button>
      <button class="btn btn--ghost" type="button" data-drawer="extend">Tạo yêu cầu gia hạn</button>
      <a class="btn btn--ghost" href="../../Kinh%20doanh/html/sales-invoice-detail.html?id=${fmt.esc(inv.code)}">Xem hóa đơn</a>`;

    $('#drawer').hidden = false;
    $('#drawer-overlay').hidden = false;
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#drawer-close').focus();
  }

  function closeDrawer() {
    $('#drawer').hidden = true;
    $('#drawer-overlay').hidden = true;
    $('#drawer').setAttribute('aria-hidden', 'true');
    state.open = null;
  }

  // ------------------------------------------------------------------
  // Sự kiện
  // ------------------------------------------------------------------
  function bind() {
    const sync = () => { state.page = 1; applyFilters(); renderTable(); };

    $('#f-search').addEventListener('input', e => { state.filters.q = e.target.value; sync(); });
    $('#f-bucket').addEventListener('change', e => {
      state.filters.bucket = e.target.value; renderBand(); sync();
    });
    $('#f-owner').addEventListener('change', e => { state.filters.owner = e.target.value; sync(); });
    $('#f-status').addEventListener('change', e => { state.filters.status = e.target.value; sync(); });
    $('#f-sort').addEventListener('change', e => { state.filters.sort = e.target.value; sync(); });

    function clearFilters() {
      state.filters = { q: '', bucket: 'all', owner: 'all', status: 'all', sort: 'days-desc' };
      $('#f-search').value = ''; $('#f-bucket').value = 'all'; $('#f-owner').value = 'all';
      $('#f-status').value = 'all'; $('#f-sort').value = 'days-desc';
      renderBand(); sync();
    }
    $('#btn-clear').addEventListener('click', clearFilters);
    $('#btn-empty-clear').addEventListener('click', clearFilters);

    // Delegation trong vùng dữ liệu
    $('#data-area').addEventListener('click', function (e) {
      const seg = e.target.closest('[data-bucket]');
      if (seg) {
        const k = seg.dataset.bucket;
        state.filters.bucket = (state.filters.bucket === k) ? 'all' : k;
        $('#f-bucket').value = state.filters.bucket;
        renderBand(); sync();
        return;
      }
      const pageBtn = e.target.closest('[data-page]');
      if (pageBtn && !pageBtn.disabled) {
        state.page = Number(pageBtn.dataset.page);
        renderTable();
        return;
      }
      const sortBtn = e.target.closest('[data-sort]');
      if (sortBtn) {
        const key = sortBtn.dataset.sort;
        const cur = state.filters.sort;
        state.filters.sort = (cur === key + '-desc') ? key + '-asc' : key + '-desc';
        $('#f-sort').value = state.filters.sort;
        sync();
        return;
      }
      const bulkBtn = e.target.closest('[data-bulk]');
      if (bulkBtn) {
        const ids = Array.from(state.selected);
        const value = state.all.filter(i => ids.indexOf(i.id) !== -1)
          .reduce((s, i) => s + i.remaining, 0);
        const kind = bulkBtn.dataset.bulk;
        if (kind === 'clear') { state.selected.clear(); renderTable(); return; }
        const label = {
          remind: 'Đã gửi nhắc nợ', owner: 'Yêu cầu chuyển phụ trách đã tạo',
          flag: 'Đã gắn cờ hồ sơ bất thường', export: 'Đang tạo tệp xuất'
        }[kind];
        toast(label, ids.length + ' hóa đơn · ' + fmt.vnd(value) +
          (kind === 'export' ? ' — tệp sẽ sẵn sàng sau ít giây.' : ' — bản ghi đã ghi vào nhật ký.'), 'warn');
        if (kind !== 'export') { state.selected.clear(); renderTable(); }
        return;
      }
      const check = e.target.closest('[data-check]');
      if (check) {
        const id = check.dataset.check;
        if (check.checked) state.selected.add(id); else state.selected.delete(id);
        check.closest('tr').classList.toggle('is-selected', check.checked);
        renderBulk();
        return;
      }
      const row = e.target.closest('tr[data-id]');
      if (row) openDrawer(row.dataset.id);
    });

    $('#sel-all').addEventListener('change', function () {
      const pageRows = state.view.slice((state.page - 1) * state.perPage, state.page * state.perPage);
      pageRows.forEach(i => { if (this.checked) state.selected.add(i.id); else state.selected.delete(i.id); });
      renderTable();
    });

    $('#drawer-close').addEventListener('click', closeDrawer);
    $('#drawer-overlay').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.open) closeDrawer();
    });
    $('#drawer-foot').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-drawer]');
      if (!btn) return;
      const inv = state.all.filter(i => i.id === state.open)[0];
      if (!inv) return;
      if (btn.dataset.drawer === 'remind') {
        inv.lastContact = '12/10/2026 · Gửi nhắc nợ từ danh sách quản lý';
        (inv.timeline = inv.timeline || defaultTimeline(inv)).push(
          { date: '12/10/2026', user: 'Lê Minh Tuấn', type: 'mail', text: 'Gửi nhắc nợ thủ công từ danh sách hóa đơn quá hạn' });
        toast('Đã gửi nhắc nợ', inv.code + ' · ' + inv.customerName, 'warn');
        openDrawer(inv.id);
      } else {
        toast('Đã tạo yêu cầu gia hạn', inv.code + ' chờ bạn duyệt tại Hồ sơ chờ duyệt.', 'warn');
      }
    });

    $('#btn-export').addEventListener('click', () => {
      toast('Đang tạo tệp xuất', 'Danh sách ' + state.view.length + ' hóa đơn quá hạn sẽ sẵn sàng sau ít giây.', 'warn');
    });
    $('#btn-retry').addEventListener('click', load);
    $('#btn-empty-clear').addEventListener('click', clearFilters);
  }

  // ------------------------------------------------------------------
  // Nạp dữ liệu
  // ------------------------------------------------------------------
  async function load() {
    state.loading = true;
    state.error = false;
    render();

    try {
      state.all = api.invoices
        ? await api.invoices.getOverdue()
        : JSON.parse(JSON.stringify(window.MOCK.overdueInvoices));
    } catch (e) {
      state.error = true;
    } finally {
      state.loading = false;
      if (demoState === 'error') state.error = true;
      if (demoState === 'empty') state.empty = true;
      render();
    }
  }

  (function init() {
    // Nạp danh sách người phụ trách vào bộ lọc
    (MOCK.DB.overdueInvoiceOwners || []).forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.name;
      opt.textContent = o.name + ' · ' + o.role;
      $('#f-owner').appendChild(opt);
    });
    bind();
    load();
  })();
})();