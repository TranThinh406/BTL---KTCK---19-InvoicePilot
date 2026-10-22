/**
 * invoice-list.js — Trang "Hóa đơn (Danh sách)"
 * Nguồn dữ liệu duy nhất: window.api  (mock / backend thật đều chạy được)
 */
(function () {
  'use strict';

  // -------------------------------------------------------------------
  // 0. Kiểm tra môi trường
  // -------------------------------------------------------------------
  if (!window.api || !window.fmt || !window.MOCK) {
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('tbody').innerHTML =
        renderError({ code: 'NO_DATA', message: 'Chưa nạp tệp dữ liệu mẫu (mock-data.js, utils.js, api.js).' });
    });
    return;
  }

  const fmt = window.fmt;
  const api = window.api;
  const TODAY = window.MOCK.TODAY;

  // -------------------------------------------------------------------
  // 1. Trạng thái trang
  // -------------------------------------------------------------------
  const state = {
    q: '',
    status: '',
    from: '',
    to: '',
    customerId: '',
    overdueOnly: false,
    sortKey: 'issueDate',
    sortDir: 'desc',
    page: 1,
    pageSize: 10,
    selected: new Set(),
    customers: {}
  };

  // -------------------------------------------------------------------
  // 2. DOM helpers
  // -------------------------------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const tbody = $('#tbody');
  const footInfo = $('#foot-info');
  const pager = $('#pager');
  const bulkbar = $('#bulkbar');

  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), ms);
    };
  }

  // -------------------------------------------------------------------
  // 3. Toast
  // -------------------------------------------------------------------
  function toast(title, desc, tone) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (tone ? ' toast--' + tone : '');
    el.innerHTML =
      '<p class="toast-title">' + fmt.esc(title) + '</p>' +
      (desc ? '<p class="toast-desc">' + fmt.esc(desc) + '</p>' : '');
    box.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 220);
    }, 3400);
  }

  // -------------------------------------------------------------------
  // 4. Các trạng thái bảng (loading / empty / error)
  // -------------------------------------------------------------------
  function renderSkeleton(rows) {
    let html = '';
    for (let i = 0; i < (rows || 8); i++) {
      html += '<tr>' +
        '<td class="col-check"><div class="skeleton skeleton--sm"></div></td>' +
        '<td class="col-code"><div class="skeleton skeleton--lg"></div></td>' +
        '<td class="col-cust"><div class="skeleton skeleton--md"></div></td>' +
        '<td class="col-date"><div class="skeleton skeleton--lg"></div></td>' +
        '<td class="col-date"><div class="skeleton skeleton--lg"></div></td>' +
        '<td class="col-num"><div class="skeleton skeleton--lg" style="margin-left:auto"></div></td>' +
        '<td class="col-num"><div class="skeleton skeleton--md" style="margin-left:auto"></div></td>' +
        '<td class="col-num"><div class="skeleton skeleton--lg" style="margin-left:auto"></div></td>' +
        '<td class="col-status"><div class="skeleton skeleton--md"></div></td>' +
        '<td class="col-actions"></td>' +
        '</tr>';
    }
    return html;
  }

  function renderEmpty(isFiltered) {
    return '<tr><td colspan="10">' +
      '<div class="state">' +
        '<div class="state-art">' +
          '<svg viewBox="0 0 120 120" fill="none" aria-hidden="true">' +
            '<rect x="22" y="14" width="58" height="82" rx="4" stroke="currentColor" stroke-width="3"/>' +
            '<path d="M34 34h34M34 48h34M34 62h22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
            '<circle cx="76" cy="76" r="18" stroke="currentColor" stroke-width="3"/>' +
            '<path d="M89 89l13 13" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
          '</svg>' +
        '</div>' +
        '<h3 class="state-title">' + (isFiltered ? 'Không tìm thấy kết quả' : 'Chưa có hóa đơn nào') + '</h3>' +
        '<p class="state-desc">' +
          (isFiltered
            ? 'Thử xóa bộ lọc hoặc tìm với từ khóa khác. Hiện tại bạn đang lọc theo ' + filterSummary() + '.'
            : 'Bắt đầu bằng cách tạo hóa đơn đầu tiên cho khách hàng của bạn.') +
        '</p>' +
        (isFiltered
          ? '<button class="btn btn--ghost" type="button" id="empty-reset">Xóa bộ lọc</button>'
          : '<a class="btn btn--primary" href="accountant-invoice-form.html">Tạo hóa đơn đầu tiên</a>') +
      '</div>' +
      '</td></tr>';
  }

  function renderError(err) {
    return '<tr><td colspan="10">' +
      '<div class="state state--error">' +
        '<div class="state-art">' +
          '<svg viewBox="0 0 120 120" fill="none" aria-hidden="true">' +
            '<path d="M60 16 12 104h96L60 16z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>' +
            '<path d="M60 52v22" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
            '<circle cx="60" cy="88" r="3.6" fill="currentColor"/>' +
          '</svg>' +
        '</div>' +
        '<h3 class="state-title">Không tải được dữ liệu</h3>' +
        '<p class="state-desc">' + fmt.esc(err && err.message ? err.message : 'Đã có lỗi xảy ra.') + '</p>' +
        '<p class="state-code">Mã lỗi: ' + fmt.esc(err && err.code ? err.code : 'UNKNOWN') + '</p>' +
        '<button class="btn btn--primary" type="button" id="btn-retry">Thử lại</button>' +
      '</div>' +
      '</td></tr>';
  }

  function filterSummary() {
    const parts = [];
    if (state.q) parts.push('từ khóa "' + state.q + '"');
    if (state.status) parts.push('trạng thái ' + fmt.statusLabel(state.status));
    if (state.customerId) parts.push('khách hàng đã chọn');
    if (state.from || state.to) parts.push('khoảng ngày');
    if (state.overdueOnly) parts.push('chỉ hiện quá hạn');
    return parts.length ? parts.join(', ') : 'bộ lọc hiện tại';
  }

  // -------------------------------------------------------------------
  // 5. Render hàng
  // -------------------------------------------------------------------
  function rowHTML(inv) {
    const cust = state.customers[inv.customerId] || {};
    const lateDays = fmt.daysBetween(inv.dueDate, TODAY);
    const dueTone = lateDays > 0 ? 'is-late' : (lateDays >= -7 ? 'is-soon' : '');

    return '<tr data-id="' + fmt.esc(inv.id) + '" data-code="' + fmt.esc(inv.code) + '" tabindex="0">' +
      '<td class="col-check">' +
        '<label class="check">' +
          '<input type="checkbox" class="row-check" value="' + fmt.esc(inv.id) + '" aria-label="Chọn ' + fmt.esc(inv.code) + '">' +
          '<span class="check-box"></span>' +
        '</label>' +
      '</td>' +
      '<td class="col-code"><a class="code-link" href="accountant-invoice-form.html?code=' + fmt.esc(inv.code) + '">' + fmt.esc(inv.code) + '</a></td>' +
      '<td class="col-cust">' +
        '<div class="cust-name">' + fmt.esc(cust.name || 'Không xác định') + '</div>' +
        '<div class="cust-sub">' + fmt.esc(cust.code || '—') + '</div>' +
      '</td>' +
      '<td class="col-date">' + fmt.date(inv.issueDate) + '</td>' +
      '<td class="col-date">' + fmt.date(inv.dueDate) +
        '<div class="due-sub ' + dueTone + '">' + fmt.dueText(inv.dueDate) + '</div>' +
      '</td>' +
      '<td class="col-num strong">' + fmt.vnd(inv.total) + '</td>' +
      '<td class="col-num">' + (inv.paidAmount ? fmt.vnd(inv.paidAmount) : '—') + '</td>' +
      '<td class="col-num strong">' + fmt.vnd(inv.remaining) + '</td>' +
      '<td class="col-status"><span class="stamp stamp--' + fmt.statusTone(inv.status) + '">' + fmt.statusLabel(inv.status) + '</span></td>' +
      '<td class="col-actions">' +
        '<div class="row-actions">' +
          '<a class="icon-btn" href="accountant-invoice-form.html?code=' + fmt.esc(inv.code) + '" aria-label="Mở hóa đơn ' + fmt.esc(inv.code) + '">' +
            '<svg viewBox="0 0 24 24" fill="none"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.8" stroke="currentColor" stroke-width="1.6"/></svg>' +
          '</a>' +
          '<a class="icon-btn" href="accountant-invoice-form.html?code=' + fmt.esc(inv.code) + '" aria-label="Sửa ' + fmt.esc(inv.code) + '">' +
            '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L19.5 8.5a2.1 2.1 0 10-3-3L5 17v3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
          '</a>' +
          '<button class="icon-btn js-remind" type="button" data-code="' + fmt.esc(inv.code) + '" aria-label="Nhắc nợ ' + fmt.esc(inv.code) + '">' +
            '<svg viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 18a2 2 0 004 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  // -------------------------------------------------------------------
  // 6. Tải & hiển thị
  // -------------------------------------------------------------------
  async function load() {
    $('#table').setAttribute('aria-busy', 'true');
    tbody.innerHTML = renderSkeleton(state.pageSize > 10 ? 10 : state.pageSize);

    try {
      const res = await api.invoices.list({
        q: state.q,
        status: state.status ? [state.status] : [],
        from: state.from,
        to: state.to,
        sort: state.sortKey + ':' + state.sortDir,
        page: state.page,
        pageSize: state.pageSize
      });

      let items = res.items;
      if (state.customerId) items = items.filter(i => i.customerId === state.customerId);
      if (state.overdueOnly) items = items.filter(i => i.status === 'overdue');

      if (items.length === 0) {
        const hasFilter = state.q || state.status || state.from || state.to || state.customerId || state.overdueOnly;
        tbody.innerHTML = renderEmpty(!!hasFilter);
        footInfo.innerHTML = 'Hiển thị <strong>0</strong> hóa đơn';
        pager.innerHTML = '';
      } else {
        tbody.innerHTML = items.map(rowHTML).join('');
        const from = (res.page - 1) * res.pageSize + 1;
        const to = Math.min(res.page * res.pageSize, res.total);
        footInfo.innerHTML = 'Hiển thị <strong>' + from + '–' + to + '</strong> trên <strong>' + res.total + '</strong> hóa đơn';
        renderPager(res);
      }

      syncSelection();
    } catch (err) {
      tbody.innerHTML = renderError(err);
      footInfo.innerHTML = 'Không có dữ liệu';
      pager.innerHTML = '';
    } finally {
      $('#table').setAttribute('aria-busy', 'false');
    }
  }

  function renderPager(res) {
    const total = res.totalPages;
    const cur = res.page;
    let html = '<button class="page-btn page-btn--nav" data-page="' + (cur - 1) + '"' + (cur <= 1 ? ' disabled' : '') + '>Trước</button>';

    const window_ = [];
    for (let p = 1; p <= total; p++) {
      if (p === 1 || p === total || Math.abs(p - cur) <= 1) window_.push(p);
      else if (window_[window_.length - 1] !== '…') window_.push('…');
    }
    window_.forEach(p => {
      if (p === '…') html += '<button class="page-btn" disabled>…</button>';
      else html += '<button class="page-btn' + (p === cur ? ' is-current' : '') + '" data-page="' + p + '"' +
        (p === cur ? ' aria-current="page"' : '') + '>' + p + '</button>';
    });

    html += '<button class="page-btn page-btn--nav" data-page="' + (cur + 1) + '"' + (cur >= total ? ' disabled' : '') + '>Sau</button>';
    pager.innerHTML = html;
  }

  // -------------------------------------------------------------------
  // 7. Chọn hàng & thanh thao tác hàng loạt
  // -------------------------------------------------------------------
  function syncSelection() {
    const checks = $$('.row-check');
    checks.forEach(c => {
      c.checked = state.selected.has(c.value);
      c.closest('tr').classList.toggle('is-selected', c.checked);
    });

    const visible = checks.map(c => c.value);
    const all = visible.length > 0 && visible.every(v => state.selected.has(v));
    const some = visible.some(v => state.selected.has(v));
    const header = $('#check-all');
    header.checked = all;
    header.indeterminate = !all && some;

    const n = state.selected.size;
    $('#bulk-count').textContent = n;
    bulkbar.hidden = n === 0;
  }

  // -------------------------------------------------------------------
  // 8. Xuất CSV (thực sự tải file)
  // -------------------------------------------------------------------
  function exportCsv(rows, filename) {
    const header = ['Mã HĐ', 'Khách hàng', 'Ngày phát hành', 'Hạn thanh toán', 'Tổng tiền', 'Đã thu', 'Còn nợ', 'Trạng thái'];
    const lines = [header.join(',')];
    rows.forEach(inv => {
      const cust = state.customers[inv.customerId] || {};
      lines.push([
        inv.code,
        '"' + (cust.name || '').replace(/"/g, '""') + '"',
        fmt.date(inv.issueDate),
        fmt.date(inv.dueDate),
        inv.total,
        inv.paidAmount,
        inv.remaining,
        fmt.statusLabel(inv.status)
      ].join(','));
    });

    // BOM để Excel hiển thị đúng tiếng Việt
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || ('hoa-don-' + TODAY + '.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // -------------------------------------------------------------------
  // 9. Nạp danh sách khách hàng (dùng cho tên + bộ lọc)
  // -------------------------------------------------------------------
  async function loadCustomers() {
    const res = await api.customers.list({ pageSize: 200 });
    const map = {};
    res.items.forEach(c => { map[c.id] = c; });
    state.customers = map;

    const sel = $('#f-customer');
    res.items.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.code + ' · ' + c.name;
      sel.appendChild(opt);
    });
  }

  // -------------------------------------------------------------------
  // 10. Nạp KPI
  // -------------------------------------------------------------------
  async function loadStats() {
    try {
      const s = await api.stats.receivable();
      $('#kpi-debt').textContent = fmt.vnd(s.totalDebt);
      $('#kpi-count').textContent = s.invoiceCount;
      $('#kpi-debt-note').textContent = fmt.vndShort(s.collected) + ' đã thu';
      $('#kpi-overdue').textContent = fmt.vnd(s.overdue);
      $('#kpi-overdue-note').textContent = s.overdueInvoiceCount + ' hóa đơn';
      $('#kpi-due').textContent = fmt.vnd(s.dueSoon);
      $('#kpi-rate').textContent = s.collectionRate + '%';
      requestAnimationFrame(() => {
        $('#kpi-bar').style.width = Math.min(100, s.collectionRate) + '%';
      });
    } catch (e) {
      $('#kpi-debt').textContent = '—';
    }
  }

  // -------------------------------------------------------------------
  // 11. Gắn sự kiện
  // -------------------------------------------------------------------
  function bindEvents() {

    // --- Tìm kiếm (debounce 300ms) ---
    $('#search').addEventListener('input', debounce(function (e) {
      state.q = e.target.value.trim();
      state.page = 1;
      load();
    }, 300));

    // --- Chip trạng thái ---
    $('#chip-row').addEventListener('click', function (e) {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      state.status = chip.dataset.status;
      state.page = 1;
      load();
    });

    // --- Sắp xếp ---
    $$('th[data-sort]').forEach(th => {
      th.addEventListener('click', function () {
        const key = th.dataset.sort;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortKey = key;
          state.sortDir = 'desc';
        }
        $$('th[data-sort]').forEach(t => t.classList.remove('is-sorted', 'asc', 'desc'));
        th.classList.add('is-sorted', state.sortDir);
        load();
      });
    });

    // --- Popover bộ lọc ---
    const pop = $('#filter-pop');
    const btnFilter = $('#btn-filter');
    function closePop() {
      pop.hidden = true;
      btnFilter.setAttribute('aria-expanded', 'false');
    }
    btnFilter.addEventListener('click', function (e) {
      e.stopPropagation();
      const willOpen = pop.hidden;
      pop.hidden = !willOpen;
      btnFilter.setAttribute('aria-expanded', String(willOpen));
    });
    $('#filter-close').addEventListener('click', closePop);
    document.addEventListener('click', function (e) {
      if (!pop.hidden && !pop.contains(e.target) && e.target !== btnFilter) closePop();
    });

    $('#f-apply').addEventListener('click', function () {
      state.from = $('#f-from').value;
      state.to = $('#f-to').value;
      state.customerId = $('#f-customer').value;
      state.overdueOnly = $('#f-overdue-only').checked;
      state.page = 1;

      const n = [state.from, state.to, state.customerId, state.overdueOnly ? 1 : 0]
        .filter(Boolean).length;
      const badge = $('#filter-count');
      badge.hidden = n === 0;
      badge.textContent = n;

      closePop();
      load();
    });

    $('#f-reset').addEventListener('click', resetFilters);

    function resetFilters() {
      $('#f-from').value = '';
      $('#f-to').value = '';
      $('#f-customer').value = '';
      $('#f-overdue-only').checked = false;
      $('#search').value = '';
      state.from = state.to = state.customerId = state.q = '';
      state.overdueOnly = false;
      state.status = '';
      state.page = 1;
      $('#filter-count').hidden = true;
      $$('.chip').forEach(c => c.classList.remove('is-active'));
      $('.chip[data-status=""]').classList.add('is-active');
      closePop();
      load();
    }
    window.__resetFilters = resetFilters;

    // --- Chọn hàng ---
    $('#check-all').addEventListener('change', function (e) {
      $$('.row-check').forEach(c => {
        if (e.target.checked) state.selected.add(c.value);
        else state.selected.delete(c.value);
      });
      syncSelection();
    });

    tbody.addEventListener('change', function (e) {
      if (!e.target.classList.contains('row-check')) return;
      if (e.target.checked) state.selected.add(e.target.value);
      else state.selected.delete(e.target.value);
      syncSelection();
    });

    // --- Click vào hàng → xem chi tiết ---
    tbody.addEventListener('click', function (e) {
      const remind = e.target.closest('.js-remind');
      if (remind) {
        e.stopPropagation();
        toast('Đã thêm vào hàng chờ nhắc nợ', 'Hóa đơn ' + remind.dataset.code + ' sẽ được gửi vào 08:00 ngày mai.', 'warn');
        return;
      }
      if (e.target.closest('a') || e.target.closest('label') || e.target.closest('button')) return;
      const tr = e.target.closest('tr[data-code]');
      if (tr) window.location.href = 'accountant-invoice-form.html?code=' + encodeURIComponent(tr.dataset.code);
    });

    // --- Enter trên hàng ---
    tbody.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      const tr = e.target.closest('tr[data-code]');
      if (tr && e.target === tr) {
        window.location.href = 'accountant-invoice-form.html?code=' + encodeURIComponent(tr.dataset.code);
      }
    });

    // --- Phân trang & page size ---
    pager.addEventListener('click', function (e) {
      const btn = e.target.closest('.page-btn[data-page]');
      if (!btn || btn.disabled) return;
      state.page = parseInt(btn.dataset.page, 10);
      load();
    });
    $('#page-size').addEventListener('change', function (e) {
      state.pageSize = parseInt(e.target.value, 10);
      state.page = 1;
      load();
    });

    // --- Mật độ bảng ---
    $$('.density-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        $$('.density-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        document.documentElement.style.setProperty('--row-h', btn.dataset.density === 'roomy' ? '64px' : '52px');
        $('#table').classList.toggle('is-roomy', btn.dataset.density === 'roomy');
      });
    });

    // --- Xuất / Nhập ---
    $('#btn-export').addEventListener('click', async function () {
      toast('Đang tạo tệp…', 'Quá trình xuất có thể mất vài giây.');
      const res = await api.invoices.list({ pageSize: 500, sort: 'issueDate:desc' });
      exportCsv(res.items);
      toast('Đã tải xuống', 'hoa-don-' + TODAY + '.csv — mở được bằng Excel.');
    });

    $('#btn-import').addEventListener('click', function () {
      toast('Nhập file Excel', 'Tính năng nhập hàng loạt — chọn tệp .xlsx tối đa 5MB.', 'warn');
    });

    // --- Thanh hàng loạt ---
    $('#bulk-clear').addEventListener('click', function () {
      state.selected.clear();
      syncSelection();
    });
    $('#bulk-remind').addEventListener('click', function () {
      toast('Đã xếp ' + state.selected.size + ' nhắc nợ', 'Nội dung do AI soạn, cần bạn duyệt trước khi gửi.', 'warn');
      state.selected.clear();
      syncSelection();
    });
    $('#bulk-export').addEventListener('click', function () {
      api.invoices.list({ pageSize: 500 }).then(res => {
        const rows = res.items.filter(i => state.selected.has(i.id));
        exportCsv(rows, 'hoa-don-da-chon-' + TODAY + '.csv');
        toast('Đã tải xuống', rows.length + ' hóa đơn được xuất ra tệp CSV.');
      });
    });

    // --- Nút trong trạng thái rỗng / lỗi ---
    tbody.addEventListener('click', function (e) {
      if (e.target.id === 'btn-retry') load();
      if (e.target.id === 'empty-reset') window.__resetFilters();
    });

    // --- Phím tắt ---
    document.addEventListener('keydown', function (e) {
      const tag = (document.activeElement.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        $('#search').focus();
      }
      if (e.key === 'Escape') {
        closePop();
        if (document.activeElement === $('#search')) $('#search').blur();
      }
    });

    // --- Nút trên topbar ---
    $$('[data-goto]').forEach(b => {
      b.addEventListener('click', function () {
        window.location.href = b.dataset.goto;
      });
    });
  }

  // -------------------------------------------------------------------
  // 12. Khởi chạy
  // -------------------------------------------------------------------
  (async function init() {
    bindEvents();
    await Promise.all([loadCustomers(), loadStats()]);
    load();
  })();
})();