/**
 * admin-invoice-settings.js — Cấu hình hóa đơn (Quản trị hệ thống)
 * Mẫu số · ký hiệu · quy tắc cấp số · biểu mẫu · luồng phát hành · eHĐĐT
 */
(function () {
  'use strict';

  if (!window.api || !window.fmt || !window.MOCK) {
    document.getElementById('panel-series').innerHTML =
      '<div class="state-block"><p class="state-desc">Chưa nạp tệp dữ liệu mẫu (mock-data.js, utils.js, api.js).</p></div>';
    return;
  }

  const api = window.api;
  const fmt = window.fmt;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const params = new URLSearchParams(location.search);
  const demoState = params.get('state');

  const SERIES_STATUS = {
    active: { text: 'Đang dùng', stamp: 'stamp--info' },
    paused: { text: 'Tạm dừng', stamp: 'stamp--warn' },
    closed: { text: 'Đã đóng', stamp: 'stamp--neutral' }
  };
  const TODAY = '12/10/2026';

  const state = {
    loading: true, error: false, empty: false,
    series: [], cfg: null, open: null
  };

  // ------------------------------------------------------------------
  function pad(n, digits) {
    let s = String(n);
    while (s.length < (digits || 7)) s = '0' + s;
    return s;
  }
  function num(n) { return Number(n || 0).toLocaleString('vi-VN'); }
  function get(id) { const el = $(id); return el ? el.value.trim() : ''; }
  function isChecked(id) { const el = $(id); return !!(el && el.checked); }
  function setVal(id, v) { const el = $(id); if (el) el.value = v; }
  function setCheck(id, v) { const el = $(id); if (el) el.checked = !!v; }

  // ------------------------------------------------------------------
  function renderKPI() {
    const def = state.series.filter(s => s.isDefault)[0] || state.series[0];
    const prov = state.cfg.provider;
    const work = state.cfg.numbering;

    $('#kpi-row').innerHTML = `
      <article class="kpi">
        <p class="kpi-label">Ký hiệu đang dùng</p>
        <p class="kpi-value mono">${fmt.esc(def.code)}</p>
        <p class="kpi-sub">Mẫu số ${fmt.esc(def.sample)} · ${fmt.esc(def.type)}</p>
      </article>
      <article class="kpi kpi--ok">
        <p class="kpi-label">Số tiếp theo sẽ cấp</p>
        <p class="kpi-value mono">${pad(work.next, work.digits)}</p>
        <p class="kpi-sub">${def.issued} hóa đơn đã phát hành · bước nhảy ${work.step}</p>
      </article>
      <article class="kpi">
        <p class="kpi-label">Dịch vụ hóa đơn điện tử</p>
        <p class="kpi-value mono" style="font-size:15px">${fmt.esc(prov.name)}</p>
        <p class="kpi-sub">Kết nối ${prov.status === 'connected' ? 'ổn định' : 'gián đoạn'} · kiểm tra ${fmt.esc(prov.checkedAt)}</p>
      </article>
      <article class="kpi kpi--warn">
        <p class="kpi-label">Chữ ký số</p>
        <p class="kpi-value mono" style="font-size:15px">${fmt.esc(prov.cert)}</p>
        <p class="kpi-sub">Còn hiệu lực 261 ngày · hết hạn ${fmt.esc(prov.certExpire)}</p>
      </article>
      <article class="kpi kpi--out">
        <p class="kpi-label">Hóa đơn chờ cấp số</p>
        <p class="kpi-value mono">${state.cfg.pending}</p>
        <p class="kpi-sub">Quá 24 giờ: ${state.cfg.pendingOverdue} · chưa bật phát hành tự động</p>
      </article>`;
  }

  // ------------------------------------------------------------------
  function renderSeries() {
    $('#series-rows').innerHTML = state.series.map(s => {
      const st = SERIES_STATUS[s.status] || SERIES_STATUS.active;
      return `
      <tr data-id="${fmt.esc(s.id)}" class="${s.status === 'paused' ? 'is-paused' : ''}">
        <td data-label="Mẫu số"><span class="sample-code">${fmt.esc(s.sample)}</span>
          <p class="cell-sub">${fmt.esc(s.notice)}</p></td>
        <td data-label="Ký hiệu">
          <span class="sign-code"><b>${fmt.esc(s.code)}</b>
            ${s.isDefault ? '<span class="default-tag">MẶC ĐỊNH</span>' : ''}</span>
        </td>
        <td data-label="Loại hóa đơn"><span class="cell-mono">${fmt.esc(s.type)}</span></td>
        <td data-label="Số hiện tại"><span class="cell-mono">${pad(s.current, s.digits)}</span></td>
        <td data-label="Số tiếp theo"><span class="cell-next">${pad(s.current + s.step, s.digits)}</span></td>
        <td data-label="Hiệu lực">
          <span class="cell-mono">${fmt.esc(s.from)} → ${fmt.esc(s.to)}</span>
          <p class="cell-sub">${fmt.esc(s.id)}</p>
        </td>
        <td data-label="Phạm vi sử dụng"><span class="cell-mono">${fmt.esc(s.scope)}</span></td>
        <td data-label="Trạng thái"><span class="stamp ${st.stamp}">${fmt.esc(st.text)}</span></td>
      </tr>`;
    }).join('');

    const total = state.series.reduce((t, s) => t + s.issued, 0);
    const active = state.series.filter(s => s.status === 'active').length;
    $('#count-note').textContent =
      state.series.length + ' ký hiệu · ' + active + ' đang dùng · ' + total + ' hóa đơn đã cấp số';
    $('#series-note').textContent =
      'Thông báo phát hành gần nhất 26/12/2023 · dải số hiệu lực đến 31/12/2026';
  }

  function renderBars() {
    const rows = state.series.map((s, i) => ({
      name: s.code + ' · ' + s.type,
      count: s.issued,
      f: 'f-' + ((i % 4) + 1)
    }));
    const max = Math.max.apply(null, rows.map(r => r.count)) || 1;
    const total = rows.reduce((t, r) => t + r.count, 0);

    $('#series-bars').innerHTML = rows.map(r => `
      <div class="comp-row">
        <p class="comp-name">${fmt.esc(r.name)}</p>
        <div class="comp-track"><div class="comp-fill ${r.f}" style="width:${(r.count / max * 100).toFixed(1)}%"></div></div>
        <p class="comp-val">${r.count} hóa đơn<small>${(r.count / total * 100).toFixed(0)}% tổng số</small></p>
      </div>`).join('');
  }

  function renderAlerts() {
    const alerts = [
      { level: 'high', name: 'Ký hiệu AB/24E sắp hết dải số',
        note: 'Đã phát hành 48/50 số trong thông báo phát hành — cần làm thủ tục cấp tiếp với cơ quan thuế.' },
      { level: 'medium', name: 'Email gửi hóa đơn chưa xác thực SPF',
        note: 'hoadon@invoicepilot.vn chưa có bản ghi SPF — một số hộp thư khách hàng có thể đánh dấu thư rác.' },
      { level: 'medium', name: '3 hóa đơn chờ cấp số quá 24 giờ',
        note: 'Luồng phát hành tự động đang tắt — kiểm tra kết nối VNPT Invoice hoặc cấp số thủ công.' },
      { level: 'medium', name: 'Chữ ký số VNPT-CA hết hạn 30/06/2027',
        note: 'Còn 261 ngày. Nên chuẩn bị gia hạn trước 30 ngày để không gián đoạn phát hành.' }
    ];
    $('#config-alerts').innerHTML = alerts.map(a => `
      <div class="watch-item is-${a.level}">
        <div class="watch-body">
          <p class="watch-name">${fmt.esc(a.name)}</p>
          <p class="watch-note">${fmt.esc(a.note)}</p>
        </div>
      </div>`).join('');
  }

  // ------------------------------------------------------------------
  function renderPreview() {
    const c = state.cfg;
    const next = Math.max(1, parseInt(get('#n-next') || '1', 10));
    const digits = parseInt(get('#n-digits') || '7', 10);
    const currency = get('#n-currency') || 'VND';
    const rate = get('#n-taxRate') || '8% (ưu đãi)';
    const rateNum = parseInt(rate, 10) || 0;
    const base = 12500000;
    const tax = Math.round(base * rateNum / 100);
    const grand = base + tax;

    $('#preview').innerHTML = `
      <div class="pv-company">
        <p class="pv-company-name">${fmt.esc(get('#c-name') || c.company.name)}</p>
        <p class="pv-company-meta">
          MST: ${fmt.esc(get('#c-taxId') || c.company.taxId)}<br>
          ${fmt.esc(get('#c-address') || c.company.address)}<br>
          ĐT: ${fmt.esc(get('#c-phone') || c.company.phone)} · ${fmt.esc(get('#c-email') || c.company.email)}
        </p>
      </div>

      <p class="pv-title">Hóa đơn giá trị gia tăng</p>
      <p class="pv-sub">VAT invoice · mẫu biểu 01</p>

      <div class="pv-meta">
        <div class="pv-meta-row"><span>Mẫu số</span><span>${fmt.esc(state.series[0] ? state.series[0].sample : '01GTKT0/001')}</span></div>
        <div class="pv-meta-row"><span>Ký hiệu</span><span>${fmt.esc(state.series[0] ? state.series[0].code : 'AA/24E')}</span></div>
        <div class="pv-meta-row"><span>Số</span><span>${pad(next, digits)}</span></div>
        <div class="pv-meta-row"><span>Ngày</span><span>${TODAY}</span></div>
        <div class="pv-meta-row"><span>Tiền tệ</span><span>${fmt.esc(currency)}</span></div>
      </div>

      <table class="pv-table">
        <thead>
          <tr><th>Tên hàng hóa, dịch vụ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
        </thead>
        <tbody>
          <tr><td>Dịch vụ quản lý công nợ</td><td>3</td><td>2.500.000</td><td>7.500.000</td></tr>
          <tr><td>Gói đào tạo sử dụng</td><td>1</td><td>5.000.000</td><td>5.000.000</td></tr>
        </tbody>
      </table>

      <div class="pv-totals">
        <div class="pv-total-line"><span>Cộng tiền hàng</span><span>${num(base)}</span></div>
        <div class="pv-total-line"><span>Thuế GTGT ${fmt.esc(rate)}</span><span>${num(tax)}</span></div>
        <div class="pv-total-line is-grand"><span>Tổng cộng thanh toán</span><span>${num(grand)} ${fmt.esc(currency)}</span></div>
      </div>

      ${isChecked('#n-words')
        ? `<p class="pv-words">Bằng chữ: mười hai triệu năm trăm nghìn đồng chẵn.</p>` : ''}

      ${isChecked('#c-showBank')
        ? `<p class="pv-words">Tài khoản thanh toán: ${fmt.esc(get('#c-bank') || c.company.bank)}</p>` : ''}

      <p class="pv-foot">${fmt.esc(get('#c-footer') || c.template.footer)}</p>

      <div class="pv-sign">
        <div class="pv-sign-block"><strong>Người mua hàng</strong>(Ký, ghi rõ họ tên)</div>
        <div class="pv-sign-block"><strong>Người bán hàng</strong>Đã ký số ${TODAY}</div>
      </div>

      <svg class="pv-stamp" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <circle cx="60" cy="60" r="52" stroke="currentColor" stroke-width="3"/>
        <circle cx="60" cy="60" r="44" stroke="currentColor" stroke-width="1"/>
        <path d="M42 46l36 0M42 60l36 0M42 74l24 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <text x="60" y="34" text-anchor="middle" font-family="IBM Plex Mono, monospace"
              font-size="9" letter-spacing="1.6" fill="currentColor">ĐÃ KÝ SỐ</text>
        <text x="60" y="96" text-anchor="middle" font-family="IBM Plex Mono, monospace"
              font-size="8" letter-spacing="1.2" fill="currentColor">${TODAY}</text>
      </svg>`;
  }

  // ------------------------------------------------------------------
  function fillForm() {
    const c = state.cfg;
    setVal('#n-next', c.numbering.next);
    setVal('#n-digits', c.numbering.digits);
    setVal('#n-step', c.numbering.step);
    setVal('#n-period', c.numbering.period);
    setVal('#n-roundMoney', c.numbering.roundMoney);
    setVal('#n-roundTax', c.numbering.roundTax);
    setVal('#n-taxRate', c.numbering.taxRate);
    setVal('#n-taxAccount', c.numbering.taxAccount);
    setVal('#n-dateFormat', c.numbering.dateFormat);
    setVal('#n-currency', c.numbering.currency);
    setVal('#n-termDays', c.numbering.termDays);
    setCheck('#n-words', c.numbering.words);
    setCheck('#n-bilingual', c.numbering.bilingual);

    setVal('#c-name', c.company.name);
    setVal('#c-taxId', c.company.taxId);
    setVal('#c-address', c.company.address);
    setVal('#c-phone', c.company.phone);
    setVal('#c-email', c.company.email);
    setVal('#c-bank', c.company.bank);
    setVal('#c-hotline', c.company.hotline);
    setVal('#c-template', c.template.name);
    setVal('#c-footer', c.template.footer);
    setCheck('#c-logo', c.template.logo);
    setCheck('#c-showBank', c.template.showBank);

    setVal('#p-provider', c.provider.name);
    setVal('#p-endpoint', c.provider.endpoint);
    setVal('#p-account', c.provider.account);
    setVal('#p-timeout', c.provider.timeout);
    setVal('#p-cert', c.provider.cert);
    setVal('#p-certExpire', c.provider.certExpire);
    setCheck('#p-autoSend', c.provider.autoSend);
    setCheck('#p-syncTax', c.provider.syncTax);
    $('#p-last').textContent = 'Kiểm tra gần nhất ' + c.provider.checkedAt;

    setCheck('#w-approval', c.workflow.approval);
    setVal('#w-approvalLimit', c.workflow.approvalLimit);
    setCheck('#w-autoIssue', c.workflow.autoIssue);
    setCheck('#w-autoEmail', c.workflow.autoEmail);
    setCheck('#w-savePdf', c.workflow.savePdf);
    setCheck('#w-allowNeg', c.workflow.allowNeg);
    setCheck('#w-remind', c.workflow.reminderDays > 0);
    setVal('#w-reminderDays', c.workflow.reminderDays);
  }

  function validate() {
    $$('.form-input').forEach(el => el.classList.remove('is-invalid'));
    $$('.field-error').forEach(el => { el.hidden = true; });
    let ok = true;

    const taxId = get('#c-taxId');
    if (!/^\d{10}(-\d{3})?/.test(taxId)) {
      $('#c-taxId').classList.add('is-invalid');
      $('#e-taxId').hidden = false;
      $('#e-taxId').textContent = 'Mã số thuế gồm 10 chữ số (hoặc 13 có dấu gạch).';
      ok = false;
    }
    const email = get('#c-email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $('#c-email').classList.add('is-invalid');
      $('#e-email').hidden = false;
      $('#e-email').textContent = 'Email nhận hóa đơn không đúng định dạng.';
      ok = false;
    }
    if (!get('#c-name')) {
      $('#c-name').classList.add('is-invalid');
      $('#e-name').hidden = false;
      $('#e-name').textContent = 'Phải có tên đơn vị hiển thị trên hóa đơn.';
      ok = false;
    }
    const next = parseInt(get('#n-next'), 10);
    if (!(next > 0)) {
      $('#n-next').classList.add('is-invalid');
      $('#e-next').hidden = false;
      $('#e-next').textContent = 'Số tiếp theo phải lớn hơn 0.';
      ok = false;
    }
    const step = parseInt(get('#n-step'), 10);
    if (!(step >= 1)) {
      $('#n-step').classList.add('is-invalid');
      $('#e-step').hidden = false;
      $('#e-step').textContent = 'Bước nhảy tối thiểu là 1.';
      ok = false;
    }
    const days = parseInt(get('#n-termDays'), 10);
    if (isNaN(days) || days < 0 || days > 180) {
      $('#n-termDays').classList.add('is-invalid');
      $('#e-termDays').hidden = false;
      $('#e-termDays').textContent = 'Thời hạn thanh toán từ 0 đến 180 ngày.';
      ok = false;
    }
    const endpoint = get('#p-endpoint');
    if (get('#p-provider').indexOf('Không tích hợp') === -1 && endpoint.indexOf('https://') !== 0) {
      $('#p-endpoint').classList.add('is-invalid');
      $('#e-endpoint').hidden = false;
      $('#e-endpoint').textContent = 'Đường dẫn kết nối phải bắt đầu bằng https://';
      ok = false;
    }
    return ok;
  }

  async function save() {
    if (!validate()) {
      toast('Chưa lưu được cấu hình', 'Vui lòng kiểm tra các trường được đánh dấu đỏ.', 'error');
      return;
    }
    const payload = {
      numbering: {
        next: parseInt(get('#n-next'), 10),
        digits: parseInt(get('#n-digits'), 10),
        step: parseInt(get('#n-step'), 10),
        period: get('#n-period'),
        roundMoney: get('#n-roundMoney'),
        roundTax: get('#n-roundTax'),
        taxRate: get('#n-taxRate'),
        taxAccount: get('#n-taxAccount'),
        dateFormat: get('#n-dateFormat'),
        currency: get('#n-currency'),
        termDays: parseInt(get('#n-termDays'), 10),
        words: isChecked('#n-words'),
        bilingual: isChecked('#n-bilingual')
      },
      company: {
        name: get('#c-name'), taxId: get('#c-taxId'), address: get('#c-address'),
        phone: get('#c-phone'), email: get('#c-email'), bank: get('#c-bank'),
        hotline: get('#c-hotline')
      },
      template: {
        name: get('#c-template'), footer: get('#c-footer'),
        logo: isChecked('#c-logo'), showBank: isChecked('#c-showBank')
      },
      provider: {
        name: get('#p-provider'), endpoint: get('#p-endpoint'), account: get('#p-account'),
        timeout: parseInt(get('#p-timeout'), 10), cert: get('#p-cert'),
        certExpire: get('#p-certExpire'), autoSend: isChecked('#p-autoSend'),
        syncTax: isChecked('#p-syncTax')
      },
      workflow: {
        approval: isChecked('#w-approval'),
        approvalLimit: parseInt(get('#w-approvalLimit'), 10),
        autoIssue: isChecked('#w-autoIssue'),
        autoEmail: isChecked('#w-autoEmail'),
        savePdf: isChecked('#w-savePdf'),
        allowNeg: isChecked('#w-allowNeg'),
        reminderDays: isChecked('#w-remind') ? parseInt(get('#w-reminderDays'), 10) : 0
      }
    };

    try {
      state.cfg = await api.invoiceSettings.update(payload);
      renderAll();
      toast('Đã lưu cấu hình hóa đơn', 'Áp dụng cho các hóa đơn phát hành từ thời điểm này.', 'ok');
    } catch (e) {
      toast('Không lưu được cấu hình', 'Dịch vụ không phản hồi — cấu hình giữ nguyên giá trị cũ.', 'error');
    }
  }

  // ------------------------------------------------------------------
  function openSeries(id) {
    const s = state.series.filter(x => x.id === id)[0];
    if (!s) return;
    state.open = id;
    const st = SERIES_STATUS[s.status] || SERIES_STATUS.active;

    $('#drawer-kicker').textContent = 'Ký hiệu · ' + s.id;
    $('#drawer-title').textContent = s.sample + ' — ' + s.code;

    $('#drawer-body').innerHTML = `
      <div class="d-grid4">
        <div class="d-cell"><p class="k">Số hiện tại</p><p class="v">${pad(s.current, s.digits)}</p></div>
        <div class="d-cell"><p class="k">Số tiếp theo</p><p class="v">${pad(s.current + s.step, s.digits)}</p></div>
        <div class="d-cell"><p class="k">Đã phát hành</p><p class="v">${s.issued}</p></div>
        <div class="d-cell"><p class="k">Bước nhảy</p><p class="v">${s.step}</p></div>
      </div>

      <div class="d-block">
        <p class="detail-title">Thông tin phát hành</p>
        <div class="d-list">
          <div class="d-item"><span>Loại hóa đơn</span><span class="v2">${fmt.esc(s.type)}</span></div>
          <div class="d-item"><span>Phạm vi sử dụng</span><span class="v2">${fmt.esc(s.scope)}</span></div>
          <div class="d-item"><span>Hiệu lực</span><span class="v2">${fmt.esc(s.from)} → ${fmt.esc(s.to)}</span></div>
          <div class="d-item"><span>Trạng thái</span><span class="v2"><span class="stamp ${st.stamp}">${fmt.esc(st.text)}</span></span></div>
        </div>
      </div>

      <div class="d-block">
        <p class="detail-title">Thông báo phát hành</p>
        <div class="d-notes">
          <p class="d-note"><span class="who">Gửi cơ quan thuế</span>${fmt.esc(s.notice)}</p>
          <p class="d-note"><span class="who">Ghi chú nội bộ</span>${fmt.esc(s.note)}</p>
        </div>
      </div>

      <div class="d-block">
        <p class="detail-title">Điều chỉnh dải số</p>
        <div class="form-row">
          <div>
            <label class="field-label" for="s-current">Số hiện tại</label>
            <input class="form-input mono" id="s-current" type="number" min="0" value="${s.current}">
            <p class="field-error" id="e-current" hidden></p>
          </div>
          <div>
            <label class="field-label" for="s-step">Bước nhảy</label>
            <input class="form-input mono" id="s-step" type="number" min="1" value="${s.step}">
          </div>
          <div class="span2">
            <label class="field-label" for="s-reason">Lý do điều chỉnh (bắt buộc)</label>
            <textarea class="form-area" id="s-reason" placeholder="Ví dụ: cấp tiếp dải số theo thông báo số 15/TB-VP…"></textarea>
            <p class="field-error" id="e-reason" hidden></p>
          </div>
        </div>
        <p class="form-hint">Thay đổi dải số phải khớp với thông báo phát hành đã gửi cơ quan thuế.</p>
      </div>`;

    $('#drawer-foot').innerHTML = `
      <button class="btn btn--primary" type="button" data-act="save">Lưu thay đổi</button>
      <button class="btn btn--danger-plain" type="button" data-act="toggle">
        ${s.status === 'active' ? 'Tạm dừng sử dụng' : 'Bật lại ký hiệu'}</button>`;

    showDrawer();
    $('#s-current').focus();
  }

  async function saveSeries() {
    const s = state.series.filter(x => x.id === state.open)[0];
    if (!s) return;
    const cur = parseInt(get('#s-current'), 10);
    const step = parseInt(get('#s-step'), 10);
    const reason = get('#s-reason');

    $('#s-current').classList.remove('is-invalid');
    $('#s-reason').classList.remove('is-invalid');
    $('#e-current').hidden = true;
    $('#e-reason').hidden = true;

    let ok = true;
    if (isNaN(cur) || cur < 0) {
      $('#s-current').classList.add('is-invalid');
      $('#e-current').hidden = false;
      $('#e-current').textContent = 'Số hiện tại là số nguyên không âm.';
      ok = false;
    }
    if (!reason) {
      $('#s-reason').classList.add('is-invalid');
      $('#e-reason').hidden = false;
      $('#e-reason').textContent = 'Cần ghi rõ lý do để đối chiếu với thông báo phát hành.';
      ok = false;
    }
    if (!ok) {
      toast('Chưa lưu được thay đổi', 'Kiểm tra số hiện tại và lý do điều chỉnh.', 'error');
      return;
    }

    try {
      const updated = await api.invoiceSeries.update(s.id, { current: cur, step: step });
      const i = state.series.findIndex(x => x.id === s.id);
      if (i > -1) state.series[i] = updated;
      closeDrawer();
      renderAll();
      toast('Đã cập nhật dải số', s.code + ' → số hiện tại ' + pad(updated.current, updated.digits) + '.', 'warn');
    } catch (e) {
      toast('Không cập nhật được', 'Dịch vụ cấp số không phản hồi.', 'error');
    }
  }

  async function toggleSeries() {
    const s = state.series.filter(x => x.id === state.open)[0];
    if (!s) return;
    const next = s.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await api.invoiceSeries.update(s.id, { status: next });
      const i = state.series.findIndex(x => x.id === s.id);
      if (i > -1) state.series[i] = updated;
      closeDrawer();
      renderAll();
      toast(next === 'active' ? 'Đã bật lại ký hiệu' : 'Đã tạm dừng ký hiệu',
        s.code + (next === 'active' ? ' có thể sử dụng trở lại.' : ' — hóa đơn mới sẽ dùng ký hiệu mặc định.'), 'warn');
    } catch (e) {
      toast('Không thay đổi được trạng thái', 'Dịch vụ cấp số không phản hồi.', 'error');
    }
  }

  // ------------------------------------------------------------------
  function showDrawer() {
    $('#drawer').hidden = false;
    $('#drawer-overlay').hidden = false;
    $('#drawer').setAttribute('aria-hidden', 'false');
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
    renderSeries();
    renderBars();
    renderAlerts();
    renderPreview();
    $('#head-stamp').textContent = state.cfg.provider.status === 'connected'
      ? 'Đã kết nối eHĐĐT' : 'Kết nối gián đoạn';
  }

  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;
    const hideRest = state.loading || state.error;
    $$('.cfg-grid, .flow-panel, .split-row, .note-strip').forEach(el => {
      el.hidden = hideRest || state.empty;
    });
  }

  // ------------------------------------------------------------------
  function bind() {
    $('#series-rows').addEventListener('click', function (e) {
      const row = e.target.closest('tr[data-id]');
      if (row) openSeries(row.dataset.id);
    });

    $('#drawer-close').addEventListener('click', closeDrawer);
    $('#drawer-overlay').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer();
    });

    $('#drawer-foot').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      if (btn.dataset.act === 'save') saveSeries();
      if (btn.dataset.act === 'toggle') toggleSeries();
    });

    // xem trước trực tiếp
    ['#n-next', '#n-digits', '#n-currency', '#n-taxRate', '#c-name', '#c-taxId',
     '#c-address', '#c-phone', '#c-email', '#c-bank', '#c-footer',
     '#n-words', '#c-showBank'].forEach(sel => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('input', renderPreview);
      el.addEventListener('change', renderPreview);
    });

    $('#btn-save').addEventListener('click', save);
    $('#btn-reset').addEventListener('click', () => {
      state.cfg = JSON.parse(JSON.stringify(MOCK.invoiceSettings));
      fillForm();
      renderPreview();
      toast('Đã khôi phục cấu hình mặc định', 'Bấm "Lưu cấu hình" để xác nhận thay đổi.', 'warn');
    });

    $('#btn-test').addEventListener('click', async function () {
      const btn = this;
      btn.disabled = true;
      btn.style.opacity = '.6';
      toast('Đang kiểm tra kết nối', get('#p-provider') + ' — chờ phản hồi…', 'warn');
      setTimeout(() => {
        btn.disabled = false;
        btn.style.opacity = '1';
        const now = '12/10/2026 08:41';
        $('#p-last').textContent = 'Kiểm tra gần nhất ' + now;
        toast('Kết nối ổn định', 'Phản hồi trong 0,42 giây · chữ ký số ' + get('#p-cert') + ' hợp lệ.', 'ok');
      }, 1100);
    });

    $('#btn-retry').addEventListener('click', load);
    $('#btn-add-series').addEventListener('click', () => {
      toast('Thêm ký hiệu hóa đơn', 'Cần nhập mẫu số, ký hiệu và thông báo phát hành từ cơ quan thuế.', 'warn');
    });
  }

  // ------------------------------------------------------------------
  async function load() {
    state.loading = true; state.error = false;
    render();
    try {
      const [series, cfg] = await Promise.all([
        api.invoiceSeries.list(),
        api.invoiceSettings.get()
      ]);
      state.series = series;
      state.cfg = cfg;
    } catch (e) {
      state.error = true;
    } finally {
      state.loading = false;
      if (demoState === 'error') state.error = true;
      if (demoState === 'empty') { state.empty = true; state.series = []; }
      if (!state.error && !state.empty) {
        fillForm();
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