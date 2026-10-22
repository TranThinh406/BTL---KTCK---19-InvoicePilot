/* =========================================================
   InvoicePilot — js/main.js
   Logic riêng của từng màn hình dùng chung
   ========================================================= */
(function () {
  'use strict';
  const IP = window.IP;
  const $ = IP.$, $$ = IP.$$;
  const D = IP.data;

  /* Ghi đè IP.initPage — ui.js sẽ gọi sau khi dựng shell */
  IP.initPage = function () {
    const page = document.body.dataset.page;
    const map = {
      home: homePage, login: loginPage, register: registerPage,
      forgot: forgotPage, profile: profilePage, settings: settingsPage,
      notifications: notificationsPage, '403': error403Page, '404': error404Page
    };
    (map[page] || function () {})();
  };

  /* =========================================================
     1) index.html — trang giới thiệu
     ========================================================= */
  function homePage() {
    /* Bộ đếm số liệu khi cuộn tới */
    $$('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      let started = false;
      const run = () => {
        if (started) return;
        started = true;
        const dur = 900, t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('vi-VN') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect(); } });
        }, { threshold:.4 });
        io.observe(el);
      } else run();
    });

    /* Tab vai trò */
    const tabs = $$('[role="tab"]');
    const activate = (tab) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus(); activate(next);
      });
    });

    /* Nếu vừa đăng nhập → đổi CTA */
    const session = IP.getSession();
    const heroCta = $('#hero-primary');
    if (session && heroCta) {
      heroCta.textContent = 'Vào vai ' + session.roleLabel;
      heroCta.setAttribute('href', IP.pageHref('profile.html'));
    }
  }

  /* =========================================================
     2) login.html
     ========================================================= */
  function loginPage() {
    const form = $('#login-form');
    if (!form) return;
    const email = $('#login-email'), pass = $('#login-password');
    const toggle = $('#toggle-password');
    const submit = $('#login-submit');
    const errorBox = $('#login-error');

    /* Email được chuyển sang từ trang đăng ký */
    const pending = IP.store.get('pendingEmail', '');
    if (pending) { email.value = pending; IP.store.remove('pendingEmail'); }

    /* next= để quay lại trang đang dở */
    const nextParam = new URLSearchParams(location.search).get('next');

    if (toggle) {
      toggle.addEventListener('click', () => {
        const show = pass.type === 'password';
        pass.type = show ? 'text' : 'password';
        toggle.textContent = show ? 'Ẩn' : 'Hiện';
        toggle.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      });
    }

    /* Tài khoản demo */
    $$('[data-demo]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const user = D.users.find((u) => u.role === chip.dataset.demo);
        if (!user) return;
        email.value = user.email; pass.value = user.password;
        IP.setFieldError(email, ''); IP.setFieldError(pass, '');
        IP.toast('Đã điền tài khoản mẫu', 'info', user.roleLabel + ' — nhấn Đăng nhập để tiếp tục.');
        submit.focus();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }

      const ok = IP.validateFields([
        { el:email, test:(v) => IP.rules.required(v, 'Vui lòng nhập email.') || IP.rules.email(v) },
        { el:pass,  test:(v) => IP.rules.required(v, 'Vui lòng nhập mật khẩu.') }
      ]);
      if (!ok) return;

      /* Trạng thái đang xử lý */
      const original = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner" aria-hidden="true"></span>Đang xác thực…';

      setTimeout(() => {
        const user = D.users.find((u) =>
          u.email.toLowerCase() === email.value.trim().toLowerCase() && u.password === pass.value
        );

        submit.disabled = false;
        submit.innerHTML = original;

        if (!user) {
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = 'Email hoặc mật khẩu không đúng. Dùng tài khoản mẫu bên dưới để thử.';
          }
          IP.setFieldError(pass, 'Mật khẩu không khớp với email này.');
          return;
        }
        if (user.status !== 'active') {
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = 'Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên.';
          }
          return;
        }

        IP.setSession(user);
        IP.toast('Đăng nhập thành công', 'success', 'Xin chào ' + user.name + ' — vai trò ' + user.roleLabel + '.');
        setTimeout(() => {
          const projectRoot = new URL('../../', location.href).href;
          const destination = nextParam && nextParam.startsWith(projectRoot)
            ? nextParam
            : IP.pageHref('index.html');
          location.href = destination;
        }, 700);
      }, 850);
    });

    /* Xóa lỗi khi người dùng sửa */
    [email, pass].forEach((el) => el.addEventListener('input', () => IP.setFieldError(el, '')));
  }

  /* =========================================================
     3) register.html
     ========================================================= */
  function registerPage() {
    const form = $('#register-form');
    if (!form) return;
    const name = $('#reg-name'), email = $('#reg-email'), company = $('#reg-company');
    const pass = $('#reg-password'), confirm = $('#reg-confirm');
    const terms = $('#reg-terms');
    const strength = $('#password-strength'), strengthLabel = $('#password-strength-label');
    const errorBox = $('#register-error');

    pass.addEventListener('input', () => {
      const { score, label } = IP.passwordScore(pass.value);
      if (strength) strength.dataset.score = String(score);
      if (strengthLabel) strengthLabel.textContent = label;
      IP.setFieldError(pass, '');
    });

    [name, email, confirm].forEach((el) => el.addEventListener('input', () => IP.setFieldError(el, '')));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (errorBox) errorBox.hidden = true;

      const ok = IP.validateFields([
        { el:name,  test:(v) => IP.rules.required(v, 'Vui lòng nhập họ và tên.') || IP.rules.minLen(v, 2) },
        { el:email, test:(v) => IP.rules.required(v, 'Vui lòng nhập email.') || IP.rules.email(v) },
        { el:pass,  test:(v) => IP.rules.required(v, 'Vui lòng nhập mật khẩu.') || IP.rules.minLen(v, 8, 'Mật khẩu cần ít nhất 8 ký tự.') },
        { el:confirm, test:(v) => IP.rules.required(v, 'Vui lòng nhập lại mật khẩu.') || IP.rules.match(v, pass.value) }
      ]);
      if (!ok) return;

      /* Email đã tồn tại trong dữ liệu giả lập */
      const duplicated = D.users.some((u) => u.email.toLowerCase() === email.value.trim().toLowerCase());
      if (duplicated) {
        IP.setFieldError(email, 'Email này đã được đăng ký trong hệ thống.');
        if (errorBox) {
          errorBox.hidden = false;
          errorBox.textContent = 'Email đã tồn tại. Thử đăng nhập hoặc dùng email khác.';
        }
        return;
      }

      if (!terms.checked) {
        if (errorBox) {
          errorBox.hidden = false;
          errorBox.textContent = 'Bạn cần đồng ý với điều khoản sử dụng để tiếp tục.';
        }
        terms.focus();
        return;
      }

      /* Trạng thái đang xử lý */
      const btn = $('#register-submit');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Đang tạo tài khoản…';

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = original;
        IP.store.set('pendingEmail', email.value.trim());
        /* Trạng thái thành công */
        $('#register-form').hidden = true;
        const done = $('#register-success');
        if (done) {
          done.hidden = false;
          done.querySelector('h2').focus();
        }
        IP.toast('Tạo tài khoản thành công', 'success', 'Tài khoản được lưu tạm trên trình duyệt này (mock).');
      }, 950);
    });
  }

  /* =========================================================
     4) forgot-password.html
     ========================================================= */
  function forgotPage() {
    const form = $('#forgot-form');
    if (!form) return;
    const email = $('#forgot-email');
    const submit = $('#forgot-submit');
    const errorBox = $('#forgot-error');
    let timerId = null;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (errorBox) errorBox.hidden = true;

      const ok = IP.validateFields([
        { el:email, test:(v) => IP.rules.required(v, 'Vui lòng nhập email.') || IP.rules.email(v) }
      ]);
      if (!ok) return;

      const original = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner" aria-hidden="true"></span>Đang gửi hướng dẫn…';

      setTimeout(() => {
        submit.disabled = false;
        submit.innerHTML = original;

        const exists = D.users.some((u) => u.email.toLowerCase() === email.value.trim().toLowerCase());
        if (!exists) {
          IP.setFieldError(email, 'Không tìm thấy email này trong hệ thống (dữ liệu giả lập).');
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = 'Không thể xử lý yêu cầu lúc này với email trên. Kiểm tra lại hoặc đăng ký tài khoản mới.';
          }
          return;
        }

        /* Trạng thái thành công + đếm ngược gửi lại */
        $('#forgot-form').hidden = true;
        const done = $('#forgot-success');
        if (done) {
          done.hidden = false;
          done.querySelector('h2').focus();
          $('#sent-email').textContent = email.value.trim();
          startCountdown();
        }
        IP.toast('Đã gửi hướng dẫn khôi phục', 'success', 'Kiểm tra hộp thư của bạn (mô phỏng).');
      }, 950);
    });

    function startCountdown() {
      const btn = $('#resend-btn');
      if (!btn) return;
      let left = 30;
      btn.disabled = true;
      const label = () => { btn.textContent = 'Gửi lại sau ' + left + 's'; };
      label();
      clearInterval(timerId);
      timerId = setInterval(() => {
        left--;
        if (left <= 0) {
          clearInterval(timerId);
          btn.disabled = false;
          btn.textContent = 'Gửi lại hướng dẫn';
        } else label();
      }, 1000);

      btn.onclick = () => {
        IP.toast('Đã gửi lại hướng dẫn', 'info', 'Mô phỏng: email khôi phục được gửi lại.');
        startCountdown();
      };
    }

    /* Chuyển sang trạng thái nhập email khác */
    const other = $('#use-other-email');
    if (other) {
      other.addEventListener('click', () => {
        $('#forgot-success').hidden = true;
        $('#forgot-form').hidden = false;
        clearInterval(timerId);
        email.value = ''; email.focus();
      });
    }
  }

  /* =========================================================
     5) profile.html
     ========================================================= */
  function profilePage() {
    const session = IP.getSession();
    if (!session) return;

    /* Điền thông tin ban đầu */
    $('#pf-name').value = session.name;
    $('#pf-email').value = session.email;
    $('#pf-role').value = session.roleLabel;
    $('#pf-dept').value = (D.users.find((u) => u.id === session.id) || {}).dept || '—';
    $('#pf-phone').value = (D.users.find((u) => u.id === session.id) || {}).phone || '';

    const avatarBox = $('#pf-avatar');
    const paintAvatar = (name) => {
      avatarBox.textContent = IP.initials(name);
      avatarBox.style.background = session.color;
    };
    paintAvatar(session.name);
    $('#pf-name').addEventListener('input', (e) => paintAvatar(e.target.value || session.name));

    /* Lưu hồ sơ */
    $('#profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = IP.validateFields([
        { el:$('#pf-name'),  test:(v) => IP.rules.required(v, 'Vui lòng nhập họ và tên.') || IP.rules.minLen(v, 2) },
        { el:$('#pf-phone'), test:(v) => (v.trim() === '' ? '' : IP.rules.phone(v)) }
      ]);
      if (!ok) return;

      const btn = $('#profile-save');
      btn.disabled = true;
      setTimeout(() => {
        btn.disabled = false;
        const user = D.users.find((u) => u.id === session.id);
        if (user) { user.name = $('#pf-name').value.trim(); user.phone = $('#pf-phone').value.trim(); }
        IP.setSession(Object.assign({}, session, { name:user.name }));
        IP.toast('Đã lưu hồ sơ', 'success', 'Thông tin của bạn đã được cập nhật trên trình duyệt này.');
      }, 620);
    });

    /* Đổi mật khẩu */
    const pwForm = $('#password-form');
    const newPw = $('#pf-new-password');
    const strength = $('#pf-strength'), strengthLabel = $('#pf-strength-label');
    newPw.addEventListener('input', () => {
      const { score, label } = IP.passwordScore(newPw.value);
      strength.dataset.score = String(score);
      strengthLabel.textContent = label;
    });

    pwForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cur = $('#pf-current-password'), np = newPw, cf = $('#pf-confirm-password');
      const ok = IP.validateFields([
        { el:cur, test:(v) => IP.rules.required(v, 'Nhập mật khẩu hiện tại.') },
        { el:np,  test:(v) => IP.rules.required(v, 'Nhập mật khẩu mới.') || IP.rules.minLen(v, 8, 'Mật khẩu mới cần ít nhất 8 ký tự.') },
        { el:cf,  test:(v) => IP.rules.required(v, 'Nhập lại mật khẩu mới.') || IP.rules.match(v, np.value) }
      ]);
      if (!ok) return;

      const user = D.users.find((u) => u.id === session.id);
      if (!user || user.password !== cur.value) {
        IP.setFieldError(cur, 'Mật khẩu hiện tại không đúng.');
        return;
      }
      user.password = np.value;
      pwForm.reset();
      IP.toast('Đã đổi mật khẩu', 'success', 'Dùng mật khẩu mới ở lần đăng nhập kế tiếp.');
    });

    /* Phiên hoạt động */
    const sessions = [
      { id:'S1', icon:'laptop', name:'Chrome trên Windows', meta:'Hà Nội · IP 113.161.xx.xx · hoạt động lúc này', current:true },
      { id:'S2', icon:'phone',  name:'Safari trên iPhone',  meta:'Hà Nội · IP 113.161.xx.xx · 2 ngày trước', current:false },
      { id:'S3', icon:'laptop', name:'Edge trên Windows',   meta:'Hồ Chí Minh · IP 42.112.xx.xx · 6 ngày trước', current:false }
    ];
    const list = $('#session-list');
    const paintSessions = () => {
      if (!sessions.length) {
        list.innerHTML =
          '<div class="state"><div class="state-icon">' + IP.ICONS.laptop + '</div>' +
          '<h3>Không còn phiên hoạt động nào</h3><p>Chỉ còn phiên hiện tại của bạn trên trình duyệt này.</p></div>';
        return;
      }
      list.innerHTML = sessions.map((s) =>
        '<div class="session-row"><span class="s-icon">' + IP.ICONS[s.icon] + '</span>' +
        '<div class="s-body"><strong>' + IP.esc(s.name) + '</strong><span>' + IP.esc(s.meta) + '</span></div>' +
        (s.current ? '<span class="pill pill-green">Hiện tại</span>'
                   : '<button class="btn btn-ghost btn-sm" type="button" data-revoke="' + s.id + '">Đăng xuất</button>') +
        '</div>').join('');
    };
    paintSessions();

    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-revoke]');
      if (!btn) return;
      const yes = await IP.confirm({
        title:'Đăng xuất phiên này?',
        body:'Thiết bị sẽ bị đăng xuất khỏi InvoicePilot. Bạn có thể đăng nhập lại bất cứ lúc nào.',
        confirmText:'Đăng xuất phiên', tone:'danger'
      });
      if (!yes) return;
      const idx = sessions.findIndex((s) => s.id === btn.dataset.revoke);
      if (idx > -1) sessions.splice(idx, 1);
      paintSessions();
      IP.toast('Đã đăng xuất phiên', 'success', 'Phiên hoạt động đã được thu hồi.');
    });
  }

  /* =========================================================
     6) settings.html
     ========================================================= */
  const SETTINGS_KEY = 'settings';
  const DEFAULTS = {
    company:'Doanh nghiệp nhỏ Demo', currency:'VND', dateFormat:'dd/MM/yyyy', timezone:'Asia/Ho_Chi_Minh',
    theme:'light', density:'comfortable',
    nInvoice:true, nReminder:true, nAi:true, nWeekly:false, nSound:false,
    twoFactor:false, timeout:'30'
  };

  function settingsPage() {
    let state = Object.assign({}, DEFAULTS, IP.store.get(SETTINGS_KEY, {}));
    const dirty = { value:false };

    /* Tabs */
    const tabs = $$('[role="tab"]');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
        });
      });
    });

    const markDirty = () => {
      dirty.value = true;
      $('#save-bar').hidden = false;
    };

    /* Áp dụng giá trị vào giao diện */
    const paint = () => {
      $('#set-company').value = state.company;
      $('#set-currency').value = state.currency;
      $('#set-dateformat').value = state.dateFormat;
      $('#set-timezone').value = state.timezone;
      $('#set-density').value = state.density;
      $('#set-timeout').value = state.timeout;
      $$('input[name="theme"]').forEach((r) => { r.checked = r.value === state.theme; });
      $$('[data-switch]').forEach((s) => { s.checked = !!state[s.dataset.switch]; });
      updatePreview();
    };

    const updatePreview = () => {
      const now = new Date();
      const opts = {
        'dd/MM/yyyy': { day:'2-digit', month:'2-digit', year:'numeric' },
        'MM/dd/yyyy': { month:'2-digit', day:'2-digit', year:'numeric' },
        'yyyy-MM-dd': { year:'numeric', month:'2-digit', day:'2-digit' }
      }[state.dateFormat] || { day:'2-digit', month:'2-digit', year:'numeric' };
      const sample = 1234567890;
      $('#preview-line').innerHTML =
        '<strong>' + IP.esc(state.company) + '</strong> · ' +
        new Intl.NumberFormat('vi-VN', { style:'currency', currency:state.currency }).format(sample) + ' · ' +
        now.toLocaleDateString('vi-VN', opts) + ' · ' + IP.esc(state.timezone);
    };

    /* Sự kiện thay đổi */
    ['#set-company','#set-currency','#set-dateformat','#set-timezone','#set-density','#set-timeout']
      .forEach((sel) => $(sel).addEventListener('input', (e) => {
        state[sel.replace('#set-','').replace('dateformat','dateFormat')] = e.target.value;
        updatePreview(); markDirty();
      }));

    $$('input[name="theme"]').forEach((r) => r.addEventListener('change', () => {
      state.theme = r.value; IP.applyTheme(r.value); markDirty();
    }));

    $$('[data-switch]').forEach((s) => s.addEventListener('change', () => {
      state[s.dataset.switch] = s.checked; markDirty();
    }));

    /* Lưu cài đặt */
    $('#settings-save').addEventListener('click', () => {
      IP.store.set(SETTINGS_KEY, state);
      dirty.value = false;
      $('#save-bar').hidden = true;
      IP.toast('Đã lưu cài đặt', 'success', 'Các tùy chọn được giữ lại trên trình duyệt này.');
    });

    /* Hủy thay đổi */
    $('#settings-discard').addEventListener('click', async () => {
      if (dirty.value) {
        const confirmed = await IP.confirm({
          title:'Hủy các thay đổi cài đặt?',
          body:'Các thay đổi chưa lưu sẽ bị loại bỏ và cài đặt được đưa về lần lưu gần nhất.',
          confirmText:'Hủy thay đổi',
          tone:'danger'
        });
        if (!confirmed) return;
      }
      state = Object.assign({}, DEFAULTS, IP.store.get(SETTINGS_KEY, {}));
      paint();
      dirty.value = false;
      $('#save-bar').hidden = true;
      IP.toast('Đã hủy thay đổi', 'info', 'Cài đặt trở về giá trị đã lưu gần nhất.');
    });

    /* Khôi phục mặc định */
    $('#settings-reset').addEventListener('click', async () => {
      const yes = await IP.confirm({
        title:'Khôi phục cài đặt mặc định?',
        body:'Toàn bộ tùy chọn giao diện, thông báo và bảo mật sẽ trở về trạng thái ban đầu.',
        confirmText:'Khôi phục', tone:'danger'
      });
      if (!yes) return;
      state = Object.assign({}, DEFAULTS);
      paint();
      IP.applyTheme(state.theme);
      IP.store.set(SETTINGS_KEY, state);
      dirty.value = false;
      $('#save-bar').hidden = true;
      IP.toast('Đã khôi phục mặc định', 'success');
    });

    paint();
  }

  /* =========================================================
     7) notifications.html
     ========================================================= */
  function notificationsPage() {
    const list = $('#notif-list');
    const search = $('#notif-search');
    let filter = 'all';

    const unreadCount = () => D.notifications.filter((n) => !n.read).length;
    const paintCounts = () => {
      $('#count-all').textContent = D.notifications.length;
      $('#count-unread').textContent = unreadCount();
      $('#count-reminder').textContent = D.notifications.filter((n) => n.type === 'reminder').length;
      $('#count-ai').textContent = D.notifications.filter((n) => n.type === 'ai').length;
      const bell = document.getElementById('bell-count');
      if (bell) {
        const c = unreadCount();
        bell.textContent = c;
        bell.hidden = c === 0;
        const bellLink = bell.closest('a');
        if (bellLink) bellLink.setAttribute('aria-label', 'Thông báo, ' + c + ' chưa đọc');
      }
    };

    const timeAgo = (iso) => {
      const diff = (Date.now() - new Date(iso).getTime()) / 60000;
      if (diff < 1) return 'vừa xong';
      if (diff < 60) return Math.round(diff) + ' phút trước';
      if (diff < 1440) return Math.round(diff / 60) + ' giờ trước';
      return Math.round(diff / 1440) + ' ngày trước';
    };

    const iconFor = { reminder:'bell', invoice:'file', payment:'check', ai:'trend', system:'settings' };

    const visible = () => {
      const q = (search.value || '').trim().toLowerCase();
      return D.notifications.filter((n) => {
        const okFilter = filter === 'all' ? true
          : filter === 'unread' ? !n.read
          : filter === 'reminder' ? n.type === 'reminder'
          : n.type === 'ai';
        const okSearch = !q || (n.title + ' ' + n.body).toLowerCase().includes(q);
        return okFilter && okSearch;
      });
    };

    /* Trạng thái đang tải giả lập khi đổi bộ lọc */
    const paintLoading = () => {
      list.innerHTML = Array.from({ length:4 }).map(() =>
        '<div class="notif"><div class="skeleton" style="width:40px;height:40px;border-radius:11px"></div>' +
        '<div class="notif-body"><div class="skeleton skeleton-row" style="width:52%"></div>' +
        '<div class="skeleton skeleton-row" style="width:82%"></div></div></div>').join('');
    };

    const paint = () => {
      const items = visible();
      if (!items.length) {
        list.innerHTML =
          '<li><div class="state"><div class="state-icon">' + IP.ICONS.inbox + '</div>' +
          '<h3>Không có thông báo nào</h3>' +
          '<p>' + (filter === 'unread'
            ? 'Bạn đã đọc hết thông báo. Chuyển sang "Tất cả" để xem lại lịch sử.'
            : 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm khác.') + '</p>' +
          '<button class="btn btn-ghost" type="button" id="clear-filter">Xem tất cả thông báo</button>' +
          '</div></li>';
        const clear = $('#clear-filter');
        if (clear) clear.addEventListener('click', () => {
          filter = 'all'; search.value = '';
          $$('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.filter === 'all')));
          render();
        });
        return;
      }

      list.innerHTML = items.map((n) =>
        '<li class="notif' + (n.read ? '' : ' is-unread') + '">' +
          '<span class="notif-icon t-' + n.type + '">' + IP.ICONS[iconFor[n.type]] + '</span>' +
          '<div class="notif-body">' +
            '<strong>' + IP.esc(n.title) + '</strong>' +
            '<p>' + IP.esc(n.body) + '</p>' +
            '<div class="notif-meta">' +
              '<span>' + timeAgo(n.time) + '</span>' +
              (n.read ? '<span class="pill pill-grey">Đã đọc</span>' : '<span class="pill pill-green">Chưa đọc</span>') +
              '<a href="' + IP.pageHref(n.link) + '">Mở màn hình liên quan</a>' +
            '</div>' +
          '</div>' +
          '<div class="notif-actions">' +
            '<button class="icon-btn" type="button" data-toggle="' + n.id + '" ' +
              'aria-label="' + (n.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc') + '">' + IP.ICONS.check + '</button>' +
            '<button class="icon-btn" type="button" data-remove="' + n.id + '" aria-label="Lưu trữ thông báo">' + IP.ICONS.trash + '</button>' +
          '</div>' +
        '</li>').join('');
    };

    const render = () => { paintLoading(); setTimeout(() => { paint(); paintCounts(); }, 320); };

    /* Bộ lọc tab */
    $$('[role="tab"]').forEach((tab) => {
      tab.addEventListener('click', () => {
        filter = tab.dataset.filter;
        $$('[role="tab"]').forEach((t) => {
          t.setAttribute('aria-selected', String(t === tab));
          t.tabIndex = t === tab ? 0 : -1;
        });
        render();
      });
    });

    search.addEventListener('input', () => { clearTimeout(search._t); search._t = setTimeout(paint, 200); });

    /* Hành động trên từng thông báo */
    list.addEventListener('click', async (e) => {
      const toggle = e.target.closest('[data-toggle]');
      const remove = e.target.closest('[data-remove]');

      if (toggle) {
        const n = D.notifications.find((x) => x.id === toggle.dataset.toggle);
        if (n) n.read = !n.read;
        render();
        IP.toast(n.read ? 'Đã đánh dấu đã đọc' : 'Đã đánh dấu chưa đọc', 'success');
      }

      if (remove) {
        const yes = await IP.confirm({
          title:'Lưu trữ thông báo này?',
          body:'Thông báo sẽ bị ẩn khỏi danh sách. Bạn vẫn có thể xem lại trong lịch sử hệ thống.',
          confirmText:'Lưu trữ', tone:'danger'
        });
        if (!yes) return;
        const idx = D.notifications.findIndex((x) => x.id === remove.dataset.remove);
        if (idx > -1) D.notifications.splice(idx, 1);
        render();
        IP.toast('Đã lưu trữ thông báo', 'success');
      }
    });

    /* Đánh dấu tất cả */
    $('#mark-all').addEventListener('click', async () => {
      if (!unreadCount()) {
        IP.toast('Không có thông báo chưa đọc', 'info');
        return;
      }
      const confirmed = await IP.confirm({
        title:'Đánh dấu tất cả thông báo đã đọc?',
        body:'Tất cả thông báo chưa đọc sẽ chuyển sang trạng thái đã đọc.',
        confirmText:'Đánh dấu đã đọc',
        tone:'primary'
      });
      if (!confirmed) return;
      D.notifications.forEach((n) => { n.read = true; });
      render();
      IP.toast('Đã đánh dấu tất cả là đã đọc', 'success');
    });

    paintCounts();
    paint();
  }

  /* =========================================================
     8) 403.html
     ========================================================= */
  function error403Page() {
    const from = new URLSearchParams(location.search).get('from');
    if (from) $('#requested-page').textContent = from;
    const session = IP.getSession();
    const box = $('#role-note');
    if (box) {
      box.textContent = session
        ? 'Bạn đang đăng nhập với vai trò "' + session.roleLabel + '". Màn hình này thuộc phạm vi của vai trò khác.'
        : 'Bạn chưa đăng nhập. Hãy đăng nhập bằng vai trò phù hợp để tiếp tục.';
    }
    const backBtn = $('#back-btn');
    if (backBtn && history.length > 1) {
      backBtn.addEventListener('click', () => history.back());
    } else if (backBtn) {
      backBtn.hidden = true;
    }
  }

  /* =========================================================
     9) 404.html
     ========================================================= */
  function error404Page() {
    const input = $('#notfound-search');
    const results = $('#notfound-results');

    const paintResults = () => {
      const q = (input.value || '').trim().toLowerCase();
      if (!q) {
        results.innerHTML = '';
        return;
      }
      const hits = D.pages.filter((p) =>
        p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q) || p.href.toLowerCase().includes(q)
      );
      if (!hits.length) {
        results.innerHTML =
          '<li><div class="state"><div class="state-icon">' + IP.ICONS.search + '</div>' +
          '<h3>Không tìm thấy màn hình phù hợp</h3>' +
          '<p>Thử từ khóa "hóa đơn", "công nợ", "nhắc" hoặc "cấu hình".</p></div></li>';
        return;
      }
      results.innerHTML = hits.map((p) =>
        '<li><a href="' + IP.pageHref(p.href) + '">' + IP.ICONS[p.icon] + IP.esc(p.label) +
        '<span class="file">' + IP.esc(p.href) + '</span></a></li>').join('');
    };

    input.addEventListener('input', paintResults);
    $('#notfound-form').addEventListener('submit', (e) => {
      e.preventDefault();
      paintResults();
      const first = results.querySelector('a');
      if (first) first.focus();
    });

    /* Đường dẫn sai gợi ý */
    const path = location.pathname.split('/').pop();
    if (path && path !== '404.html') $('#bad-path').textContent = '/' + path;
  }

  /* ---------- Khởi động ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', IP.boot);
  } else {
    IP.boot();
  }
})();