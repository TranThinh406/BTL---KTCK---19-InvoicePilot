/* =========================================================
   InvoicePilot — js/ui.js
   Shell điều hướng · chủ đề · toast · modal · kiểm tra hợp lệ
   ========================================================= */
(function () {
  'use strict';
  const IP = (window.IP = window.IP || {});

  /* ---------- Tiện ích cơ sở ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  IP.$ = $; IP.$$ = $$; IP.$$$ = $$;
  IP.pageHref = function (target) {
    const source = new URL(target, location.href);
    const filename = decodeURIComponent(source.pathname.split('/').pop());
    let folder = 'Dùng chung';
    if (filename === 'login.html' || filename === 'register.html' || filename === 'forgot-password.html') folder = 'Đăng nhập';
    else if (filename === '403.html' || filename === '404.html') folder = 'Lỗi';
    else if (/^accountant-/.test(filename)) folder = 'Kế toán';
    else if (/^sales-/.test(filename)) folder = 'Kinh doanh';
    else if (/^manager-/.test(filename)) folder = 'Quản lý';
    else if (/^admin-/.test(filename)) folder = 'Quản trị';
    const root = new URL('../../', location.href);
    const resolved = new URL(encodeURIComponent(folder) + '/html/' + encodeURIComponent(filename), root);
    resolved.search = source.search;
    resolved.hash = source.hash;
    return resolved.href;
  };

  IP.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));

  const store = {
    get(key, fallback) {
      try { const raw = localStorage.getItem('invoicepilot:' + key);
            return raw === null ? fallback : JSON.parse(raw); }
      catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem('invoicepilot:' + key, JSON.stringify(value)); } catch (e) {} },
    remove(key)     { try { localStorage.removeItem('invoicepilot:' + key); } catch (e) {} }
  };
  IP.store = store;

  /* ---------- Biểu tượng (SVG nội tuyến) ---------- */
  const svg = (paths) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';

  IP.ICONS = {
    home:     svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/>'),
    file:     svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
    edit:     svg('<path d="M4 20h4l10-10a2.8 2.8 0 1 0-4-4L4 16z"/><path d="M13.5 6.5 17.5 10.5"/>'),
    scale:    svg('<path d="M12 4v16M6 8h12"/><path d="M4 16h6l-3-8zM14 16h6l-3-8z"/>'),
    users:    svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6"/><path d="M17.5 20a5.5 5.5 0 0 0-2.2-4.4"/>'),
    bell:     svg('<path d="M18 15V10a6 6 0 1 0-12 0v5l-1.6 2.4h15.2z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    chart:    svg('<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7.5" y="12" width="3" height="5"/><rect x="12.5" y="8.5" width="3" height="8.5"/><rect x="17" y="5.5" width="3" height="11.5"/>'),
    trend:    svg('<path d="M3 16.5 9 10l4 3.5L21 6"/><path d="M15 6h6v6"/>'),
    alert:    svg('<path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4.5M12 17.4v.2"/>'),
    building: svg('<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M15 10h2a2 2 0 0 1 2 2v9"/><path d="M8 7h4M8 11h4M8 15h4"/><path d="M3 21h18"/>'),
    shield:   svg('<path d="M12 3 5 6v5.5c0 4.4 2.9 8 7 9.5 4.1-1.5 7-5.1 7-9.5V6z"/><path d="M9.2 12.2 11.3 14.4 15 10.4"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z"/>'),
    user:     svg('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
    search:   svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>'),
    menu:     svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close:    svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    sun:      svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>'),
    moon:     svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
    logout:   svg('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 12h11"/><path d="M12 8.5 8.5 12 12 15.5"/>'),
    check:    svg('<path d="M5 12.5 10 17.5 19 6.5"/>'),
    info:     svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>'),
    plus:     svg('<path d="M12 5v14M5 12h14"/>'),
    arrow:    svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back:     svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    refresh:  svg('<path d="M20 11a8 8 0 1 0-1.2 5.2"/><path d="M20 5v6h-6"/>'),
    inbox:    svg('<path d="M4 13h4l1.6 2.6h4.8L16 13h4"/><path d="M4 13 6.2 5h11.6L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>'),
    laptop:   svg('<rect x="4" y="5.5" width="16" height="10" rx="1.8"/><path d="M2.5 19h19"/>'),
    phone:    svg('<rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 18h2"/>'),
    trash:    svg('<path d="M4.5 7h15M9.5 7V5h5v2"/><path d="M6.5 7l.9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12"/><path d="M10.5 11.5v6M13.5 11.5v6"/>'),
    mail:     svg('<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3.6 7 12 13l8.4-6"/>'),
    lock:     svg('<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>')
  };

  /* ---------- Mật khẩu ---------- */
  IP.passwordScore = function (pw) {
    if (!pw) return { score:0, label:'Chưa nhập mật khẩu' };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (pw.length < 8) s = Math.min(s, 1);
    const labels = ['Rất yếu','Yếu','Trung bình','Khá','Mạnh'];
    return { score:s, label:labels[s] + (s < 4 ? ' — nên thêm chữ hoa, số hoặc ký tự đặc biệt' : ' — đã đủ an toàn') };
  };

  /* ---------- Kiểm tra hợp lệ ---------- */
  IP.rules = {
    required: (v, msg = 'Vui lòng nhập trường này.') => (v || '').trim() ? '' : msg,
    email:    (v, msg = 'Email không đúng định dạng.') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test((v || '').trim()) ? '' : msg,
    phone:    (v, msg = 'Số điện thoại Việt Nam không hợp lệ.') =>
                /^(0|\+84)(3|5|7|8|9)\d{8}$/.test((v || '').replace(/[\s.-]/g, '')) ? '' : msg,
    minLen:   (v, n, msg) => (v || '').length >= n ? '' : (msg || `Vui lòng nhập tối thiểu ${n} ký tự.`),
    maxLen:   (v, n, msg) => (v || '').length <= n ? '' : (msg || `Tối đa ${n} ký tự.`),
    match:    (v, other, msg = 'Mật khẩu nhập lại không khớp.') => v === other ? '' : msg
  };

  IP.setFieldError = function (input, message) {
    const field = input.closest('.field');
    if (!field) return;
    const box = field.querySelector('.field-error');
    if (message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      if (box) { box.textContent = message; box.classList.add('is-shown'); }
    } else {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      if (box) { box.textContent = ''; box.classList.remove('is-shown'); }
    }
  };

  IP.validateFields = function (checks) {
    let firstBad = null, ok = true;
    checks.forEach(({ el, test }) => {
      const msg = test(el.value);
      IP.setFieldError(el, msg);
      if (msg) { ok = false; if (!firstBad) firstBad = el; }
    });
    if (firstBad) firstBad.focus();
    return ok;
  };

  /* ---------- Phiên đăng nhập ---------- */
  IP.getSession = () => store.get('session', null);

  IP.setSession = function (user) {
    store.set('session', {
      id:user.id, name:user.name, email:user.email,
      role:user.role, roleLabel:user.roleLabel,
      color:user.color || '#0E7C61'
    });
  };

  IP.initials = (name) => {
    const parts = String(name || '?').trim().split(/\s+/);
    return ((parts[0] || '')[0] + (parts[parts.length - 1] || '')[0] || '?').toUpperCase();
  };

  IP.logout = function () {
    IP.confirm({
      title:'Đăng xuất khỏi InvoicePilot?',
      body:'Phiên làm việc hiện tại sẽ kết thúc trên trình duyệt này.',
      confirmText:'Đăng xuất',
      tone:'danger'
    }).then((confirmed) => {
      if (!confirmed) return;
      store.remove('session');
      IP.toast('Đã đăng xuất', 'info', 'Phiên làm việc trên trình duyệt này đã kết thúc.');
      setTimeout(() => { location.href = IP.pageHref('index.html'); }, 620);
    });
  };

  IP.guard = function () {
    if (document.body.dataset.auth !== 'required') return;
    if (!IP.getSession()) {
      const next = encodeURIComponent(location.href);
      location.href = IP.pageHref('login.html') + '?next=' + next;
    }
  };

  /* ---------- Thông báo nổi (toast) ---------- */
  IP.toast = function (title, type = 'success', desc = '', timeout = 4200) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const icons = { success:'check', error:'alert', warning:'alert', info:'info' };
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML =
      '<span class="toast-icon">' + IP.ICONS[icons[type] || 'info'] + '</span>' +
      '<div><strong>' + IP.esc(title) + '</strong>' + (desc ? '<p>' + IP.esc(desc) + '</p>' : '') + '</div>';
    region.appendChild(el);
    const remove = () => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 280);
    };
    el.addEventListener('click', remove);
    setTimeout(remove, timeout);
  };

  /* ---------- Cửa sổ bật (modal xác nhận) ---------- */
  IP.confirm = function (opts) {
    const o = Object.assign({
      title:'Xác nhận thao tác', body:'Bạn có chắc muốn tiếp tục với thao tác này?', confirmText:'Xác nhận',
      cancelText:'Hủy', tone:'danger'
    }, opts || {});
    return new Promise((resolve) => {
      const activeElement = document.activeElement;
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML =
        '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">' +
          '<h2 id="modal-title">' + IP.esc(o.title) + '</h2>' +
          '<p id="modal-desc">' + IP.esc(String(o.body || '').trim() || 'Bạn có chắc muốn tiếp tục với thao tác này?') + '</p>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn btn-ghost" data-act="cancel">' + IP.esc(o.cancelText) + '</button>' +
            '<button type="button" class="btn ' + (o.tone === 'danger' ? 'btn-danger' : 'btn-primary') + '" data-act="ok">' +
              IP.esc(o.confirmText) + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(backdrop);
      const okBtn = backdrop.querySelector('[data-act="ok"]');
      const close = (val) => {
        backdrop.remove();
        document.removeEventListener('keydown', onKey);
        if (activeElement && activeElement.isConnected) activeElement.focus();
        resolve(val);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') { close(false); return; }
        if (e.key !== 'Tab') return;
        const buttons = Array.from(backdrop.querySelectorAll('button:not(:disabled)'));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      };
      okBtn.focus();
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(false);
        const act = e.target.closest('[data-act]');
        if (!act) return;
        close(act.dataset.act === 'ok');
      });
      document.addEventListener('keydown', onKey);
    });
  };

  /* ---------- Chủ đề sáng/tối ---------- */
  IP.themeName = () => store.get('theme', 'light');

  IP.applyTheme = function (mode) {
    const resolved = mode === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.documentElement.setAttribute('data-theme', resolved);
    store.set('theme', mode);
    IP.syncThemeButtons();
  };

  IP.syncThemeButtons = function () {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    $$('[data-theme-toggle]').forEach((b) => {
      b.innerHTML = isDark ? IP.ICONS.sun : IP.ICONS.moon;
      b.setAttribute('aria-label', isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
      b.setAttribute('title', b.getAttribute('aria-label'));
    });
  };

  IP.toggleTheme = function () {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    IP.applyTheme(next);
  };

  /* ---------- Shell điều hướng ---------- */
  const NAV_GROUPS = [
    { title:'Tổng quan',     items:['index.html'] },
    { title:'Kế toán',       items:['accountant-invoice-list.html','accountant-invoice-form.html','accountant-reconciliation.html'] },
    { title:'Kinh doanh',    items:['sales-customer-balance.html','sales-payment-reminders.html','sales-invoice-detail.html'] },
    { title:'Quản lý',       items:['manager-receivable-dashboard.html','manager-overdue-invoices.html','manager-cashflow-forecast.html'] },
    { title:'Quản trị viên', items:['admin-customer-management.html','admin-user-management.html','admin-invoice-settings.html'] },
    { title:'Tài khoản',     items:['profile.html','settings.html','notifications.html'] }
  ];

  const byHref = (href) => IP.data.pages.find((p) => p.href === href) || null;

  function topbarHTML(layout) {
    const session = IP.getSession();
    const unread = IP.data.notifications.filter((n) => !n.read).length;
    return '' +
    '<header class="topbar" id="topbar">' +
      (layout === 'app'
        ? '<button class="icon-btn" id="nav-toggle" type="button" aria-label="Mở menu điều hướng" aria-expanded="false" aria-controls="sidebar">' + IP.ICONS.menu + '</button>'
        : '') +
      '<a class="brand" href="' + IP.pageHref('index.html') + '">' +
        '<span class="brand-mark" aria-hidden="true">IP</span>' +
        '<span>InvoicePilot<small>Theo dõi hóa đơn &amp; công nợ</small></span>' +
      '</a>' +
      (layout === 'app'
        ? '<div class="search-box"><label class="sr-only" for="global-search">Tìm màn hình</label>' +
            IP.ICONS.search +
            '<input class="input" id="global-search" type="search" placeholder="Tìm màn hình, hóa đơn…" autocomplete="off">' +
            '<kbd>/</kbd></div>'
        : '') +
      '<div class="topbar-spacer"></div>' +
      '<button class="icon-btn" type="button" data-theme-toggle aria-label="Chuyển giao diện sáng tối"></button>' +
      (layout === 'app'
        ? '<a class="icon-btn" href="' + IP.pageHref('notifications.html') + '" aria-label="Thông báo, ' + unread + ' chưa đọc">' +
            IP.ICONS.bell +
            '<span class="badge-count" id="bell-count"' + (unread ? '' : ' hidden') + '>' + unread + '</span></a>' +
          '<div class="dropdown" id="user-dropdown">' +
            '<button class="icon-btn" type="button" id="user-menu-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Menu tài khoản">' +
              '<span class="avatar" style="background:' + (session ? session.color : '#0E7C61') + '">' +
                IP.initials(session ? session.name : 'Khách') + '</span></button>' +
            '<div class="dropdown-menu" id="user-menu" role="menu" hidden>' +
              '<div class="dropdown-head"><strong>' + IP.esc(session ? session.name : 'Khách') + '</strong>' +
                '<span>' + IP.esc(session ? session.email : 'Chưa đăng nhập') + '</span></div>' +
              '<a class="dropdown-item" role="menuitem" href="' + IP.pageHref('profile.html') + '">' + IP.ICONS.user + 'Hồ sơ cá nhân</a>' +
              '<a class="dropdown-item" role="menuitem" href="' + IP.pageHref('settings.html') + '">' + IP.ICONS.settings + 'Cài đặt</a>' +
              '<a class="dropdown-item" role="menuitem" href="' + IP.pageHref('notifications.html') + '">' + IP.ICONS.bell + 'Thông báo</a>' +
              '<div class="dropdown-sep"></div>' +
              (session
                ? '<button class="dropdown-item danger" role="menuitem" type="button" data-action="logout">' + IP.ICONS.logout + 'Đăng xuất</button>'
                : '<a class="dropdown-item" role="menuitem" href="' + IP.pageHref('login.html') + '">' + IP.ICONS.lock + 'Đăng nhập</a>') +
            '</div>' +
          '</div>'
        : '<a class="btn btn-ghost btn-sm" href="' + IP.pageHref('login.html') + '">Đăng nhập</a>' +
          '<a class="btn btn-primary btn-sm" href="' + IP.pageHref('register.html') + '">Dùng thử</a>') +
    '</header>';
  }

  function sidebarHTML() {
    const current = document.body.dataset.page;
    let html = '<nav class="sidebar" id="sidebar" aria-label="Điều hướng chính"><div class="sidebar-scrim" id="sidebar-scrim" hidden></div>';
    NAV_GROUPS.forEach((g) => {
      html += '<div class="nav-group"><h2>' + IP.esc(g.title) + '</h2>';
      g.items.forEach((href) => {
        const p = byHref(href);
        if (!p) return;
        const active = p.page === current ? ' aria-current="page"' : '';
        html += '<a class="nav-link" href="' + IP.pageHref(p.href) + '"' + active + '>' +
                IP.ICONS[p.icon] + IP.esc(p.label) + '</a>';
      });
      html += '</div>';
    });
    html += '<div class="sidebar-foot"><strong>Nguyên mẫu Frontend</strong>' +
            'Dữ liệu mô phỏng lưu trên trình duyệt của bạn (LocalStorage).</div></nav>';
    return html;
  }

  function footerHTML() {
    return '<div class="footer-inner"><div class="footer-grid">' +
      '<div class="footer-about">' +
        '<a class="brand" href="' + IP.pageHref('index.html') + '"><span class="brand-mark" aria-hidden="true">IP</span>' +
        '<span>InvoicePilot</span></a>' +
        '<p>Sản phẩm Web Frontend cho học phần CSE122 — giúp doanh nghiệp nhỏ theo dõi hóa đơn, công nợ và dòng tiền đúng hạn.</p>' +
      '</div>' +
      '<div><h2>Vai trò</h2><ul>' +
        '<li><a href="' + IP.pageHref('accountant-invoice-list.html') + '">Kế toán</a></li>' +
        '<li><a href="' + IP.pageHref('sales-customer-balance.html') + '">Kinh doanh</a></li>' +
        '<li><a href="' + IP.pageHref('manager-receivable-dashboard.html') + '">Quản lý</a></li>' +
        '<li><a href="' + IP.pageHref('admin-customer-management.html') + '">Quản trị viên</a></li>' +
      '</ul></div>' +
      '<div><h2>Tài khoản</h2><ul>' +
        '<li><a href="' + IP.pageHref('login.html') + '">Đăng nhập</a></li>' +
        '<li><a href="' + IP.pageHref('register.html') + '">Đăng ký</a></li>' +
        '<li><a href="' + IP.pageHref('forgot-password.html') + '">Quên mật khẩu</a></li>' +
        '<li><a href="' + IP.pageHref('profile.html') + '">Hồ sơ</a></li>' +
      '</ul></div>' +
      '<div><h2>Hỗ trợ</h2><ul>' +
        '<li><a href="' + IP.pageHref('notifications.html') + '">Trung tâm thông báo</a></li>' +
        '<li><a href="' + IP.pageHref('settings.html') + '">Cài đặt hệ thống</a></li>' +
        '<li><a href="' + IP.pageHref('403.html') + '">Trang 403</a></li>' +
        '<li><a href="' + IP.pageHref('404.html') + '">Trang 404</a></li>' +
      '</ul></div>' +
    '</div>' +
    '<div class="footer-bottom">' +
      '<span>© 2026 InvoicePilot — BTL-19 · CSE122 · Nhóm 3 sinh viên.</span>' +
      '<span>Nguyên mẫu Frontend · Dữ liệu giả lập · Không có máy chủ thật.</span>' +
    '</div></div>';
  }

  function wireShell() {
    /* Nút đổi chủ đề */
    $$('[data-theme-toggle]').forEach((b) => b.addEventListener('click', IP.toggleTheme));
    IP.syncThemeButtons();

    /* Menu tài khoản */
    const dd = $('#user-dropdown');
    if (dd) {
      const btn = $('#user-menu-btn'), menu = $('#user-menu');
      const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = menu.hidden;
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', (e) => { if (!dd.contains(e.target)) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }

    /* Đăng xuất */
    const out = $('[data-action="logout"]');
    if (out) out.addEventListener('click', IP.logout);

    /* Menu mobile */
    const navToggle = $('#nav-toggle'), sidebar = $('#sidebar'), scrim = $('#sidebar-scrim');
    if (navToggle && sidebar) {
      const setNav = (open) => {
        sidebar.classList.toggle('is-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        if (scrim) scrim.hidden = !open;
        document.body.style.overflow = open ? 'hidden' : '';
      };
      navToggle.addEventListener('click', () => setNav(!sidebar.classList.contains('is-open')));
      if (scrim) scrim.addEventListener('click', () => setNav(false));
      sidebar.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
      window.addEventListener('resize', () => { if (window.innerWidth > 980) setNav(false); });
    }

    /* Bóng đổ topbar khi cuộn */
    const topbar = $('#topbar');
    if (topbar) {
      const onScroll = () => topbar.classList.toggle('is-stuck', window.scrollY > 8);
      window.addEventListener('scroll', onScroll, { passive:true });
      onScroll();
    }

    /* Tìm kiếm toàn cục → nhảy tới màn hình khớp */
    const gs = $('#global-search');
    if (gs) {
      gs.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const q = gs.value.trim().toLowerCase();
        if (!q) return;
        const hit = IP.data.pages.find((p) =>
          p.label.toLowerCase().includes(q) || p.href.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)
        );
        if (hit) location.href = IP.pageHref(hit.href);
        else IP.toast('Không tìm thấy màn hình', 'warning', 'Thử từ khóa khác như "hóa đơn", "công nợ", "nhắc".');
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); gs.focus(); }
      });
    }
  }

  IP.renderShell = function () {
    const layout = document.body.dataset.layout || 'public';
    const host = $('#shell');
    if (!host) return;
    if (layout === 'app') {
      host.innerHTML = '<div class="app-body">' + topbarHTML('app') +
        sidebarHTML() + '</div>';
      /* Đưa main vào trong app-main để có margin trái */
      const main = $('#main');
      if (main) {
        const wrapper = document.createElement('div');
        wrapper.className = 'app-main';
        host.querySelector('.app-body').appendChild(wrapper);
        wrapper.appendChild(main);
        const foot = $('#site-footer');
        if (foot) wrapper.appendChild(foot);
      }
    } else {
      host.innerHTML = topbarHTML('public');
    }
    const foot = $('#site-footer');
    if (foot && layout !== 'app') foot.innerHTML = footerHTML();
    else if (foot && layout === 'app') foot.innerHTML = footerHTML();
    wireShell();
  };

  /* ---------- Khởi tạo chung ---------- */
  IP.boot = function () {
    IP.applyTheme(IP.themeName());
    IP.guard();
    IP.renderShell();
    if (typeof IP.initPage === 'function') IP.initPage();
  };
})();