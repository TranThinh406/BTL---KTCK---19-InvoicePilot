/**
 * invoice-detail.js — Trang "Chi tiết hóa đơn" (vai trò Kinh doanh)
 * Tờ hóa đơn điện tử, tiến độ thu tiền, lịch sử thanh toán và nhật ký thay đổi.
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
  const INVOICE_ID = params.get('id') || 'HD-2026-0731';

  const state = {
    loading: true,
    error: false,
    empty: demoState === 'empty',
    inv: null
  };

  // Số không có ký hiệu tiền tệ — dùng trong bảng kê trên tờ hóa đơn
  function n0(v) { return Number(v).toLocaleString('vi-VN'); }

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
      $('#modal-resend').hidden = opts.mode !== 'resend';
      $('#modal-adjust').hidden = opts.mode !== 'adjust';
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
  // Tờ hóa đơn
  // ------------------------------------------------------------------
  function renderSheet(inv) {
    const s = inv.summary;
    const rows = inv.lines.map((l, i) => `
      <tr>
        <td class="num" data-label="STT"><span class="stt">${String(i + 1).padStart(2, '0')}</span></td>
        <td>
          <p class="item-name">${fmt.esc(l.name)}</p>
          <p class="item-sku">${fmt.esc(l.sku)} · thuế suất ${s.vatRate}%</p>
        </td>
        <td data-label="ĐVT">${fmt.esc(l.unit)}</td>
        <td class="num" data-label="Số lượng">${n0(l.qty)}</td>
        <td class="num" data-label="Đơn giá">${n0(l.price)}</td>
        <td class="num" data-label="Thành tiền"><b>${n0(l.amount)}</b></td>
      </tr>`).join('');

    $('#sheet').innerHTML = `
      <header class="sheet-head">
        <div class="sheet-seller">
          <span class="sheet-mark">SH</span>
          <p class="sheet-org">${fmt.esc(inv.seller.name)}</p>
          <p class="sheet-org-meta">
            MST: ${fmt.esc(inv.seller.taxCode)}<br>
            ${fmt.esc(inv.seller.address)}<br>
            Tài khoản: ${fmt.esc(inv.seller.bank)}
          </p>
        </div>
        <div class="sheet-title">
          <p class="sheet-title-main">Hóa đơn giá trị gia tăng</p>
          <p class="sheet-title-sub">Hóa đơn điện tử · ${fmt.esc(inv.form)}</p>
          <p class="sheet-no mono">Số: <b>${fmt.esc(inv.no)}</b></p>
          <p class="sheet-code mono">Ký hiệu: ${fmt.esc(inv.series)}</p>
        </div>
      </header>

      <div class="sheet-parties">
        <div>
          <p class="party-label">Đơn vị bán hàng</p>
          <p class="party-name">${fmt.esc(inv.seller.name)}</p>
          <p class="party-meta">
            MST ${fmt.esc(inv.seller.taxCode)}<br>
            ${fmt.esc(inv.seller.address)}
          </p>
        </div>
        <div>
          <p class="party-label">Đơn vị mua hàng</p>
          <p class="party-name">${fmt.esc(inv.buyer.name)}</p>
          <p class="party-meta">
            MST ${fmt.esc(inv.buyer.taxCode)}<br>
            ${fmt.esc(inv.buyer.address)}<br>
            Liên hệ: ${fmt.esc(inv.buyer.contact)} · ${fmt.esc(inv.buyer.email)}
          </p>
        </div>
      </div>

      <table class="sheet-table">
        <thead>
          <tr>
            <th class="num" style="width:44px">TT</th>
            <th>Tên hàng hóa, dịch vụ</th>
            <th style="width:92px">ĐVT</th>
            <th class="num" style="width:88px">Số lượng</th>
            <th class="num" style="width:104px">Đơn giá</th>
            <th class="num" style="width:118px">Thành tiền</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="sheet-sum">
        <div class="sum-box">
          <div class="sum-row"><span>Tổng tiền hàng (chưa thuế)</span><span class="num">${n0(s.gross)}</span></div>
          <div class="sum-row is-minus"><span>${fmt.esc(s.discountLabel)}</span><span class="num">−${n0(s.discount)}</span></div>
          <div class="sum-row"><span>Tổng tiền thanh toán chưa thuế</span><span class="num">${n0(s.net)}</span></div>
          <div class="sum-row"><span>Thuế GTGT (${s.vatRate}%)</span><span class="num">${n0(s.vat)}</span></div>
          <div class="sum-row is-total"><span>Tổng cộng tiền thanh toán</span><span class="num">${n0(s.total)} ₫</span></div>
        </div>
      </div>

      <div class="words">
        <p class="words-label">Số tiền viết bằng chữ</p>
        <p class="words-text">${fmt.esc(s.words)}</p>
      </div>

      <div class="sign-grid">
        <div class="sign-box">
          <p class="sign-title">Người mua hàng</p>
          <div class="sign-space"><p class="sign-note">Ký, ghi rõ họ tên<br>(Đã xác nhận qua email 14/06/2026)</p></div>
          <p class="sign-note">${fmt.esc(inv.buyer.name)}</p>
        </div>
        <div class="sign-box">
          <p class="sign-title">Người bán hàng</p>
          <div class="sign-space"><span class="sign-seal">ĐÃ KÝ SỐ<br>12/06/2026</span></div>
          <p class="sign-note">Ký số bởi ${fmt.esc(inv.seller.name)}</p>
        </div>
      </div>

      <footer class="sheet-foot">
        <p>
          Đơn hàng: ${fmt.esc(inv.order.code)} · Hợp đồng: ${fmt.esc(inv.contract)}<br>
          Kho xuất: ${fmt.esc(inv.warehouse)} · Điều kiện thanh toán: ${fmt.esc(inv.paymentTerm)}
        </p>
        <p style="text-align:right">
          Người lập: ${fmt.esc(inv.createdBy)}<br>
          Ngày phát hành: ${fmt.esc(inv.issuedAt)} · hạn thanh toán: ${fmt.esc(inv.dueAt)}
        </p>
      </footer>`;
  }

  // ------------------------------------------------------------------
  // Rail
  // ------------------------------------------------------------------
  function renderRail(inv) {
    $('#r-code').textContent = inv.code + ' · ' + inv.series + '/' + inv.no;
    $('#r-type').textContent = inv.type;
    $('#r-issued').textContent = inv.issuedAt;
    $('#r-due').textContent = inv.dueAt + ' · ' + inv.daysLate + ' ngày';
    $('#r-order').textContent = inv.order.code;
    $('#r-order').href = 'sales-order-detail.html?id=' + inv.order.code;
    $('#r-contract').textContent = inv.contract;
    $('#r-warehouse').textContent = inv.warehouse;
    $('#r-term').textContent = inv.paymentTerm;
    $('#r-owner').textContent = inv.createdBy;
    $('#r-sent').textContent = inv.sentCount + ' lần · ' +
      (inv.customerConfirmed ? 'khách đã xác nhận' : 'chưa xác nhận');

    const s = inv.summary;
    const pct = s.total ? Math.round((s.paid / s.total) * 100) : 0;
    $('#pay-pct').textContent = pct + '%';
    $('#pay-desc').textContent = fmt.vnd(s.paid) + ' / ' + fmt.vnd(s.total);
    $('#pay-fill').style.width = pct + '%';
    $('#pay-paid').textContent = fmt.vnd(s.paid);
    $('#pay-remaining').textContent = fmt.vnd(s.remaining);
    $('#pay-total').textContent = fmt.vnd(s.total);

    // Thang tuổi nợ
    const max = Math.max.apply(null, inv.aging.map(a => a.amount).concat([1]));
    $$('#age-scale .age-bar').forEach((bar, i) => {
      const bucket = inv.aging[i];
      const h = bucket.amount > 0 ? Math.max(8, Math.round((bucket.amount / max) * 62)) : 4;
      bar.style.height = h + 'px';
      bar.classList.toggle('has-value', bucket.amount > 0 && !bar.classList.contains('is-hot'));
      if (bucket.amount > 0) bar.classList.add('is-active');
    });
    const hot = inv.aging.find(a => a.amount > 0 && a.label.indexOf('90') > -1);
    $('#age-note').textContent = hot
      ? 'Toàn bộ ' + fmt.vnd(hot.amount) + ' còn nợ nằm ở nhóm ' + hot.label.toLowerCase() + '.'
      : 'Không có khoản nợ nào vượt 30 ngày.';
  }

  // ------------------------------------------------------------------
  // Bảng thanh toán & nhật ký
  // ------------------------------------------------------------------
  function renderPayments(inv) {
    if (!inv.payments.length) {
      $('#pay-records').innerHTML =
        '<tr><td colspan="5" class="pay-none">Chưa ghi nhận khoản thanh toán nào cho hóa đơn này.</td></tr>';
      return;
    }
    $('#pay-records').innerHTML = inv.payments.map(p => `
      <tr>
        <td class="num" data-label="Ngày">${fmt.esc(p.date)}</td>
        <td>
          <p class="pay-content">${fmt.esc(p.content)}</p>
          <p class="pay-meta">Mã GD ${fmt.esc(p.ref)}</p>
        </td>
        <td>
          <p>${fmt.esc(p.method)}</p>
          <p class="pay-meta">${fmt.esc(p.bank)}</p>
        </td>
        <td class="num is-ok" data-label="Số tiền">+${n0(p.amount)}</td>
        <td class="num" data-label="Còn lại">${n0(p.remaining)}</td>
      </tr>`).join('');
  }

  function renderTrace(inv) {
    $('#trace').innerHTML = inv.timeline.map(t => `
      <div class="trace-item tone-${t.tone || 'info'}">
        <span class="trace-dot"></span>
        <p class="trace-time">${fmt.esc(t.time)}</p>
        <div class="trace-head">
          <span class="trace-action">${fmt.esc(t.action)}</span>
          <span class="trace-actor">bởi ${fmt.esc(t.actor)}</span>
        </div>
        ${t.note ? '<p class="trace-note">"' + fmt.esc(t.note) + '"</p>' : ''}
      </div>`).join('') || '<p class="trace-empty">Chưa có thay đổi nào.</p>';
  }

  // ------------------------------------------------------------------
  // Xung đột dữ liệu
  // ------------------------------------------------------------------
  function handleConflict(err) {
    if (err && err.code === 'CONFLICT') {
      if (state.inv) state.inv.stale = true;
      $('#conflict-text').innerHTML = '<strong>' + fmt.esc(err.message) +
        '</strong> Thao tác của bạn bị hủy để tránh gửi nhầm số liệu. Hãy tải lại bản mới nhất.';
      $('#conflict-band').hidden = false;
      $('#conflict-band').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    toast('Không hoàn tất được thao tác', (err && err.message) || 'Vui lòng thử lại.', 'error');
  }

  // ------------------------------------------------------------------
  // Hành động
  // ------------------------------------------------------------------
  async function resend() {
    const inv = state.inv;
    const res = await openModal({
      title: 'Gửi lại hóa đơn',
      html: 'Hệ thống gửi kèm tệp PDF của hóa đơn <strong>' + fmt.esc(inv.code) +
        '</strong> và bảng kê chi tiết.',
      okText: 'Gửi hóa đơn',
      mode: 'resend',
      validate: () => {
        const v = $('#m-email').value.trim();
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        $('#resend-error').hidden = ok;
        $('#m-email').classList.toggle('is-invalid', !ok);
        return ok;
      },
      collect: () => ({ email: $('#m-email').value.trim(), message: $('#m-message').value.trim() })
    });
    if (!res) return;

    try {
      state.inv = api.invoices
        ? await api.invoices.send(inv.code, res)
        : fakeMutate('Gửi lại hóa đơn', 'ok',
          'Gửi tới ' + res.email + '. ' + (res.message || ''));
      render();
      toast('Đã gửi lại hóa đơn', inv.code + ' tới ' + res.email + '.');
    } catch (err) { handleConflict(err); }
  }

  async function requestAdjust() {
    const inv = state.inv;
    const res = await openModal({
      title: 'Yêu cầu điều chỉnh hóa đơn',
      html: 'Hóa đơn gốc <strong>' + fmt.esc(inv.code) + '</strong> (giá trị ' +
        fmt.vnd(inv.summary.total) + ') sẽ được giữ nguyên. Kế toán lập hóa đơn điều chỉnh sau khi duyệt.',
      okText: 'Gửi yêu cầu',
      mode: 'adjust',
      validate: () => {
        const raw = parseInt($('#m-adj-amount').value.replace(/\D/g, ''), 10) || 0;
        const ok = raw > 0 && raw <= inv.summary.total && $('#m-adj-reason').value.trim().length > 4;
        $('#adj-error').hidden = ok;
        $('#m-adj-amount').classList.toggle('is-invalid', !ok);
        return ok;
      },
      collect: () => ({
        amount: parseInt($('#m-adj-amount').value.replace(/\D/g, ''), 10),
        reason: $('#m-adj-reason').value.trim()
      })
    });
    if (!res) return;

    try {
      state.inv = api.invoices
        ? await api.invoices.requestAdjust(inv.code, res)
        : fakeMutate('Tạo yêu cầu điều chỉnh hóa đơn', 'warn',
          'Điều chỉnh ' + fmt.vnd(res.amount) + ' · lý do: ' + res.reason + ' · chờ Kế toán duyệt.');
      render();
      toast('Đã gửi yêu cầu điều chỉnh', 'Kế toán sẽ phản hồi trong vòng 1 ngày làm việc.', 'warn');
    } catch (err) { handleConflict(err); }
  }

  function fakeMutate(action, tone, note) {
    return new Promise((resolve, reject) => setTimeout(() => {
      if (state.inv.stale) return reject({
        code: 'CONFLICT',
        message: 'Hóa đơn ' + state.inv.code + ' vừa được Kế toán cập nhật lúc 14:05.'
      });
      const clone = JSON.parse(JSON.stringify(state.inv));
      clone.sentCount += action === 'Gửi lại hóa đơn' ? 1 : 0;
      clone.timeline.unshift({ time: nowText(), actor: 'Phạm Thu Hà', action: action, tone: tone, note: note });
      resolve(clone);
    }, 700));
  }

  // ------------------------------------------------------------------
  // Render & sự kiện
  // ------------------------------------------------------------------
  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;
    if (state.loading || state.error || state.empty || !state.inv) return;

    renderSheet(state.inv);
    renderRail(state.inv);
    renderPayments(state.inv);
    renderTrace(state.inv);

    // Khóa thao tác khi không có quyền
    const blocked = state.inv.editable === false && false; // xem được, không sửa trực tiếp
    $('#btn-adjust').disabled = blocked;
  }

  function bind() {
    $('#btn-resend').addEventListener('click', resend);
    $('#btn-adjust').addEventListener('click', requestAdjust);
    $('#btn-pdf').addEventListener('click', () => {
      toast('Đang tạo tệp PDF', 'Hóa đơn HD-2026-0731 sẽ được tải xuống trong ít giây.', 'warn');
    });
    $('#btn-remind').addEventListener('click', () => {
      location.href = 'sales-payment-reminders.html?cus=' + (state.inv ? state.inv.buyer.code : '');
    });
    $('#btn-retry').addEventListener('click', load);
    $('#btn-empty-back').addEventListener('click', () => {
      location.href = 'sales-invoice-list.html';
    });
    $('#conflict-reload').addEventListener('click', () => {
      $('#conflict-band').hidden = true;
      load();
      toast('Đã tải bản mới nhất', 'Hãy kiểm tra lại trước khi thao tác.');
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
      state.inv = api.invoices
        ? await api.invoices.getDetail(INVOICE_ID)
        : JSON.parse(JSON.stringify(window.MOCK.invoiceDetail[INVOICE_ID]));
    } catch (e) {
      if (e && e.code === 'NOT_FOUND') {
        state.empty = true;
      } else {
        state.error = true;
      }
    } finally {
      state.loading = false;
      if (demoState === 'error') state.error = true;
      if (demoState === 'conflict' && state.inv) {
        state.inv.stale = true;
        $('#conflict-text').innerHTML =
          '<strong>Hóa đơn HD-2026-0731 vừa được Kế toán cập nhật lúc 14:05.</strong> ' +
          'Số liệu hiển thị có thể đã cũ; thao tác sẽ bị chặn cho tới khi bạn tải lại.';
        $('#conflict-band').hidden = false;
      }
      render();
    }
  }

  (function init() {
    bind();
    load();
  })();
})();