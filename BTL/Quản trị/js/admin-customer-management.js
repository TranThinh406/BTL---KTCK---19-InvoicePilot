/**
 * admin-customer-management.js — Quản lý khách hàng (Quản trị hệ thống)
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
  const M = 1000000;
  const params = new URLSearchParams(location.search);
  const demoState = params.get('state');

  const GROUPS = {
    A: { key: 'A', label: 'A – Thanh toán ổn định', stamp: 'tag--a', fill: 'g-a' },
    B: { key: 'B', label: 'B – Cần theo dõi', stamp: 'tag--b', fill: 'g-b' },
    C: { key: 'C', label: 'C – Rủi ro cao', stamp: 'tag--c', fill: 'g-c' },
    D: { key: 'D', label: 'D – Đang tranh chấp', stamp: 'tag--d', fill: 'g-d' }
  };
  const STATUS = {
    active:   { text: 'Hoạt động', stamp: 'stamp--info' },
    pending:  { text: 'Chờ xác minh', stamp: 'stamp--warn' },
    disputed: { text: 'Đang tranh chấp', stamp: 'stamp--danger' },
    inactive: { text: 'Tạm ngưng', stamp: 'stamp--neutral' }
  };
  const OWNERS = ['Lê Minh Tuấn', 'Nguyễn Thị Lan', 'Trần Văn Hùng', 'Phạm Thu Hà', 'Vũ Quốc Bảo'];

  const state = {
    loading: true, error: false, empty: false,
    list: [], q: '', group: 'all', owner: 'all', status: 'all', debt: 'all',
    sort: { key: 'outstanding', dir: 'desc' },
    selected: [], open: null
  };

  // ------------------------------------------------------------------
  // Lọc & sắp xếp
  // ------------------------------------------------------------------
  function matches(c) {
    const q = state.q.trim().toLowerCase();
    if (q) {
      const hay = [c.name, c.short, c.id, c.taxId, c.email, c.phone, c.contact, c.owner]
        .join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    if (state.group !== 'all' && c.group !== state.group) return false;
    if (state.owner !== 'all' && c.owner !== state.owner) return false;
    if (state.status !== 'all' && c.status !== state.status) return false;
    if (state.debt === 'overdue' && !(c.overdue > 0)) return false;
    if (state.debt === 'clean' && c.overdue > 0) return false;
    if (state.debt === 'update' && !c.needsUpdate) return false;
    return true;
  }

  function visible() {
    const rows = state.list.filter(matches);
    const k = state.sort.key, dir = state.sort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const va = a[k], vb = b[k];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'vi') * dir;
    });
    return rows;
  }

  function historyOf(c) {
    return c.history || [
      { when: c.since, who: 'Hệ thống', what: 'Tạo mới hồ sơ khách hàng từ hóa đơn đầu tiên.' },
      { when: '12/10/2026 08:05', who: 'Hệ thống', what: 'Đồng bộ số liệu công nợ từ sổ cái.' }
    ];
  }

  function normalizeCustomer(customer) {
    const invoices = MOCK.DB.invoices.filter(invoice => invoice.customerId === customer.id);
    const openInvoices = invoices.filter(invoice => invoice.remaining > 0);
    const overdueInvoices = openInvoices.filter(invoice => invoice.status === 'overdue');
    const outstanding = openInvoices.reduce((sum, invoice) => sum + invoice.remaining, 0);
    const overdue = overdueInvoices.reduce((sum, invoice) => sum + invoice.remaining, 0);
    const avgDaysOverdue = overdueInvoices.length
      ? Math.round(overdueInvoices.reduce((sum, invoice) => {
        const due = new Date(invoice.dueDate + 'T00:00:00');
        const today = new Date(MOCK.TODAY + 'T00:00:00');
        return sum + Math.max(0, Math.floor((today - due) / 86400000));
      }, 0) / overdueInvoices.length)
      : 0;
    const needsUpdate = !customer.email || !customer.phone ||
      (customer.type === 'business' && !customer.taxId);
    const score = Number(customer.creditScore) || 0;
    const ownerIndex = Math.max(0, (parseInt(String(customer.ownerId || '').replace(/\D/g, ''), 10) || 1) - 1);
    const owner = OWNERS[ownerIndex % OWNERS.length];
    const status = customer.status === 'archived' ? 'inactive'
      : overdue > 0 && score < 40 ? 'disputed'
        : needsUpdate ? 'pending' : 'active';
    const lastInvoice = invoices.slice().sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0];

    return Object.assign({}, customer, {
      contact: 'Đại diện khách hàng',
      role: customer.type === 'business' ? 'Đầu mối doanh nghiệp' : 'Chủ hộ kinh doanh',
      type: customer.type === 'business' ? 'Doanh nghiệp' : 'Cá nhân',
      owner,
      group: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
      outstanding,
      overdue,
      overdueInvoices: overdueInvoices.length,
      invoices: openInvoices.length,
      avgDaysOverdue,
      status,
      needsUpdate,
      since: fmt.date(customer.createdAt),
      lastInvoice: lastInvoice ? fmt.date(lastInvoice.issueDate) : 'Chưa phát sinh',
      note: (customer.tags || []).join(' · '),
      watch: overdue > 0 || score < 40
        ? { level: overdue > 0 ? 'high' : 'low', note: overdue > 0 ? 'Có hóa đơn quá hạn cần theo dõi.' : 'Điểm tín dụng thấp, cần rà soát hạn mức.' }
        : null
    });
  }

  // ------------------------------------------------------------------
  // KPI
  // ------------------------------------------------------------------
  function renderKPI() {
    const all = state.list;
    const sum = (fn) => all.reduce((s, c) => s + fn(c), 0);
    const total = sum(c => c.outstanding);
    const ovd = sum(c => c.overdue);
    const withOvd = all.filter(c => c.overdue > 0);
    const ovdInvs = sum(c => c.overdueInvoices);
    const invs = sum(c => c.invoices);
    const avgDays = ovd ? withOvd.reduce((s, c) => s + c.overdue * c.avgDaysOverdue, 0) / ovd : 0;
    const active = all.filter(c => c.status === 'active').length;
    const pending = all.filter(c => c.status === 'pending').length;
    const disputed = all.filter(c => c.status === 'disputed').length;
    const needUpd = all.filter(c => c.needsUpdate).length;
    const topOverdue = withOvd.reduce((m, c) => (c.avgDaysOverdue > m.avgDaysOverdue ? c : m), withOvd[0] || { avgDaysOverdue: 0, short: '—' });

    $('#kpi-row').innerHTML = `
      <article class="kpi">
        <p class="kpi-label">Hồ sơ khách hàng</p>
        <p class="kpi-value mono">${all.length.toLocaleString('vi-VN')}</p>
        <p class="kpi-sub">${active} hoạt động · ${pending} chờ xác minh · ${disputed} tranh chấp</p>
      </article>
      <article class="kpi kpi--in">
        <p class="kpi-label">Tổng công nợ phải thu</p>
        <p class="kpi-value mono">${fmt.vnd(total)}</p>
        <p class="kpi-sub">${invs} hóa đơn chưa tất toán</p>
      </article>
      <article class="kpi kpi--out">
        <p class="kpi-label">Nợ quá hạn</p>
        <p class="kpi-value mono">${fmt.vnd(ovd)}</p>
        <p class="kpi-sub">${ovdInvs} hóa đơn · ${withOvd.length} khách hàng</p>
      </article>
      <article class="kpi kpi--warn">
        <p class="kpi-label">Tuổi nợ bình quân</p>
        <p class="kpi-value mono">${Math.round(avgDays)} ngày</p>
        <p class="kpi-sub">Cao nhất ${topOverdue.avgDaysOverdue} ngày · ${fmt.esc(topOverdue.short)}</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Hồ sơ cần cập nhật</p>
        <p class="kpi-value mono">${needUpd}</p>
        <p class="kpi-sub">Thiếu MST, email hoặc số điện thoại liên hệ</p>
      </article>`;
  }

  // ------------------------------------------------------------------
  // Bảng danh bạ
  // ------------------------------------------------------------------
  function renderTable() {
    const rows = visible();
    $('#cust-rows').innerHTML = rows.map(c => {
      const g = GROUPS[c.group], st = STATUS[c.status];
      const sel = state.selected.indexOf(c.id) > -1;
      return `
      <tr data-id="${fmt.esc(c.id)}"
          class="${c.status === 'disputed' ? 'is-disputed' : ''}${sel ? ' is-selected' : ''}">
        <td class="col-check" data-label="Chọn">
          <input type="checkbox" class="row-check" data-check="${fmt.esc(c.id)}"
                 aria-label="Chọn ${fmt.esc(c.name)}" ${sel ? 'checked' : ''}>
        </td>
        <td data-label="Khách hàng">
          <p class="cust-name">${fmt.esc(c.name)}</p>
          <p class="cust-meta">${fmt.esc(c.id)} · ${c.taxId ? 'MST ' + fmt.esc(c.taxId) : 'chưa có MST'}
            ${c.needsUpdate ? ' · <b>cần cập nhật</b>' : ''}</p>
        </td>
        <td data-label="Liên hệ">
          <p class="contact-line">${fmt.esc(c.contact)}<span> · ${fmt.esc(c.role)}</span></p>
          <p class="contact-line">${fmt.esc(c.phone || '—')}<span> · ${fmt.esc(c.email || 'chưa có email')}</span></p>
        </td>
        <td data-label="Nhóm"><span class="tag ${g.stamp}">${fmt.esc(g.key)}</span></td>
        <td data-label="Phụ trách"><span class="owner-name">${fmt.esc(c.owner)}</span></td>
        <td class="num" data-label="Công nợ"><span class="val-debt">${fmt.vnd(c.outstanding)}</span></td>
        <td class="num" data-label="Quá hạn">
          <span class="val-ovd ${c.overdue ? '' : 'val-zero'}">${c.overdue ? fmt.vnd(c.overdue) : '—'}</span>
        </td>
        <td class="num" data-label="Hóa đơn">
          <span class="num-mono">${c.invoices}${c.overdueInvoices ? ' · QH ' + c.overdueInvoices : ''}</span>
        </td>
        <td class="num" data-label="Tuổi nợ">
          <span class="num-mono ${c.avgDaysOverdue >= 30 ? 'val-ovd' : ''}">${c.avgDaysOverdue ? c.avgDaysOverdue + ' ngày' : '—'}</span>
        </td>
        <td data-label="Trạng thái"><span class="stamp ${st.stamp}">${fmt.esc(st.text)}</span></td>
      </tr>`;
    }).join('');

    const sumOut = rows.reduce((s, c) => s + c.outstanding, 0);
    const sumOvd = rows.reduce((s, c) => s + c.overdue, 0);
    $('#count-note').textContent =
      'Hiển thị ' + rows.length + ' / ' + state.list.length + ' hồ sơ · công nợ ' +
      fmt.vnd(sumOut) + ' · quá hạn ' + fmt.vnd(sumOvd);

    const checkAll = $('#check-all');
    const allIds = rows.map(c => c.id);
    const picked = allIds.filter(id => state.selected.indexOf(id) > -1).length;
    checkAll.checked = rows.length > 0 && picked === rows.length;
    checkAll.indeterminate = picked > 0 && picked < rows.length;
  }

  // ------------------------------------------------------------------
  // Thanh thao tác hàng loạt
  // ------------------------------------------------------------------
  function renderBulk() {
    const bar = $('#bulk-bar');
    const n = state.selected.length;
    bar.classList.toggle('is-on', n > 0);
    $('#bulk-count').textContent = 'Đã chọn ' + n + ' hồ sơ';
  }

  // ------------------------------------------------------------------
  // Nhóm & hồ sơ cần chú ý
  // ------------------------------------------------------------------
  function renderSide() {
    const all = state.list;
    const groups = ['A', 'B', 'C', 'D'].map(k => ({
      key: k,
      count: all.filter(c => c.group === k).length,
      value: all.filter(c => c.group === k).reduce((s, c) => s + c.outstanding, 0)
    }));
    const max = Math.max.apply(null, groups.map(g => g.value)) || 1;
    $('#group-bars').innerHTML = groups.map(g => `
      <div class="comp-row">
        <p class="comp-name"><span class="tag ${GROUPS[g.key].stamp}">${g.key}</span>${fmt.esc(GROUPS[g.key].label.slice(4))}</p>
        <div class="comp-track"><div class="comp-fill ${GROUPS[g.key].fill}" style="width:${(g.value / max * 100).toFixed(1)}%"></div></div>
        <p class="comp-val">${fmt.vnd(g.value)}<small>${g.count} khách hàng</small></p>
      </div>`).join('');

    const watch = all.filter(c => c.watch).sort((a, b) => (a.watch.level === 'high' ? -1 : 1) - (b.watch.level === 'high' ? -1 : 1));
    $('#watch-list').innerHTML = watch.length ? watch.map(c => `
      <div class="watch-item is-${fmt.esc(c.watch.level)}">
        <div class="watch-body">
          <p class="watch-name">${fmt.esc(c.name)}</p>
          <p class="watch-note">${fmt.esc(c.watch.note)}</p>
        </div>
        <a class="watch-open" href="#" data-open="${fmt.esc(c.id)}">Mở hồ sơ</a>
      </div>`).join('')
      : '<p class="watch-note">Không có hồ sơ nào cần chú ý trong đợt rà soát này.</p>';
  }

  // ------------------------------------------------------------------
  // Drawer chi tiết
  // ------------------------------------------------------------------
  function openDetail(id) {
    const c = state.list.filter(x => x.id === id)[0];
    if (!c) return;
    state.open = id;
    const g = GROUPS[c.group], st = STATUS[c.status];
    $('#drawer-kicker').textContent = 'Hồ sơ khách hàng · ' + c.id;
    $('#drawer-title').textContent = c.name;

    $('#drawer-body').innerHTML = `
      <div class="d-grid4">
        <div class="d-cell"><p class="k">Tổng công nợ</p><p class="v">${fmt.vnd(c.outstanding)}</p></div>
        <div class="d-cell"><p class="k">Nợ quá hạn</p><p class="v ${c.overdue ? 'neg' : ''}">${fmt.vnd(c.overdue)}</p></div>
        <div class="d-cell"><p class="k">Hóa đơn chưa tất toán</p><p class="v">${c.invoices} · quá hạn ${c.overdueInvoices}</p></div>
        <div class="d-cell"><p class="k">Tuổi nợ bình quân</p><p class="v">${c.avgDaysOverdue ? c.avgDaysOverdue + ' ngày' : '—'}</p></div>
      </div>

      <div class="d-block">
        <p class="detail-title">Thông tin định danh</p>
        <div class="d-list">
          <div class="d-item"><span>Mã số thuế</span><span class="v2">${fmt.esc(c.taxId || 'chưa có')}</span></div>
          <div class="d-item"><span>Loại hình</span><span class="v2">${fmt.esc(c.type)}</span></div>
          <div class="d-item"><span>Địa chỉ</span><span class="v2" style="max-width:230px;white-space:normal;text-align:right">${fmt.esc(c.address)}</span></div>
          <div class="d-item"><span>Khách hàng từ</span><span class="v2">${fmt.esc(c.since)}</span></div>
          <div class="d-item"><span>Hóa đơn gần nhất</span><span class="v2">${fmt.esc(c.lastInvoice)}</span></div>
        </div>
      </div>

      <div class="d-block">
        <p class="detail-title">Liên hệ</p>
        <div class="d-list">
          <div class="d-item"><div><strong>${fmt.esc(c.contact)}</strong><span class="k2">${fmt.esc(c.role)}</span></div>
            <span class="v2">${fmt.esc(c.phone || '—')}</span></div>
          <div class="d-item"><span>Email nhận hóa đơn</span><span class="v2">${fmt.esc(c.email || 'chưa có')}</span></div>
        </div>
      </div>

      <div class="d-block">
        <p class="detail-title">Phân nhóm &amp; phụ trách</p>
        <div class="form-grid">
          <div>
            <label class="field-label" for="d-owner">Người phụ trách</label>
            <select class="form-select" id="d-owner">
              ${OWNERS.map(o => `<option ${o === c.owner ? 'selected' : ''}>${fmt.esc(o)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label" for="d-group">Nhóm công nợ</label>
            <select class="form-select" id="d-group">
              ${['A', 'B', 'C', 'D'].map(k => `<option value="${k}" ${k === c.group ? 'selected' : ''}>${fmt.esc(GROUPS[k].label)}</option>`).join('')}
            </select>
          </div>
          <div class="span2">
            <label class="field-label" for="d-status">Trạng thái hồ sơ</label>
            <select class="form-select" id="d-status">
              ${Object.keys(STATUS).map(k => `<option value="${k}" ${k === c.status ? 'selected' : ''}>${fmt.esc(STATUS[k].text)}</option>`).join('')}
            </select>
          </div>
        </div>
        <p class="form-hint">Thay đổi tại đây có hiệu lực ngay với mọi người dùng và được ghi vào Nhật ký hoạt động.</p>
      </div>

      ${c.note ? `
      <div class="d-block">
        <p class="detail-title">Ghi chú nghiệp vụ</p>
        <div class="d-notes"><p class="d-note">${fmt.esc(c.note)}</p></div>
      </div>` : ''}

      <div class="d-block">
        <p class="detail-title">Lịch sử thay đổi</p>
        <div class="d-notes">
          ${historyOf(c).map(h => `<p class="d-note"><span class="who">${fmt.esc(h.when)} · ${fmt.esc(h.who)}</span>${fmt.esc(h.what)}</p>`).join('')}
        </div>
      </div>`;

    $('#drawer-foot').innerHTML = `
      <button class="btn btn--primary" type="button" data-act="edit">Chỉnh sửa hồ sơ</button>
      <button class="btn btn--ghost" type="button" data-act="invoices">Xem hóa đơn</button>
      <button class="btn btn--danger-plain" type="button" data-act="pause">Ngưng hoạt động</button>`;

    showDrawer();
    bindDetailControls(c);
  }

  function bindDetailControls(c) {
    const onChange = (sel, prop, label) => {
      $(sel).addEventListener('change', function () {
        const val = this.value;
        const old = c[prop];
        c[prop] = val;
        if (prop === 'status') c.needsUpdate = false;
        renderAll();
        toast('Đã cập nhật hồ sơ', label + ': ' + fmt.esc(String(old)) + ' → ' + fmt.esc(String(val)) + '.', 'warn');
      });
    };
    onChange('#d-owner', 'owner', 'Người phụ trách');
    onChange('#d-group', 'group', 'Nhóm công nợ');
    onChange('#d-status', 'status', 'Trạng thái');
  }

  // ------------------------------------------------------------------
  // Biểu mẫu thêm / sửa
  // ------------------------------------------------------------------
  function openForm(id) {
    const c = id ? state.list.filter(x => x.id === id)[0] : null;
    state.open = id || null;
    $('#drawer-kicker').textContent = c ? 'Chỉnh sửa hồ sơ · ' + c.id : 'Hồ sơ mới';
    $('#drawer-title').textContent = c ? c.name : 'Thêm khách hàng';

    const v = (x) => fmt.esc(c ? (c[x] || '') : '');
    $('#drawer-body').innerHTML = `
      <div class="form-grid">
        <div class="span2">
          <label class="field-label" for="f-name">Tên khách hàng <span style="color:var(--sienna)">*</span></label>
          <input class="form-input" id="f-name" type="text" value="${v('name')}" placeholder="Công ty TNHH…">
          <p class="field-error" id="e-name" hidden></p>
        </div>
        <div>
          <label class="field-label" for="f-tax">Mã số thuế <span style="color:var(--sienna)">*</span></label>
          <input class="form-input mono" id="f-tax" type="text" value="${v('taxId')}" placeholder="10–13 chữ số">
          <p class="field-error" id="e-tax" hidden></p>
        </div>
        <div>
          <label class="field-label" for="f-type">Loại hình</label>
          <select class="form-select" id="f-type">
            ${['Doanh nghiệp', 'Hộ kinh doanh', 'Tổ chức', 'Cá nhân'].map(t =>
              `<option ${c && c.type === t ? 'selected' : ''}>${fmt.esc(t)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label" for="f-contact">Người liên hệ</label>
          <input class="form-input" id="f-contact" type="text" value="${v('contact')}">
        </div>
        <div>
          <label class="field-label" for="f-role">Chức danh</label>
          <input class="form-input" id="f-role" type="text" value="${v('role')}">
        </div>
        <div>
          <label class="field-label" for="f-phone">Điện thoại</label>
          <input class="form-input mono" id="f-phone" type="text" value="${v('phone')}">
          <p class="field-error" id="e-phone" hidden></p>
        </div>
        <div>
          <label class="field-label" for="f-email">Email nhận hóa đơn</label>
          <input class="form-input mono" id="f-email" type="email" value="${v('email')}">
          <p class="field-error" id="e-email" hidden></p>
        </div>
        <div class="span2">
          <label class="field-label" for="f-address">Địa chỉ</label>
          <input class="form-input" id="f-address" type="text" value="${v('address')}">
        </div>
        <div>
          <label class="field-label" for="f-owner">Người phụ trách</label>
          <select class="form-select" id="f-owner">
            ${OWNERS.map(o => `<option ${c && c.owner === o ? 'selected' : ''}>${fmt.esc(o)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label" for="f-group2">Nhóm công nợ</label>
          <select class="form-select" id="f-group2">
            ${['A', 'B', 'C', 'D'].map(k => `<option value="${k}" ${c && c.group === k ? 'selected' : (k === 'B' && !c ? 'selected' : '')}>${fmt.esc(GROUPS[k].label)}</option>`).join('')}
          </select>
        </div>
        <div class="span2">
          <label class="field-label" for="f-note">Ghi chú nghiệp vụ</label>
          <textarea class="form-area" id="f-note" placeholder="Điều kiện thanh toán, cam kết thu…">${v('note')}</textarea>
        </div>
      </div>
      <p class="form-hint">Trường đánh dấu <span style="color:var(--sienna)">*</span> là bắt buộc.
        Mã số thuế dùng để đối chiếu khi phát hành hóa đơn điện tử; mọi thay đổi được ghi vào Nhật ký hoạt động.</p>`;

    $('#drawer-foot').innerHTML = `
      <button class="btn btn--primary" type="button" data-act="save">Lưu hồ sơ</button>
      <button class="btn btn--ghost" type="button" data-act="cancel">Hủy</button>`;
    showDrawer();
    $('#f-name').focus();
  }

  function fieldError(inputId, errId, msg) {
    $(inputId).classList.add('is-invalid');
    $(errId).hidden = false;
    $(errId).textContent = msg;
  }

  function saveForm() {
    const name = $('#f-name').value.trim();
    const tax = $('#f-tax').value.trim();
    const email = $('#f-email').value.trim();
    const phone = $('#f-phone').value.trim();

    $$('.form-input, .form-area').forEach(el => el.classList.remove('is-invalid'));
    $$('.field-error').forEach(el => { el.hidden = true; });

    let ok = true;
    if (!name) { fieldError('#f-name', '#e-name', 'Vui lòng nhập tên khách hàng.'); ok = false; }
    if (!tax || !/^\d{10,13}/.test(tax)) { fieldError('#f-tax', '#e-tax', 'Mã số thuế gồm 10–13 chữ số.'); ok = false; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldError('#f-email', '#e-email', 'Email không đúng định dạng.'); ok = false; }
    if (phone && !/^[\d\s+().-]{8,15}$/.test(phone)) { fieldError('#f-phone', '#e-phone', 'Số điện thoại không hợp lệ.'); ok = false; }
    if (!ok) {
      toast('Chưa lưu được hồ sơ', 'Vui lòng kiểm tra các trường được đánh dấu.', 'error');
      return;
    }

    const payload = {
      name, taxId: tax, email, phone,
      type: $('#f-type').value,
      contact: $('#f-contact').value.trim(),
      role: $('#f-role').value.trim(),
      address: $('#f-address').value.trim(),
      owner: $('#f-owner').value,
      group: $('#f-group2').value,
      note: $('#f-note').value.trim()
    };

    if (state.open) {
      const c = state.list.filter(x => x.id === state.open)[0];
      Object.keys(payload).forEach(k => { c[k] = payload[k]; });
      c.needsUpdate = !c.email || !c.phone || !c.taxId;
      toast('Đã lưu thay đổi', c.name + ' được cập nhật lúc 12/10/2026.', 'ok');
    } else {
      const n = state.list.length + 89;
      const created = Object.assign({
        id: 'KH-0' + n, code: 'NEW', short: payload.name.split(' ').slice(-2).join(' '),
        status: 'pending', outstanding: 0, overdue: 0,
        invoices: 0, overdueInvoices: 0, avgDaysOverdue: 0,
        lastInvoice: '—', since: '10/2026', needsUpdate: true
      }, payload);
      state.list.unshift(created);
      toast('Đã tạo hồ sơ khách hàng', created.name + ' · trạng thái Chờ xác minh.', 'ok');
    }
    closeDrawer();
    renderAll();
  }

  // ------------------------------------------------------------------
  // Drawer điều khiển
  // ------------------------------------------------------------------
  function showDrawer() {
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
  function toast(title, desc, tone) {
    const map = { ok: '', warn: 'warn', error: 'error' };
    const el = document.createElement('div');
    el.className = 'toast' + (tone && map[tone] ? ' toast--' + map[tone] : '');
    el.innerHTML = '<p class="toast-title">' + fmt.esc(title) + '</p>' +
      (desc ? '<p class="toast-desc">' + fmt.esc(desc) + '</p>' : '');
    $('#toasts').appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 220);
    }, 4200);
  }

  // ------------------------------------------------------------------
  // Render tổng
  // ------------------------------------------------------------------
  function renderAll() {
    renderKPI();
    renderTable();
    renderBulk();
    renderSide();
    $('#head-count').textContent = state.list.length + ' hồ sơ';
  }

  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;
    document.querySelector('.split-row').hidden = state.loading || state.error || state.empty;
    document.querySelector('.note-strip').hidden = state.loading || state.error;
  }

  // ------------------------------------------------------------------
  // Sự kiện
  // ------------------------------------------------------------------
  function bind() {
    // Bộ lọc
    $('#f-search').addEventListener('input', function () {
      state.q = this.value; renderTable();
    });
    [['#f-group', 'group'], ['#f-owner', 'owner'], ['#f-status', 'status'], ['#f-debt', 'debt']]
      .forEach(([sel, key]) => {
        $(sel).addEventListener('change', function () {
          state[key] = this.value; renderTable();
        });
      });
    $('#btn-reset').addEventListener('click', () => {
      state.q = ''; state.group = 'all'; state.owner = 'all'; state.status = 'all'; state.debt = 'all';
      $('#f-search').value = '';
      ['#f-group', '#f-owner', '#f-status', '#f-debt'].forEach(s => { $(s).value = 'all'; });
      renderTable();
      toast('Đã xóa bộ lọc', 'Hiển thị lại toàn bộ danh bạ khách hàng.', 'warn');
    });

    // Sắp xếp
    $$('#cust-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        state.sort = { key, dir: state.sort.key === key && state.sort.dir === 'desc' ? 'asc' : 'desc' };
        $$('#cust-table th[data-sort]').forEach(t => t.classList.remove('is-asc', 'is-desc'));
        th.classList.add(state.sort.dir === 'asc' ? 'is-asc' : 'is-desc');
        renderTable();
      });
    });

    // Chọn dòng
    $('#cust-rows').addEventListener('click', function (e) {
      const check = e.target.closest('.row-check');
      if (check) {
        const id = check.dataset.check;
        const i = state.selected.indexOf(id);
        if (check.checked && i === -1) state.selected.push(id);
        if (!check.checked && i > -1) state.selected.splice(i, 1);
        renderTable();
        renderBulk();
        return;
      }
      const row = e.target.closest('tr[data-id]');
      if (row) openDetail(row.dataset.id);
    });

    $('#check-all').addEventListener('change', function () {
      const ids = visible().map(c => c.id);
      if (this.checked) {
        ids.forEach(id => { if (state.selected.indexOf(id) === -1) state.selected.push(id); });
      } else {
        state.selected = state.selected.filter(id => ids.indexOf(id) === -1);
      }
      renderTable();
      renderBulk();
    });

    // Hàng loạt
    $('#bulk-bar').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-bulk]');
      if (!btn) return;
      const act = btn.dataset.bulk;
      const picked = state.list.filter(c => state.selected.indexOf(c.id) > -1);
      if (act === 'clear') { state.selected = []; renderTable(); renderBulk(); return; }
      if (!picked.length) return;

      if (act === 'owner') {
        const owner = $('#bulk-owner').value;
        if (!owner) { toast('Chưa chọn nhân sự', 'Hãy chọn người phụ trách rồi bấm Áp dụng.', 'error'); return; }
        picked.forEach(c => { c.owner = owner; });
        toast('Đã chuyển phụ trách', picked.length + ' hồ sơ → ' + owner + '.', 'warn');
      } else if (act === 'group') {
        picked.forEach(c => { if (c.group !== 'D') c.group = 'C'; });
        toast('Đã cập nhật nhóm công nợ', picked.length + ' hồ sơ đưa về nhóm C – Rủi ro cao.', 'warn');
      } else if (act === 'export') {
        toast('Đang tạo tệp xuất', picked.length + ' hồ sơ khách hàng sẽ sẵn sàng sau ít giây.', 'warn');
      } else if (act === 'pause') {
        picked.forEach(c => { c.status = 'inactive'; });
        toast('Đã ngưng hoạt động', picked.length + ' hồ sơ bị tạm ngưng — không nhận hóa đơn mới.', 'error');
      }
      state.selected = [];
      renderAll();
    });

    // Drawer
    $('#drawer-close').addEventListener('click', closeDrawer);
    $('#drawer-overlay').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer();
    });
    $('#drawer-foot').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      const c = state.list.filter(x => x.id === state.open)[0];
      if (act === 'edit' && c) { openForm(c.id); return; }
      if (act === 'save') { saveForm(); return; }
      if (act === 'cancel') { closeDrawer(); return; }
      if (act === 'invoices' && c) {
        toast('Đang mở danh sách hóa đơn', 'Lọc theo ' + c.name + '.', 'warn');
        return;
      }
      if (act === 'pause' && c) {
        c.status = 'inactive';
        closeDrawer();
        renderAll();
        toast('Đã ngưng hoạt động', c.name + ' không nhận hóa đơn mới cho tới khi mở lại.', 'error');
      }
    });

    $('#btn-add').addEventListener('click', () => openForm(null));
    document.addEventListener('click', function (e) {
      const add = e.target.closest('[data-add]');
      if (add) openForm(null);
      const open = e.target.closest('[data-open]');
      if (open) { e.preventDefault(); openDetail(open.dataset.open); }
    });

    $('#btn-export').addEventListener('click', () => {
      toast('Đang tạo tệp xuất', visible().length + ' hồ sơ khách hàng · định dạng CSV.', 'warn');
    });
    $('#btn-retry').addEventListener('click', load);
  }

  // ------------------------------------------------------------------
  // Nạp dữ liệu
  // ------------------------------------------------------------------
  async function load() {
    state.loading = true; state.error = false;
    render();
    try {
      const customers = api.customerProfiles
        ? await api.customerProfiles.list()
        : JSON.parse(JSON.stringify(MOCK.customers));
      state.list = customers.map(customer => customer.outstanding != null ? customer : normalizeCustomer(customer));
    } catch (e) {
      state.error = true;
    } finally {
      state.loading = false;
      if (demoState === 'error') state.error = true;
      if (demoState === 'empty') { state.empty = true; state.list = []; }
      if (!state.error && !state.empty) {
        const owners = [];
        state.list.forEach(c => { if (owners.indexOf(c.owner) === -1) owners.push(c.owner); });
        owners.forEach(o => {
          $('#f-owner').insertAdjacentHTML('beforeend', `<option value="${fmt.esc(o)}">${fmt.esc(o)}</option>`);
          $('#bulk-owner').insertAdjacentHTML('beforeend', `<option value="${fmt.esc(o)}">${fmt.esc(o)}</option>`);
        });
        $('#cust-table th[data-sort="outstanding"]').classList.add('is-desc');
        renderAll();
      }
      render();
    }
  }

  (function init() {
    bind();
    load();
  })();
})();