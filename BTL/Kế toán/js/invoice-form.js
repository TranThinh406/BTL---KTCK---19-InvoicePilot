/**
 * invoice-form.js — Trang "Tạo / Sửa hóa đơn"
 * - Nguồn dữ liệu: window.api
 * - AI-1 chỉ đưa gợi ý; mọi áp dụng đều phải có xác nhận người dùng
 */
(function () {
  'use strict';

  if (!window.api || !window.fmt || !window.MOCK) {
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('items-body').innerHTML =
        '<tr><td colspan="7"><div class="ai-idle">Chưa nạp tệp dữ liệu mẫu (mock-data.js, utils.js, api.js).</div></td></tr>';
    });
    return;
  }

  const api = window.api;
  const fmt = window.fmt;
  const TODAY = window.MOCK.TODAY;

  // ------------------------------------------------------------------
  // 0. Helpers
  // ------------------------------------------------------------------
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  function addDays(iso, n) {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function parseNum(str) {
    const n = parseFloat(String(str == null ? '' : str).replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  function debounce(fn, ms) {
    let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms); };
  }

  // ------------------------------------------------------------------
  // 1. Đọc số thành chữ tiếng Việt
  // ------------------------------------------------------------------
  function soThanhChu(number) {
    const n = Math.round(Math.abs(number));
    if (n === 0) return 'Không đồng chẵn';

    const cs = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const donvi = ['', 'nghìn', 'triệu', 'tỷ'];

    function doc3(num, full) {
      const tr = Math.floor(num / 100);
      const ch = Math.floor((num % 100) / 10);
      const dv = num % 10;
      let s = '';
      if (tr > 0 || full) {
        s += cs[tr] + ' trăm';
        if (ch === 0 && dv > 0) s += ' lẻ';
      }
      if (ch > 1) {
        s += ' ' + cs[ch] + ' mươi';
        if (dv === 1) s += ' mốt';
        else if (dv === 5) s += ' lăm';
        else if (dv > 0) s += ' ' + cs[dv];
      } else if (ch === 1) {
        s += ' mười';
        if (dv === 5) s += ' lăm';
        else if (dv > 0) s += ' ' + cs[dv];
      } else if (dv > 0) {
        s += ' ' + cs[dv];
      }
      return s.trim();
    }

    const groups = [];
    let rest = n;
    while (rest > 0) { groups.unshift(rest % 1000); rest = Math.floor(rest / 1000); }

    let out = '';
    groups.forEach((g, i) => {
      if (g === 0) return;
      const unit = donvi[groups.length - 1 - i];
      out += ' ' + doc3(g, i > 0) + (unit ? ' ' + unit : '');
    });

    out = out.replace(/\s+/g, ' ').trim();
    return out.charAt(0).toUpperCase() + out.slice(1) + ' đồng chẵn';
  }

  // ------------------------------------------------------------------
  // 2. Trạng thái form
  // ------------------------------------------------------------------
  let uid = 0;
  const newItem = () => ({ key: 'it' + (++uid), name: '', unit: 'lần', qty: 1, price: 0, vat: 10 });

  const state = {
    mode: 'create',
    code: '',
    customerId: '',
    items: [newItem()],
    discountRate: 0,
    dirty: false,
    saving: false,
    customers: [],
    aiFindings: [],
    aiCounter: 0
  };

  // Danh mục — đọc từ mock nếu có, ngược lại dùng mặc định
  const CATALOG = (window.MOCK && MOCK.PRODUCTS) || [
    { id: 'p1', name: 'Dịch vụ kế toán tháng', unit: 'tháng', price: 3500000, vat: 10 },
    { id: 'p2', name: 'Phần mềm InvoicePilot', unit: 'gói', price: 12000000, vat: 10 },
    { id: 'p3', name: 'Tư vấn thuế', unit: 'lần', price: 2500000, vat: 10 },
    { id: 'p4', name: 'Đào tạo nội bộ', unit: 'buổi', price: 4800000, vat: 10 },
    { id: 'p5', name: 'Quản trị nhân sự', unit: 'tháng', price: 6000000, vat: 10 },
    { id: 'p6', name: 'Phần mềm quản lý công nợ', unit: 'gói', price: 18000000, vat: 10 },
    { id: 'p7', name: 'Đào tạo phần mềm', unit: 'buổi', price: 3200000, vat: 10 },
    { id: 'p8', name: 'Dịch vụ lưu trữ dữ liệu', unit: 'tháng', price: 2100000, vat: 10 }
  ];

  // ------------------------------------------------------------------
  // 3. Toast + Modal
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
    }, 3600);
  }

  function confirmDialog(opts) {
    return new Promise(resolve => {
      const modal = $('#modal');
      $('#modal-title').textContent = opts.title || 'Xác nhận';
      $('#modal-desc').innerHTML = opts.html || fmt.esc(opts.message || 'Bạn có chắc muốn tiếp tục với thao tác này?');
      $('#modal-ok').textContent = opts.okText || 'Xác nhận';
      $('#modal-cancel').textContent = opts.cancelText || 'Hủy bỏ';
      modal.hidden = false;

      function done(v) {
        modal.hidden = true;
        $('#modal-ok').removeEventListener('click', onOk);
        $('#modal-cancel').removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdrop);
        resolve(v);
      }
      function onOk() { done(true); }
      function onCancel() { done(false); }
      function onBackdrop(e) { if (e.target === modal) done(false); }

      $('#modal-ok').addEventListener('click', onOk);
      $('#modal-cancel').addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);
      $('#modal-ok').focus();
    });
  }

  // ------------------------------------------------------------------
  // 4. Bảng dòng hàng
  // ------------------------------------------------------------------
  const itemsBody = $('#items-body');

  function renderItems() {
    itemsBody.innerHTML = state.items.map((it, i) => `
      <tr data-key="${it.key}">
        <td class="i-name">
          <input class="input" list="product-list" data-field="name"
                 value="${fmt.esc(it.name)}" placeholder="Tên hàng hóa / dịch vụ" aria-label="Tên hàng hóa dòng ${i + 1}">
        </td>
        <td class="i-unit">
          <input class="input input--sm" data-field="unit" value="${fmt.esc(it.unit)}" aria-label="Đơn vị tính dòng ${i + 1}">
        </td>
        <td class="i-num">
          <input class="input input--sm input--num" type="number" min="0" step="1"
                 data-field="qty" value="${it.qty}" aria-label="Số lượng dòng ${i + 1}">
        </td>
        <td class="i-num">
          <input class="input input--sm input--num" data-field="price"
                 value="${fmt.vnd(it.price, false)}" aria-label="Đơn giá dòng ${i + 1}">
        </td>
        <td class="i-vat">
          <select class="input input--sm" data-field="vat" aria-label="Thuế suất dòng ${i + 1}">
            ${[10, 8, 5, 0].map(v => `<option value="${v}"${it.vat == v ? ' selected' : ''}>${v}%</option>`).join('')}
          </select>
        </td>
        <td class="i-num"><span class="cell-total" data-role="linetotal">0 ₫</span></td>
        <td class="i-del">
          <button class="row-del" type="button" data-del="${it.key}" aria-label="Xóa dòng ${i + 1}">
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </td>
      </tr>`).join('');
    updateTotals();
  }

  // ------------------------------------------------------------------
  // 5. Tính toán & tổng kết
  // ------------------------------------------------------------------
  function updateTotals() {
    const discount = parseNum($('#f-discount').value);
    const factor = 1 - discount / 100;

    let subtotal = 0, vatTotal = 0;
    state.items.forEach(it => {
      const line = it.qty * it.price;
      subtotal += line;
      vatTotal += line * factor * (it.vat / 100);
    });

    const discountAmount = subtotal * discount / 100;
    const afterDiscount = subtotal - discountAmount;
    const grand = afterDiscount + vatTotal;

    // Cập nhật từng dòng
    $$('#items-body tr').forEach((tr, i) => {
      const it = state.items[i];
      if (!it) return;
      const line = it.qty * it.price * factor;
      const cell = tr.querySelector('[data-role="linetotal"]');
      if (cell) cell.textContent = fmt.vnd(line);
    });

    $('#items-subtotal').textContent = fmt.vnd(subtotal);
    $('#sum-subtotal').textContent = fmt.vnd(subtotal);
    $('#sum-discount').textContent = '−' + fmt.vnd(discountAmount);
    $('#sum-discount-rate').textContent = '(' + discount + '%)';
    $('#sum-vat').textContent = fmt.vnd(vatTotal);
    $('#sum-total').textContent = fmt.vnd(grand);
    $('#sum-words').textContent = soThanhChu(grand);

    updateProgress();
  }

  function updateProgress() {
    const checks = [
      { label: 'Khách hàng', ok: !!$('#f-customer').value },
      { label: 'Ngày phát hành & hạn thanh toán', ok: !!$('#f-issue-date').value && !!$('#f-due-date').value },
      { label: 'Ít nhất một dòng hàng hợp lệ', ok: state.items.some(i => i.name.trim() && i.qty > 0 && i.price > 0) },
      { label: 'Điều khoản thanh toán', ok: !!$('#f-terms').value }
    ];
    const done = checks.filter(c => c.ok).length;
    const pct = Math.round(done / checks.length * 100);

    $('#progress-value').textContent = pct + '%';
    $('#progress-fill').style.width = pct + '%';
    $('#progress-list').innerHTML = checks.map(c => `
      <li class="${c.ok ? 'is-done' : ''}">
        <span class="tick"><svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        ${fmt.esc(c.label)}
      </li>`).join('');
  }

  // ------------------------------------------------------------------
  // 6. Validate
  // ------------------------------------------------------------------
  function clearErrors() {
    $$('.input.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    $$('[data-error-for]').forEach(el => { el.hidden = true; el.textContent = ''; });
    $('#form-alert').hidden = true;
  }

  function setError(fieldId, message) {
    const input = $('#' + fieldId);
    const box = $('[data-error-for="' + fieldId + '"]');
    if (input) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
    if (box) { box.textContent = message; box.hidden = false; }
  }

  function validate(strict) {
    clearErrors();
    const errors = [];

    const code = $('#f-code').value.trim();
    if (!code) {
      errors.push({ id: 'f-code', msg: 'Số hóa đơn không được để trống.' });
    } else if (!/^INV-\d{4}-\d{3,4}$/.test(code)) {
      errors.push({ id: 'f-code', msg: 'Sai định dạng. Dùng mẫu INV-YYYY-NNN (VD: INV-2026-0201).' });
    }

    if (!$('#f-issue-date').value) {
      errors.push({ id: 'f-issue-date', msg: 'Vui lòng chọn ngày phát hành.' });
    }
    const due = $('#f-due-date').value;
    const issue = $('#f-issue-date').value;
    if (!due) {
      errors.push({ id: 'f-due-date', msg: 'Vui lòng chọn hạn thanh toán.' });
    } else if (issue && due < issue) {
      errors.push({ id: 'f-due-date', msg: 'Hạn thanh toán phải sau hoặc bằng ngày phát hành.' });
    }

    if (strict && !$('#f-customer').value) {
      errors.push({ id: 'f-customer', msg: 'Phải chọn khách hàng trước khi phát hành.' });
    }

    if (strict) {
      const valid = state.items.filter(i => i.name.trim() && i.qty > 0 && i.price > 0);
      if (valid.length === 0) {
        errors.push({ id: null, msg: 'Hóa đơn cần ít nhất một dòng hàng có tên, số lượng và đơn giá.' });
      }
      state.items.forEach((it, i) => {
        if (it.name.trim() && it.qty <= 0) {
          errors.push({ id: null, msg: 'Dòng ' + (i + 1) + ': số lượng phải lớn hơn 0.' });
        }
      });
    }

    errors.forEach(e => e.id && setError(e.id, e.msg));

    if (errors.length) {
      const band = $('#form-alert');
      $('#alert-list').innerHTML = errors.map(e =>
        '<li>' + fmt.esc(e.msg) + (e.id ? ' <button type="button" data-goto-field="' + e.id + '">Đi tới trường</button>' : '') + '</li>'
      ).join('');
      band.hidden = false;
      band.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const first = errors.find(e => e.id);
      if (first) setTimeout(() => $('#' + first.id).focus(), 260);
    }
    return errors.length === 0;
  }

  // ------------------------------------------------------------------
  // 7. AI-1 · Kiểm tra bất thường
  // ------------------------------------------------------------------
  function buildFindings() {
    const findings = [];
    const customerId = $('#f-customer').value;
    const cust = state.customers.find(c => c.id === customerId);

    // (a) Đơn giá lệch so với giá chuẩn trong danh mục
    state.items.forEach((it, idx) => {
      const std = CATALOG.find(p => p.name === it.name.trim());
      if (!std || !it.price) return;
      const dev = Math.abs(it.price - std.price) / std.price;
      if (dev > 0.15) {
        findings.push({
          level: it.price > std.price ? 'danger' : 'warn',
          title: 'Đơn giá dòng ' + (idx + 1) + ' lệch ' + Math.round(dev * 100) + '% so với giá chuẩn',
          desc: 'Mặt hàng <span class="mono">' + fmt.esc(it.name) + '</span> đang nhập <span class="mono">' +
            fmt.vnd(it.price) + '</span>, giá chuẩn trong 3 hóa đơn gần nhất là <span class="mono">' +
            fmt.vnd(std.price) + '</span>.',
          why: [
            'So khớp tên hàng hóa với lịch sử hóa đơn của ' + (cust ? cust.name : 'khách hàng') + ' trong 90 ngày.',
            'Đơn giá hiện tại nằm ngoài khoảng ±15% quanh giá trị trung vị.',
            'Có thể do nhập sai, điều chỉnh giá mới chưa cập nhật danh mục, hoặc chương trình khuyến mãi.'
          ],
          acceptText: 'Đặt lại ' + fmt.vnd(std.price),
          apply: () => {
            state.items[idx].price = std.price;
            renderItems();
            markDirty();
            toast('Đã áp dụng đề xuất', 'Đơn giá dòng ' + (idx + 1) + ' được cập nhật về giá chuẩn.');
          }
        });
      }
    });

    // (b) Hạn thanh toán vượt điều khoản
    const issue = $('#f-issue-date').value, due = $('#f-due-date').value;
    if (issue && due) {
      const days = Math.round((new Date(due) - new Date(issue)) / 86400000);
      const terms = parseInt($('#f-terms').value, 10);
      if (days > terms) {
        findings.push({
          level: 'warn',
          title: 'Hạn thanh toán dài hơn điều khoản ' + (days - terms) + ' ngày',
          desc: 'Điều khoản ghi <span class="mono">' + terms + ' ngày</span> nhưng hạn thanh toán đang là <span class="mono">' + days + ' ngày</span>.',
          why: [
            'Đối chiếu "Điều khoản thanh toán" với khoảng cách ngày phát hành → hạn thanh toán.',
            'Chênh lệch này kéo dài DSO và làm tăng công nợ quá hạn theo thống kê công nợ.',
            'Có thể chấp nhận được nếu đây là khách hàng đặc biệt — khi đó chỉ cần ghi chú nội bộ.'
          ],
          acceptText: 'Đưa về ' + terms + ' ngày',
          apply: () => {
            $('#f-due-date').value = addDays(issue, terms);
            markDirty(); updateTotals();
            toast('Đã áp dụng đề xuất', 'Hạn thanh toán được đưa về đúng điều khoản.');
          }
        });
      }
    }

    // (c) Tổng tiền vượt hạn mức tín dụng
    const total = parseNum($('#sum-total').textContent.replace(/[^\d]/g, ''));
    if (cust && total > cust.creditLimit) {
      findings.push({
        level: 'danger',
        title: 'Tổng hóa đơn vượt hạn mức tín dụng',
        desc: 'Hóa đơn <span class="mono">' + fmt.vnd(total) + '</span> trong khi hạn mức của <strong>' +
          fmt.esc(cust.name) + '</strong> là <span class="mono">' + fmt.vnd(cust.creditLimit) + '</span>.',
        why: [
          'So sánh tổng giá trị hóa đơn với trường "Hạn mức tín dụng" của khách hàng.',
          'Công nợ hiện tại của khách: ' + fmt.vnd(cust.debt) + '.',
          'Nếu vượt hạn mức, quy trình xử lý nợ yêu cầu xác nhận của quản lý trước khi phát hành.'
        ],
        acceptText: 'Gửi yêu cầu phê duyệt',
        apply: () => {
          toast('Đã gửi yêu cầu phê duyệt', 'Quản lý sẽ nhận thông báo và phản hồi trong 24 giờ.', 'warn');
        }
      });
    }

    // (d) Ngày phát hành trong tương lai
    if (issue && issue > TODAY) {
      findings.push({
        level: 'info',
        title: 'Ngày phát hành nằm trong tương lai',
        desc: 'Ngày phát hành <span class="mono">' + fmt.date(issue) + '</span> muộn hơn hôm nay <span class="mono">' + fmt.date(TODAY) + '</span>.',
        why: [
          'So sánh ngày phát hành với ngày hệ thống.',
          'Hóa đơn tương lai thường dùng cho hợp đồng định kỳ — hợp lệ nếu có chủ đích.',
          'Nếu chỉ là nhập nhầm, nên sửa lại về hôm nay để báo cáo công nợ không bị lệch.'
        ],
        acceptText: 'Đặt về hôm nay',
        apply: () => {
          $('#f-issue-date').value = TODAY;
          $('#f-due-date').value = addDays(TODAY, parseInt($('#f-terms').value, 10));
          markDirty(); updateTotals();
          toast('Đã áp dụng đề xuất', 'Ngày phát hành được đặt về hôm nay.');
        }
      });
    }

    // (e) Trùng hóa đơn
    const dup = (state.items.length === 1 && total > 10000000 && customerId);
    if (dup) {
      findings.push({
        level: 'warn',
        title: 'Có thể trùng với hóa đơn INV-2026-0188',
        desc: 'Cùng khách hàng, cùng tổng tiền <span class="mono">' + fmt.vnd(total) + '</span>, phát hành cách đây 4 ngày.',
        why: [
          'Khóa so khớp: [customerId] + [tổng tiền ±0,5%] + [ngày phát hành trong 7 ngày].',
          'Tỷ lệ trùng lặp trong lịch sử dữ liệu của doanh nghiệp: 2,1% số hóa đơn.',
          'Hãy kiểm tra thủ công trước khi phát hành — hệ thống không tự hủy hóa đơn.'
        ],
        acceptText: 'Mở hóa đơn INV-2026-0188',
        apply: () => {
          window.location.href = 'accountant-invoice-form.html?code=INV-2026-0188';
        }
      });
    }

    return findings;
  }

  function renderFindings() {
    const box = $('#ai-findings');
    if (!state.aiFindings.length) {
      box.innerHTML = `
        <div class="ai-idle" style="border-style:solid;border-color:var(--green-2);background:var(--green-soft)">
          <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <p><strong>Không phát hiện bất thường.</strong> Hóa đơn này khớp với lịch sử giao dịch của khách hàng.</p>
        </div>`;
      return;
    }

    box.innerHTML = state.aiFindings.map((f, i) => `
      <article class="finding finding--${f.level === 'danger' ? 'danger' : f.level === 'info' ? 'info' : 'warn'}" data-f="${i}">
        <div class="finding-head">
          <span class="finding-ico">
            <svg viewBox="0 0 24 24" fill="none">
              ${f.level === 'info'
                ? '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="8" r="1" fill="currentColor"/>'
                : '<path d="M12 4 2.8 20h18.4L12 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v4m0 3h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'}
            </svg>
          </span>
          <div class="finding-body">
            <h3 class="finding-title">${f.title}</h3>
            <p class="finding-desc">${f.desc}</p>
            <div class="finding-why">
              <button class="why-toggle" type="button" aria-expanded="false" data-why="${i}">
                <svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Tại sao AI đưa ra đề xuất này?
              </button>
              <div class="why-body" hidden>
                <ol>${f.why.map(w => '<li>' + w + '</li>').join('')}</ol>
              </div>
            </div>
          </div>
        </div>
        <div class="finding-foot">
          <button class="btn btn--primary btn--sm" type="button" data-accept="${i}">${f.acceptText}</button>
          <button class="btn btn--ghost btn--sm" type="button" data-dismiss="${i}">Bỏ qua</button>
          <span class="spacer"></span>
          <span class="finding-log mono">AI-1 · #lg-0${++state.aiCounter}</span>
        </div>
      </article>`).join('');

    $('#ai-log').hidden = false;
    $('#ai-log').textContent =
      'AI-1 đã rà ' + state.items.length + ' dòng hàng · ' + state.aiFindings.length + ' phát hiện · mỗi thao tác đều ghi nhật ký #lg-0' + state.aiCounter;
  }

  async function runAiCheck() {
    const box = $('#ai-findings');
    box.innerHTML = '<div class="ai-loading"><span class="spinner"></span> AI-1 đang đối chiếu lịch sử hóa đơn…</div>';
    await new Promise(r => setTimeout(r, 750));
    state.aiFindings = buildFindings();
    renderFindings();
    toast('Kiểm tra hoàn tất', state.aiFindings.length
      ? state.aiFindings.length + ' phát hiện cần bạn xem xét.'
      : 'Không phát hiện bất thường.');
  }

  // ------------------------------------------------------------------
  // 8. Lưu hóa đơn
  // ------------------------------------------------------------------
  function collectPayload() {
    const cust = state.customers.find(c => c.id === $('#f-customer').value) || {};
    const subtotal = state.items.reduce((s, i) => s + i.qty * i.price, 0);
    const discount = parseNum($('#f-discount').value);
    const factor = 1 - discount / 100;
    const vat = state.items.reduce((s, i) => s + i.qty * i.price * factor * (i.vat / 100), 0);

    return {
      code: $('#f-code').value.trim(),
      customerId: $('#f-customer').value,
      customerName: cust.name || '',
      issueDate: $('#f-issue-date').value,
      dueDate: $('#f-due-date').value,
      description: state.items.map(i => i.name).filter(Boolean).join(', '),
      items: state.items.map(i => ({
        name: i.name, unit: i.unit, qty: i.qty, price: i.price,
        vatRate: i.vat, amount: i.qty * i.price
      })),
      subtotal: subtotal,
      discountRate: discount,
      taxAmount: Math.round(vat),
      total: Math.round(subtotal * factor + vat),
      note: $('#f-note-customer').value,
      status: 'draft'
    };
  }

  async function save(asDraft) {
    if (state.saving) return;
    const strict = !asDraft;

    if (!validate(strict)) {
      toast('Chưa thể lưu', 'Vui lòng kiểm tra các trường được đánh dấu.', 'error');
      return;
    }

    state.saving = true;
    const btns = [$('#btn-draft'), $('#btn-issue'), $('#btn-issue-2')];
    btns.forEach(b => { if (b) b.disabled = true; });
    const note = $('#autosave-note');
    note.textContent = 'Đang lưu…';
    note.className = 'autosave is-dirty';

    const payload = collectPayload();
    payload.status = asDraft ? 'draft' : 'issued';

    try {
      const saved = (api.invoices.create && !state.code)
        ? await api.invoices.create(payload)
        : (api.invoices.update && state.code)
          ? await api.invoices.update(state.code, payload)
          : await new Promise(r => setTimeout(() => r(payload), 700)); // fallback demo

      state.dirty = false;
      note.textContent = asDraft ? 'Đã lưu nháp' : 'Đã phát hành';
      note.className = 'autosave is-saved';
      $('#summary-updated').textContent = 'Cập nhật lần cuối ' + new Date().toLocaleTimeString('vi-VN');

      if (asDraft) {
        toast('Đã lưu nháp', 'Hóa đơn ' + (saved.code || payload.code) + ' được lưu lúc ' +
          new Date().toLocaleTimeString('vi-VN') + '.');
      } else {
        $('#mode-stamp').className = 'stamp stamp--success';
        $('#mode-stamp').textContent = 'Đã phát hành';
        toast('Phát hành thành công', 'Hóa đơn ' + (saved.code || payload.code) + ' đã được ghi nhận công nợ.');
        setTimeout(() => { window.location.href = 'accountant-invoice-list.html'; }, 1200);
      }
    } catch (err) {
      toast('Lưu thất bại', (err && err.message) || 'Không kết nối được máy chủ.', 'error');
      note.textContent = 'Lưu thất bại';
      note.className = 'autosave is-dirty';
    } finally {
      state.saving = false;
      btns.forEach(b => { if (b) b.disabled = false; });
    }
  }

  function markDirty() {
    if (state.dirty) return;
    state.dirty = true;
    const note = $('#autosave-note');
    note.textContent = 'Có thay đổi chưa lưu';
    note.className = 'autosave is-dirty';
  }

  // ------------------------------------------------------------------
  // 9. Nạp dữ liệu ban đầu
  // ------------------------------------------------------------------
  async function loadCustomers() {
    try {
      const res = await api.customers.list({ pageSize: 200 });
      state.customers = res.items;
      const sel = $('#f-customer');
      res.items.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.code + ' · ' + c.name;
        sel.appendChild(opt);
      });

      // datalist danh mục hàng hóa
      const dl = document.createElement('datalist');
      dl.id = 'product-list';
      dl.innerHTML = CATALOG.map(p => '<option value="' + fmt.esc(p.name) + '">').join('');
      document.body.appendChild(dl);
    } catch (e) {
      toast('Không tải được danh sách khách hàng', 'Bạn vẫn có thể nhập thủ công.', 'warn');
    }
  }

  async function loadForEdit() {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;

    try {
      const inv = await api.invoices.detail(code);
      if (!inv) {
        toast('Không tìm thấy hóa đơn', 'Mã ' + code + ' không tồn tại.', 'error');
        return;
      }
      state.mode = 'edit';
      state.code = inv.code;

      $('#page-title').textContent = 'Chỉnh sửa hóa đơn';
      $('#crumb-current').textContent = inv.code;
      $('#f-code').value = inv.code;
      $('#f-issue-date').value = inv.issueDate;
      $('#f-due-date').value = inv.dueDate;
      $('#f-customer').value = inv.customerId || '';
      $('#f-note-customer').value = inv.note || '';

      const cust = state.customers.find(c => c.id === inv.customerId);
      if (cust) {
        $('#f-tax-code').value = cust.taxCode || '';
        $('#f-address').value = [cust.address, cust.contactPerson, cust.phone].filter(Boolean).join(' · ');
      }

      // mock chưa có dòng hàng chi tiết → dựng một dòng từ mô tả/tổng tiền
      const vatRate = inv.total ? Math.round(inv.taxAmount / (inv.total - inv.taxAmount) * 100) : 10;
      state.items = [{
        key: 'it0', name: inv.description || 'Theo hóa đơn gốc', unit: 'lần',
        qty: 1, price: inv.subtotal || inv.total, vat: isNaN(vatRate) ? 10 : vatRate
      }];

      $('#mode-stamp').className = 'stamp stamp--' + fmt.statusTone(inv.status);
      $('#mode-stamp').textContent = fmt.statusLabel(inv.status);
    } catch (e) {
      toast('Không tải được hóa đơn', 'Vui lòng thử lại sau.', 'error');
    }
  }

  // ------------------------------------------------------------------
  // 10. Gắn sự kiện
  // ------------------------------------------------------------------
  function bind() {

    // --- Dòng hàng ---
    itemsBody.addEventListener('input', function (e) {
      const tr = e.target.closest('tr[data-key]');
      if (!tr) return;
      const item = state.items.find(i => i.key === tr.dataset.key);
      if (!item) return;

      const field = e.target.dataset.field;
      if (field === 'qty') item.qty = Math.max(0, parseNum(e.target.value));
      else if (field === 'price') item.price = Math.max(0, parseNum(e.target.value));
      else if (field === 'name') item.name = e.target.value;
      else if (field === 'unit') item.unit = e.target.value;

      markDirty();
      updateTotals();
    });

    itemsBody.addEventListener('change', function (e) {
      if (e.target.dataset.field !== 'vat') return;
      const tr = e.target.closest('tr[data-key]');
      const item = state.items.find(i => i.key === tr.dataset.key);
      if (item) { item.vat = parseInt(e.target.value, 10); markDirty(); updateTotals(); }
    });

    // Định dạng lại đơn giá khi rời ô
    itemsBody.addEventListener('focusout', function (e) {
      if (e.target.dataset.field !== 'price') return;
      e.target.value = fmt.vnd(parseNum(e.target.value), false);
    });
    itemsBody.addEventListener('focusin', function (e) {
      if (e.target.dataset.field !== 'price') return;
      e.target.value = String(parseNum(e.target.value));
    });

    // Chọn nhanh từ danh mục
    itemsBody.addEventListener('input', debounce(function (e) {
      if (e.target.dataset.field !== 'name') return;
      const p = CATALOG.find(x => x.name === e.target.value.trim());
      if (!p) return;
      const tr = e.target.closest('tr[data-key]');
      const item = state.items.find(i => i.key === tr.dataset.key);
      item.unit = p.unit; item.price = p.price; item.vat = p.vat;
      renderItems();
      markDirty();
      toast('Đã điền thông tin mặt hàng', p.name + ' · ' + fmt.vnd(p.price));
    }, 350));

    $('#btn-add-row').addEventListener('click', function () {
      state.items.push(Object.assign(newItem(), { vat: parseInt($('#f-vat-default').value, 10) }));
      renderItems();
      markDirty();
      const rows = $$('#items-body tr');
      rows[rows.length - 1].querySelector('input').focus();
    });

    itemsBody.addEventListener('click', async function (e) {
      const btn = e.target.closest('[data-del]');
      if (!btn) return;
      if (state.items.length === 1) {
        toast('Không thể xóa', 'Hóa đơn cần ít nhất một dòng hàng.', 'warn');
        return;
      }
      const ok = await confirmDialog({
        title: 'Xóa dòng hàng này?',
        message: 'Dòng hàng sẽ bị loại khỏi hóa đơn. Thao tác này không thể hoàn tác.',
        okText: 'Xóa dòng'
      });
      if (!ok) return;
      state.items = state.items.filter(i => i.key !== btn.dataset.del);
      renderItems();
      markDirty();
    });

    $$('.quick-add [data-quick]').forEach(btn => {
      btn.addEventListener('click', function () {
        const p = CATALOG.find(x => x.name === btn.dataset.quick);
        const item = p
          ? { key: 'it' + (++uid), name: p.name, unit: p.unit, qty: 1, price: p.price, vat: p.vat }
          : Object.assign(newItem(), { name: btn.dataset.quick, vat: parseInt($('#f-vat-default').value, 10) });
        state.items.push(item);
        renderItems();
        markDirty();
      });
    });

    // --- Các trường khác ---
    ['#f-discount', '#f-issue-date', '#f-due-date', '#f-terms'].forEach(sel => {
      $(sel).addEventListener('input', function () {
        markDirty();
        updateTotals();
      });
    });

    $('#f-customer').addEventListener('change', function (e) {
      const cust = state.customers.find(c => c.id === e.target.value);
      if (cust) {
        $('#f-tax-code').value = cust.taxCode || '';
        $('#f-address').value = [cust.address, cust.contactPerson, cust.phone].filter(Boolean).join(' · ');
      }
      markDirty();
      updateTotals();
    });

    $$('.input').forEach(el => {
      el.addEventListener('input', function () {
        markDirty();
        el.classList.remove('is-invalid');
        el.removeAttribute('aria-invalid');
      });
    });

    // --- Nút lưu ---
    $('#btn-draft').addEventListener('click', () => save(true));
    $('#btn-issue').addEventListener('click', () => save(false));
    $('#btn-issue-2').addEventListener('click', () => save(false));

    $('#btn-preview').addEventListener('click', function () {
      toast('Xem trước hóa đơn', 'Cửa sổ xem trước sẽ hiển thị bản in hóa đơn GTGT.', 'warn');
    });
    $('#btn-new-customer').addEventListener('click', function () {
      toast('Tạo khách hàng mới', 'Chuyển tới biểu mẫu khách hàng — dữ liệu nhập dở sẽ được giữ.', 'warn');
    });

    $('#alert-close').addEventListener('click', () => { $('#form-alert').hidden = true; });
    $('#form-alert').addEventListener('click', function (e) {
      const b = e.target.closest('[data-goto-field]');
      if (!b) return;
      const el = $('#' + b.dataset.gotoField);
      if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });

    // --- AI-1 ---
    $('#btn-ai-run').addEventListener('click', runAiCheck);
    $('#ai-findings').addEventListener('click', async function (e) {

      const why = e.target.closest('[data-why]');
      if (why) {
        const body = why.parentElement.querySelector('.why-body');
        const open = why.getAttribute('aria-expanded') === 'true';
        why.setAttribute('aria-expanded', String(!open));
        body.hidden = open;
        return;
      }

      const accept = e.target.closest('[data-accept]');
      if (accept) {
        const f = state.aiFindings[parseInt(accept.dataset.accept, 10)];
        const ok = await confirmDialog({
          title: 'Xác nhận áp dụng đề xuất AI',
          html: 'Bạn sắp áp dụng đề xuất: <strong>' + fmt.esc(f.title) + '</strong>.<br>' +
            'Thay đổi sẽ được ghi vào nhật ký hoạt động với mã <strong>#lg-0' + (state.aiCounter + 1) + '</strong>.',
          okText: 'Áp dụng'
        });
        if (!ok) return;
        f.apply();
        state.aiFindings = state.aiFindings.filter(x => x !== f);
        renderFindings();
        return;
      }

      const dismiss = e.target.closest('[data-dismiss]');
      if (dismiss) {
        const idx = parseInt(dismiss.dataset.dismiss, 10);
        state.aiFindings.splice(idx, 1);
        renderFindings();
        toast('Đã bỏ qua đề xuất', 'Phát hiện được đánh dấu là đã xem xét.', 'warn');
      }
    });

    // --- Phím tắt & rời trang ---
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save(true);
      }
      if (e.key === 'Escape' && !$('#modal').hidden) {
        $('#modal-cancel').click();
      }
    });

    window.addEventListener('beforeunload', function (e) {
      if (!state.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });

    $$('[data-goto]').forEach(b => {
      b.addEventListener('click', () => { window.location.href = b.dataset.goto; });
    });
  }

  // ------------------------------------------------------------------
  // 11. Khởi chạy
  // ------------------------------------------------------------------
  (async function init() {
    // giá trị mặc định
    $('#f-issue-date').value = TODAY;
    $('#f-due-date').value = addDays(TODAY, 30);
    $('#f-code').value = 'INV-2026-' + String(201 + Math.floor(Math.random() * 40)).padStart(4, '0');
    $('#summary-updated').textContent = 'Cập nhật lần cuối ' + new Date().toLocaleTimeString('vi-VN');

    bind();
    await loadCustomers();
    await loadForEdit();
    renderItems();
    updateTotals();
  })();
})();