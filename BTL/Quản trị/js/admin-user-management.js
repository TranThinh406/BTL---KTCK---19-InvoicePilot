/**
 * admin-user-management.js — Quản lý người dùng & phân quyền (Quản trị hệ thống)
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
  const demoState = params.get('state');

  const STATUS = {
    active:    { text: 'Hoạt động', stamp: 'stamp--info' },
    pending:   { text: 'Chờ kích hoạt', stamp: 'stamp--warn' },
    locked:    { text: 'Khóa tạm thời', stamp: 'stamp--danger' },
    suspended: { text: 'Ngưng sử dụng', stamp: 'stamp--neutral' }
  };
  const SCOPE_KIND = {
    'Toàn hệ thống': 'all-sys',
    'Toàn hệ thống (công nợ)': 'all-sys',
    'Theo phòng ban': 'dept',
    'Theo khách hàng được phân công': 'assigned',
    'Chỉ đọc toàn hệ thống': 'readonly'
  };
  const ROLES = ['Quản trị hệ thống', 'Kế toán trưởng', 'Kế toán thu', 'Quản lý công nợ',
                 'Nhân viên kinh doanh', 'Kiểm toán viên', 'Hỗ trợ vận hành'];
  const DEPTS = ['Tài chính – Kế toán', 'Kinh doanh', 'Công nghệ thông tin', 'Kiểm toán nội bộ'];

  const state = {
    loading: true, error: false, empty: false,
    list: [], q: '', dept: 'all', role: 'all', status: 'all', mfa: 'all', scope: 'all',
    sort: { key: 'name', dir: 'asc' },
    selected: [], open: null
  };

  // ------------------------------------------------------------------
  function dt(iso) {
    if (!iso) return '—';
    const p = iso.split('T');
    const d = p[0].split('-');
    return d[2] + '/' + d[1] + '/' + d[0] + ' · ' + (p[1] || '00:00');
  }
  function sessionsOf(u) {
    return u.sessions || [
      { device: 'Chrome · Windows 11', place: 'TP.HCM', at: dt(u.lastLoginAt), trusted: true },
      { device: 'InvoicePilot iOS', place: 'TP.HCM', at: dt(u.lastLoginAt), trusted: true }
    ];
  }
  function historyOf(u) {
    return u.history || [
      { when: u.created, who: 'Hệ thống', what: 'Tạo tài khoản và gửi lời mời kích hoạt qua email.' },
      { when: '10/10/2026 16:20', who: 'Phạm Quốc Hưng', what: 'Rà soát quyền định kỳ — giữ nguyên vai trò hiện tại.' }
    ];
  }
  function normalizeUser(user, index) {
    const roleByCode = {
      accountant: 'Kế toán thu',
      sales: 'Nhân viên kinh doanh',
      manager: 'Quản lý công nợ',
      admin: 'Quản trị hệ thống'
    };
    const deptByName = {
      'Kế toán': 'Tài chính – Kế toán',
      'Kinh doanh': 'Kinh doanh',
      'Điều hành': 'Kiểm toán nội bộ',
      'Công nghệ': 'Công nghệ thông tin'
    };
    const scopeByRole = {
      accountant: 'Theo phòng ban',
      sales: 'Theo khách hàng được phân công',
      manager: 'Toàn hệ thống (công nợ)',
      admin: 'Toàn hệ thống'
    };
    const role = roleByCode[user.role] || 'Hỗ trợ vận hành';
    const status = user.status === 'disabled' ? 'locked' : 'active';
    const lastLoginAt = user.lastLogin ? user.lastLogin.replace(' ', 'T') : '';
    const mfa = user.role === 'admin' || user.role === 'manager' || index % 2 === 0;

    return Object.assign({}, user, {
      initials: user.name.split(/\s+/).slice(-2).map(part => part.charAt(0)).join('').toUpperCase(),
      dept: deptByName[user.department] || 'Kinh doanh',
      title: user.role === 'admin' ? 'Quản trị viên hệ thống'
        : user.role === 'manager' ? 'Quản lý vận hành'
          : user.role === 'sales' ? 'Chuyên viên kinh doanh' : 'Kế toán viên',
      role,
      scope: scopeByRole[user.role] || 'Theo phòng ban',
      status,
      mfa,
      created: fmt.date(user.createdAt),
      lastLoginAt,
      failed: status === 'locked' ? 4 : 0,
      devices: status === 'locked' ? 0 : 2,
      phone: 'Chưa cập nhật',
      manager: 'Phạm Quốc Hưng',
      watch: status === 'locked' || !mfa
        ? { level: status === 'locked' ? 'high' : 'medium', note: status === 'locked' ? 'Tài khoản đang khóa tạm thời.' : 'Tài khoản chưa bật xác thực hai lớp.' }
        : null
    });
  }
  function avatarClass(u) {
    if (u.role === 'Quản trị hệ thống') return 'ava--admin';
    if (u.status === 'locked') return 'ava--risk';
    if (u.dept === 'Tài chính – Kế toán') return 'ava--fin';
    return '';
  }

  // ------------------------------------------------------------------
  function matches(u) {
    const q = state.q.trim().toLowerCase();
    if (q) {
      const hay = [u.name, u.email, u.id, u.title, u.role, u.dept, u.phone].join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    if (state.dept !== 'all' && u.dept !== state.dept) return false;
    if (state.role !== 'all' && u.role !== state.role) return false;
    if (state.status !== 'all' && u.status !== state.status) return false;
    if (state.mfa === 'on' && !u.mfa) return false;
    if (state.mfa === 'off' && u.mfa) return false;
    if (state.scope !== 'all' && SCOPE_KIND[u.scope] !== state.scope) return false;
    return true;
  }

  function visible() {
    const rows = state.list.filter(matches);
    const k = state.sort.key, dir = state.sort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const va = a[k], vb = b[k];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      if (typeof va === 'boolean') return ((va ? 1 : 0) - (vb ? 1 : 0)) * dir;
      return String(va === '' ? 'zzz' : va).localeCompare(String(vb === '' ? 'zzz' : vb), 'vi') * dir;
    });
    return rows;
  }

  // ------------------------------------------------------------------
  function renderKPI() {
    const all = state.list;
    const active = all.filter(u => u.status === 'active').length;
    const pending = all.filter(u => u.status === 'pending').length;
    const locked = all.filter(u => u.status === 'locked').length;
    const mfaOn = all.filter(u => u.mfa).length;
    const admins = all.filter(u => u.role === 'Quản trị hệ thống').length;
    const roles = all.reduce((acc, u) => (acc.indexOf(u.role) === -1 ? acc.concat([u.role]) : acc), []).length;
    const wide = all.filter(u => SCOPE_KIND[u.scope] === 'all-sys').length;
    const readonly = all.filter(u => u.scope.indexOf('Chỉ đọc') === 0).length;
    const risk = all.filter(u => u.watch && u.watch.level === 'high').length;

    $('#kpi-row').innerHTML = `
      <article class="kpi">
        <p class="kpi-label">Tài khoản người dùng</p>
        <p class="kpi-value mono">${all.length}</p>
        <p class="kpi-sub">${active} hoạt động · ${pending} chờ kích hoạt · ${locked} khóa tạm thời</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Vai trò đang gán</p>
        <p class="kpi-value mono">${roles}</p>
        <p class="kpi-sub">${admins} tài khoản quyền quản trị hệ thống</p>
      </article>
      <article class="kpi kpi--ok">
        <p class="kpi-label">Xác thực 2 lớp</p>
        <p class="kpi-value mono">${mfaOn}/${all.length}</p>
        <p class="kpi-sub">${all.length - mfaOn} tài khoản chưa bật</p>
      </article>
      <article class="kpi kpi--out">
        <p class="kpi-label">Phiên đăng nhập bất thường</p>
        <p class="kpi-value mono">2</p>
        <p class="kpi-sub">Trương Minh Châu · thiết bị mới tại Hà Nội</p>
      </article>
      <article class="kpi kpi--warn">
        <p class="kpi-label">Phạm vi toàn hệ thống</p>
        <p class="kpi-value mono">${wide}</p>
        <p class="kpi-sub">${readonly} tài khoản trong số đó chỉ đọc · ${risk} rủi ro cao</p>
      </article>`;
  }

  // ------------------------------------------------------------------
  function renderTable() {
    const rows = visible();
    $('#user-rows').innerHTML = rows.map(u => {
      const st = STATUS[u.status];
      const sel = state.selected.indexOf(u.id) > -1;
      return `
      <tr data-id="${fmt.esc(u.id)}"
          class="${u.status === 'locked' ? 'is-locked' : ''}${sel ? ' is-selected' : ''}">
        <td class="col-check" data-label="Chọn">
          <input type="checkbox" class="row-check" data-check="${fmt.esc(u.id)}"
                 aria-label="Chọn ${fmt.esc(u.name)}" ${sel ? 'checked' : ''}>
        </td>
        <td data-label="Người dùng">
          <div class="u-cell">
            <span class="ava ${avatarClass(u)}">${fmt.esc(u.initials)}</span>
            <div>
              <p class="u-name">${fmt.esc(u.name)}</p>
              <p class="u-mail">${fmt.esc(u.email)}</p>
            </div>
          </div>
        </td>
        <td data-label="Phòng ban">
          <p class="cell-main">${fmt.esc(u.dept)}</p>
          <p class="u-sub">${fmt.esc(u.title)}</p>
        </td>
        <td data-label="Vai trò"><span class="cell-main">${fmt.esc(u.role)}</span></td>
        <td data-label="Phạm vi dữ liệu">
          <span class="cell-main">${fmt.esc(u.scope)}</span>
          <p class="u-sub">${fmt.esc(u.id)}</p>
        </td>
        <td data-label="Xác thực 2 lớp">
          <span class="${u.mfa ? 'mfa-on' : 'mfa-off'}">${u.mfa ? 'BẬT' : 'TẮT'}</span>
        </td>
        <td data-label="Đăng nhập gần nhất">
          <span class="cell-mono ${u.lastLoginAt ? '' : 'is-never'}">${u.lastLoginAt ? dt(u.lastLoginAt) : 'chưa đăng nhập'}</span>
        </td>
        <td data-label="Trạng thái"><span class="stamp ${st.stamp}">${fmt.esc(st.text)}</span></td>
      </tr>`;
    }).join('');

    const mfaOn = rows.filter(u => u.mfa).length;
    $('#count-note').textContent =
      'Hiển thị ' + rows.length + ' / ' + state.list.length + ' tài khoản · 2FA ' + mfaOn + '/' + rows.length +
      ' · quản trị ' + rows.filter(u => u.role === 'Quản trị hệ thống').length;

    const checkAll = $('#check-all');
    const ids = rows.map(u => u.id);
    const picked = ids.filter(id => state.selected.indexOf(id) > -1).length;
    checkAll.checked = rows.length > 0 && picked === rows.length;
    checkAll.indeterminate = picked > 0 && picked < rows.length;
  }

  function renderBulk() {
    const n = state.selected.length;
    $('#bulk-bar').classList.toggle('is-on', n > 0);
    $('#bulk-count').textContent = 'Đã chọn ' + n + ' tài khoản';
  }

  // ------------------------------------------------------------------
  function renderSide() {
    const all = state.list;
    const depts = DEPTS.map((d, i) => ({
      name: d,
      count: all.filter(u => u.dept === d).length,
      f: 'f-' + (i + 1)
    })).filter(d => d.count > 0);
    const max = Math.max.apply(null, depts.map(d => d.count)) || 1;

    $('#dept-bars').innerHTML = depts.map(d => `
      <div class="comp-row">
        <p class="comp-name">${fmt.esc(d.name)}</p>
        <div class="comp-track"><div class="comp-fill ${d.f}" style="width:${(d.count / max * 100).toFixed(1)}%"></div></div>
        <p class="comp-val">${d.count} tài khoản<small>${(d.count / all.length * 100).toFixed(0)}% danh sách</small></p>
      </div>`).join('');

    const watch = all.filter(u => u.watch)
      .sort((a, b) => (a.watch.level === 'high' ? -1 : 1) - (b.watch.level === 'high' ? -1 : 1));
    $('#watch-list').innerHTML = watch.length ? watch.map(u => `
      <div class="watch-item is-${fmt.esc(u.watch.level)}">
        <div class="watch-body">
          <p class="watch-name">${fmt.esc(u.name)}<span class="u-sub"> · ${fmt.esc(u.role)}</span></p>
          <p class="watch-note">${fmt.esc(u.watch.note)}</p>
        </div>
        <a class="watch-open" href="#" data-open="${fmt.esc(u.id)}">Mở tài khoản</a>
      </div>`).join('')
      : '<p class="watch-note">Không có tài khoản nào cần chú ý trong đợt rà soát này.</p>';
  }

  // ------------------------------------------------------------------
  function openDetail(id) {
    const u = state.list.filter(x => x.id === id)[0];
    if (!u) return;
    state.open = id;
    const st = STATUS[u.status];
    $('#drawer-kicker').textContent = 'Tài khoản · ' + u.id;
    $('#drawer-title').textContent = u.name;

    $('#drawer-body').innerHTML = `
      <div class="d-grid4">
        <div class="d-cell"><p class="k">Đăng nhập gần nhất</p><p class="v">${u.lastLoginAt ? dt(u.lastLoginAt) : '—'}</p></div>
        <div class="d-cell"><p class="k">Tài khoản tạo lúc</p><p class="v">${fmt.esc(u.created)}</p></div>
        <div class="d-cell"><p class="k">Thiết bị tin cậy</p><p class="v">${u.devices}</p></div>
        <div class="d-cell"><p class="k">Sai mật khẩu (30 ngày)</p><p class="v ${u.failed >= 3 ? 'neg' : ''}">${u.failed}</p></div>
      </div>

      <div class="d-block">
        <p class="detail-title">Thông tin tài khoản</p>
        <div class="d-list">
          <div class="d-item"><span>Email</span><span class="v2">${fmt.esc(u.email)}</span></div>
          <div class="d-item"><span>Phòng ban</span><span class="v2">${fmt.esc(u.dept)}</span></div>
          <div class="d-item"><span>Chức danh tổ chức</span><span class="v2">${fmt.esc(u.title)}</span></div>
          <div class="d-item"><span>Điện thoại</span><span class="v2">${fmt.esc(u.phone)}</span></div>
          <div class="d-item"><span>Quản lý trực tiếp</span><span class="v2">${fmt.esc(u.manager)}</span></div>
          <div class="d-item"><span>Trạng thái</span><span class="v2"><span class="stamp ${st.stamp}">${fmt.esc(st.text)}</span></span></div>
        </div>
      </div>

      <div class="d-block">
        <p class="detail-title">Vai trò &amp; phạm vi dữ liệu</p>
        <div class="form-grid">
          <div>
            <label class="field-label" for="d-role">Vai trò</label>
            <select class="form-select" id="d-role">
              ${ROLES.map(r => `<option ${r === u.role ? 'selected' : ''}>${fmt.esc(r)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label" for="d-scope">Phạm vi dữ liệu</label>
            <select class="form-select" id="d-scope">
              ${['Toàn hệ thống', 'Toàn hệ thống (công nợ)', 'Theo phòng ban',
                 'Theo khách hàng được phân công', 'Chỉ đọc toàn hệ thống']
                .map(s => `<option ${s === u.scope ? 'selected' : ''}>${fmt.esc(s)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="chips">
          <span class="chip is-yes">Xem hóa đơn</span>
          ${u.role === 'Quản trị hệ thống' || u.role === 'Kế toán trưởng' || u.role === 'Kế toán thu'
            ? '<span class="chip is-yes">Phát hành hóa đơn</span>' : '<span class="chip">Phát hành hóa đơn</span>'}
          ${u.role === 'Quản trị hệ thống' || u.role === 'Kế toán trưởng'
            ? '<span class="chip is-yes">Sửa / hủy hóa đơn</span>' : '<span class="chip">Sửa / hủy hóa đơn</span>'}
          ${u.role === 'Kiểm toán viên' || u.role === 'Hỗ trợ vận hành'
            ? '<span class="chip">Chỉ đọc công nợ</span>' : '<span class="chip is-yes">Quản lý công nợ</span>'}
          ${u.role === 'Quản trị hệ thống' || u.role === 'Kế toán trưởng' || u.role === 'Quản lý công nợ'
            ? '<span class="chip is-yes">Duyệt dự báo</span>' : '<span class="chip">Duyệt dự báo</span>'}
          ${u.role === 'Quản trị hệ thống' ? '<span class="chip is-yes">Quản lý người dùng</span>' : '<span class="chip">Quản lý người dùng</span>'}
        </div>
        <p class="form-hint">Vai trò quyết định quyền; chức danh tổ chức không tự động kèm quyền.</p>
      </div>

      <div class="d-block">
        <p class="detail-title">Xác thực &amp; bảo mật</p>
        <div class="switch-line">
          <p>Xác thực 2 lớp (2FA)<span class="k2">${u.mfa ? 'Đã bật' : 'Chưa bật — nên yêu cầu bật sớm'}</span></p>
          <label class="check-line" style="padding:0">
            <input type="checkbox" id="d-mfa" ${u.mfa ? 'checked' : ''}>
            <span class="cell-mono">${u.mfa ? 'BẬT' : 'TẮT'}</span>
          </label>
        </div>
        <div class="d-list">
          ${sessionsOf(u).map(s => `
            <div class="d-item ${s.trusted ? 'is-ok' : 'is-warn'}">
              <div><strong>${fmt.esc(s.device)}</strong>
                <span class="k2">${fmt.esc(s.place)} · ${s.trusted ? 'thiết bị tin cậy' : 'thiết bị lạ'}</span></div>
              <span class="v2">${fmt.esc(s.at)}</span>
            </div>`).join('')}
        </div>
      </div>

      ${u.note ? `
      <div class="d-block">
        <p class="detail-title">Ghi chú quản trị</p>
        <div class="d-notes"><p class="d-note">${fmt.esc(u.note)}</p></div>
      </div>` : ''}

      <div class="d-block">
        <p class="detail-title">Lịch sử hoạt động</p>
        <div class="d-notes">
          ${historyOf(u).map(h => `<p class="d-note"><span class="who">${fmt.esc(h.when)} · ${fmt.esc(h.who)}</span>${fmt.esc(h.what)}</p>`).join('')}
        </div>
      </div>`;

    $('#drawer-foot').innerHTML = `
      <button class="btn btn--primary" type="button" data-act="edit">Chỉnh sửa tài khoản</button>
      <button class="btn btn--ghost" type="button" data-act="reset">Đặt lại mật khẩu</button>
      <button class="btn btn--danger-plain" type="button" data-act="${u.status === 'locked' ? 'unlock' : 'lock'}">
        ${u.status === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}</button>`;

    showDrawer();

    $('#d-role').addEventListener('change', function () {
      const old = u.role; u.role = this.value;
      renderAll();
      toast('Đã đổi vai trò', old + ' → ' + u.role + '. Bản ghi đã ghi vào nhật ký.', 'warn');
    });
    $('#d-scope').addEventListener('change', function () {
      const old = u.scope; u.scope = this.value;
      renderAll();
      toast('Đã đổi phạm vi dữ liệu', old + ' → ' + u.scope + '.', 'warn');
    });
    $('#d-mfa').addEventListener('change', function () {
      u.mfa = this.checked;
      renderAll();
      toast(u.mfa ? 'Đã bật xác thực 2 lớp' : 'Đã tắt xác thực 2 lớp',
        u.name + (u.mfa ? ' sẽ cần mã xác thực khi đăng nhập.' : ' sẽ đăng nhập chỉ bằng mật khẩu.'), u.mfa ? 'ok' : 'error');
    });
  }

  // ------------------------------------------------------------------
  function openForm(id) {
    const u = id ? state.list.filter(x => x.id === id)[0] : null;
    state.open = id || null;
    $('#drawer-kicker').textContent = u ? 'Chỉnh sửa tài khoản · ' + u.id : 'Tài khoản mới';
    $('#drawer-title').textContent = u ? u.name : 'Thêm người dùng';
    const v = (k) => fmt.esc(u ? (u[k] || '') : '');

    $('#drawer-body').innerHTML = `
      <div class="form-grid">
        <div class="span2">
          <label class="field-label" for="f-name">Họ và tên <span style="color:var(--sienna)">*</span></label>
          <input class="form-input" id="f-name" type="text" value="${v('name')}" placeholder="Nguyễn Văn A">
          <p class="field-error" id="e-name" hidden></p>
        </div>
        <div>
          <label class="field-label" for="f-email">Email công ty <span style="color:var(--sienna)">*</span></label>
          <input class="form-input mono" id="f-email" type="email" value="${v('email')}" placeholder="ten@invoicepilot.vn">
          <p class="field-error" id="e-email" hidden></p>
        </div>
        <div>
          <label class="field-label" for="f-phone">Điện thoại</label>
          <input class="form-input mono" id="f-phone" type="text" value="${v('phone')}">
          <p class="field-error" id="e-phone" hidden></p>
        </div>
        <div>
          <label class="field-label" for="f-dept">Phòng ban</label>
          <select class="form-select" id="f-dept">
            ${DEPTS.map(d => `<option ${u && u.dept === d ? 'selected' : ''}>${fmt.esc(d)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label" for="f-title">Chức danh tổ chức</label>
          <input class="form-input" id="f-title" type="text" value="${v('title')}">
        </div>
        <div>
          <label class="field-label" for="f-role">Vai trò trên hệ thống</label>
          <select class="form-select" id="f-role">
            ${ROLES.map(r => `<option ${u && u.role === r ? 'selected' : ''}>${fmt.esc(r)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label" for="f-scope">Phạm vi dữ liệu</label>
          <select class="form-select" id="f-scope">
            ${['Theo phòng ban', 'Theo khách hàng được phân công', 'Toàn hệ thống (công nợ)',
               'Toàn hệ thống', 'Chỉ đọc toàn hệ thống']
              .map(s => `<option ${u && u.scope === s ? 'selected' : ''}>${fmt.esc(s)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label" for="f-manager">Quản lý trực tiếp</label>
          <input class="form-input" id="f-manager" type="text" value="${v('manager')}">
        </div>
        <div>
          <label class="field-label" for="f-status">Trạng thái</label>
          <select class="form-select" id="f-status">
            ${Object.keys(STATUS).map(k => `<option value="${k}" ${u && u.status === k ? 'selected' : (k === 'pending' && !u ? 'selected' : '')}>${fmt.esc(STATUS[k].text)}</option>`).join('')}
          </select>
        </div>
        <div class="span2">
          <label class="field-label" for="f-note">Ghi chú quản trị</label>
          <textarea class="form-area" id="f-note">${v('note')}</textarea>
        </div>
        <div class="span2">
          <label class="check-line"><input type="checkbox" id="f-mfa" ${u && u.mfa ? 'checked' : ''}>
            <span>Yêu cầu bật xác thực 2 lớp khi đăng nhập lần đầu</span></label>
          <label class="check-line"><input type="checkbox" id="f-invite" ${u ? '' : 'checked'}>
            <span>Gửi lời mời kích hoạt qua email</span></label>
        </div>
      </div>
      <p class="form-hint">Trường đánh dấu <span style="color:var(--sienna)">*</span> là bắt buộc.
        Thay đổi vai trò hoặc phạm vi dữ liệu có hiệu lực ngay và được ghi vào Nhật ký hoạt động.</p>`;

    $('#drawer-foot').innerHTML = `
      <button class="btn btn--primary" type="button" data-act="save">Lưu tài khoản</button>
      <button class="btn btn--ghost" type="button" data-act="cancel">Hủy</button>`;
    showDrawer();
    $('#f-name').focus();
  }

  function fieldError(inp, err, msg) {
    $(inp).classList.add('is-invalid');
    $(err).hidden = false;
    $(err).textContent = msg;
  }

  function saveForm() {
    const name = $('#f-name').value.trim();
    const email = $('#f-email').value.trim();
    const phone = $('#f-phone').value.trim();

    $$('.form-input, .form-area').forEach(el => el.classList.remove('is-invalid'));
    $$('.field-error').forEach(el => { el.hidden = true; });

    let ok = true;
    if (!name) { fieldError('#f-name', '#e-name', 'Vui lòng nhập họ và tên.'); ok = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)) {
      fieldError('#f-email', '#e-email', 'Email không đúng định dạng.'); ok = false;
    } else if (state.list.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== state.open)) {
      fieldError('#f-email', '#e-email', 'Email đã được sử dụng bởi tài khoản khác.'); ok = false;
    }
    if (phone && !/^[\d\s+().-]{8,15}$/.test(phone)) {
      fieldError('#f-phone', '#e-phone', 'Số điện thoại không hợp lệ.'); ok = false;
    }
    if (!ok) {
      toast('Chưa lưu được tài khoản', 'Vui lòng kiểm tra các trường được đánh dấu.', 'error');
      return;
    }

    const payload = {
      name, email, phone,
      dept: $('#f-dept').value,
      title: $('#f-title').value.trim(),
      role: $('#f-role').value,
      scope: $('#f-scope').value,
      manager: $('#f-manager').value.trim(),
      status: $('#f-status').value,
      note: $('#f-note').value.trim(),
      mfa: $('#f-mfa').checked
    };

    if (state.open) {
      const u = state.list.filter(x => x.id === state.open)[0];
      Object.keys(payload).forEach(k => { u[k] = payload[k]; });
      toast('Đã lưu tài khoản', u.name + ' được cập nhật lúc 12/10/2026.', 'ok');
    } else {
      const n = state.list.length + 1;
      const created = Object.assign({
        id: 'U-0' + (n < 10 ? '0' + n : n),
        initials: name.split(' ').slice(-2).map(w => w.charAt(0)).join('').toUpperCase(),
        created: '10/2026', lastLoginAt: '', failed: 0, devices: 0
      }, payload);
      state.list.unshift(created);
      toast('Đã tạo tài khoản',
        $('#f-invite').checked ? 'Lời mời kích hoạt đã gửi tới ' + email + '.' : created.name + ' được tạo ở trạng thái Chờ kích hoạt.', 'ok');
    }
    closeDrawer();
    renderAll();
  }

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
  function renderAll() {
    renderKPI();
    renderTable();
    renderBulk();
    renderSide();
    $('#head-count').textContent = state.list.length + ' tài khoản';
  }

  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;
    $('#matrix-panel').hidden = state.loading || state.error;
    document.querySelector('.split-row').hidden = state.loading || state.error || state.empty;
    document.querySelector('.note-strip').hidden = state.loading || state.error;
  }

  // ------------------------------------------------------------------
  function bind() {
    $('#f-search').addEventListener('input', function () { state.q = this.value; renderTable(); });
    [['#f-dept', 'dept'], ['#f-role', 'role'], ['#f-status', 'status'],
     ['#f-mfa', 'mfa'], ['#f-scope', 'scope']].forEach(([sel, key]) => {
      $(sel).addEventListener('change', function () { state[key] = this.value; renderTable(); });
    });

    $('#btn-reset').addEventListener('click', () => {
      state.q = ''; state.dept = 'all'; state.role = 'all';
      state.status = 'all'; state.mfa = 'all'; state.scope = 'all';
      $('#f-search').value = '';
      ['#f-dept', '#f-role', '#f-status', '#f-mfa', '#f-scope'].forEach(s => { $(s).value = 'all'; });
      renderTable();
      toast('Đã xóa bộ lọc', 'Hiển thị lại toàn bộ danh sách tài khoản.', 'warn');
    });

    $$('#user-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        state.sort = { key, dir: state.sort.key === key && state.sort.dir === 'asc' ? 'desc' : 'asc' };
        $$('#user-table th[data-sort]').forEach(t => t.classList.remove('is-asc', 'is-desc'));
        th.classList.add(state.sort.dir === 'asc' ? 'is-asc' : 'is-desc');
        renderTable();
      });
    });

    $('#user-rows').addEventListener('click', function (e) {
      const check = e.target.closest('.row-check');
      if (check) {
        const id = check.dataset.check;
        const i = state.selected.indexOf(id);
        if (check.checked && i === -1) state.selected.push(id);
        if (!check.checked && i > -1) state.selected.splice(i, 1);
        renderTable(); renderBulk();
        return;
      }
      const row = e.target.closest('tr[data-id]');
      if (row) openDetail(row.dataset.id);
    });

    $('#check-all').addEventListener('change', function () {
      const ids = visible().map(u => u.id);
      if (this.checked) {
        ids.forEach(id => { if (state.selected.indexOf(id) === -1) state.selected.push(id); });
      } else {
        state.selected = state.selected.filter(id => ids.indexOf(id) === -1);
      }
      renderTable(); renderBulk();
    });

    $('#bulk-bar').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-bulk]');
      if (!btn) return;
      const act = btn.dataset.bulk;
      const picked = state.list.filter(u => state.selected.indexOf(u.id) > -1);
      if (act === 'clear') { state.selected = []; renderTable(); renderBulk(); return; }
      if (!picked.length) return;

      if (act === 'dept') {
        const dept = $('#bulk-dept').value;
        if (!dept) { toast('Chưa chọn phòng ban', 'Hãy chọn phòng ban rồi bấm Áp dụng.', 'error'); return; }
        picked.forEach(u => { u.dept = dept; });
        toast('Đã chuyển phòng ban', picked.length + ' tài khoản → ' + dept + '.', 'warn');
      } else if (act === 'mfa') {
        picked.forEach(u => { u.mfa = true; });
        toast('Đã yêu cầu bật 2FA', picked.length + ' tài khoản sẽ cần mã xác thực khi đăng nhập.', 'warn');
      } else if (act === 'export') {
        toast('Đang tạo tệp xuất', picked.length + ' tài khoản · định dạng CSV.', 'warn');
      } else if (act === 'lock') {
        picked.forEach(u => {
          if (u.role !== 'Quản trị hệ thống') u.status = 'locked';
        });
        toast('Đã khóa tài khoản', 'Tài khoản quản trị hệ thống không thể khóa hàng loạt — thao tác riêng lẻ nếu cần.', 'error');
      }
      state.selected = [];
      renderAll();
    });

    $('#drawer-close').addEventListener('click', closeDrawer);
    $('#drawer-overlay').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer();
    });

    $('#drawer-foot').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      const u = state.list.filter(x => x.id === state.open)[0];
      if (act === 'edit' && u) { openForm(u.id); return; }
      if (act === 'save') { saveForm(); return; }
      if (act === 'cancel') { closeDrawer(); return; }
      if (act === 'reset' && u) {
        toast('Đã gửi liên kết đặt lại mật khẩu', 'Liên kết có hiệu lực trong 30 phút · ' + u.email + '.', 'warn');
        return;
      }
      if (act === 'lock' && u) {
        u.status = 'locked';
        closeDrawer(); renderAll();
        toast('Đã khóa tài khoản', u.name + ' không thể đăng nhập cho tới khi mở khóa.', 'error');
      }
      if (act === 'unlock' && u) {
        u.status = 'active'; u.failed = 0;
        closeDrawer(); renderAll();
        toast('Đã mở khóa tài khoản', u.name + ' có thể đăng nhập trở lại.', 'ok');
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
      toast('Đang tạo tệp xuất', visible().length + ' tài khoản · định dạng CSV.', 'warn');
    });
    $('#btn-retry').addEventListener('click', load);
  }

  // ------------------------------------------------------------------
  async function load() {
    state.loading = true; state.error = false;
    render();
    try {
      const users = api.users
        ? await api.users.list()
        : JSON.parse(JSON.stringify(MOCK.DB.users));
      state.list = users.map(normalizeUser);
    } catch (e) {
      state.error = true;
    } finally {
      state.loading = false;
      if (demoState === 'error') state.error = true;
      if (demoState === 'empty') { state.empty = true; state.list = []; }
      if (!state.error && !state.empty) {
        DEPTS.forEach(d => {
          $('#f-dept').insertAdjacentHTML('beforeend', `<option value="${fmt.esc(d)}">${fmt.esc(d)}</option>`);
          $('#bulk-dept').insertAdjacentHTML('beforeend', `<option value="${fmt.esc(d)}">${fmt.esc(d)}</option>`);
        });
        ROLES.forEach(r => {
          $('#f-role').insertAdjacentHTML('beforeend', `<option value="${fmt.esc(r)}">${fmt.esc(r)}</option>`);
        });
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