/**
 * manager-cashflow-forecast.js — Dự báo dòng tiền 7 tuần (vai trò Quản lý)
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
  const demoState = params.get('state');        // error | empty

  const state = {
    loading: true, error: false, empty: false,
    data: null,
    scenario: params.get('scenario') === 'cautious' ? 'cautious' : 'base',
    threshold: 150000000,
    rows: [],
    open: null
  };

  const CONF = {
    high:   { text: 'Cao', stamp: 'stamp--info' },
    medium: { text: 'Trung bình', stamp: 'stamp--warn' },
    low:    { text: 'Thấp', stamp: 'stamp--danger' }
  };
  const OUT_LABELS = {
    payroll: 'Nhân sự & lương', vendor: 'Trả nhà cung cấp',
    tax: 'Thuế & phí', other: 'Chi phí khác'
  };
  const OUT_CLASSES = { vendor: 'f-out-1', payroll: 'f-out-2', tax: 'f-out-3', other: 'f-out-4' };

  // ------------------------------------------------------------------
  // Tính toán
  // ------------------------------------------------------------------
  function outflowTotal(p) {
    const o = p.outflow;
    return o.payroll + o.vendor + o.tax + o.other;
  }
  function tri(v) {
    return (v / M).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
  }
  function computeRows() {
    const d = state.data;
    const f = d.scenarios[state.scenario].factors;
    let balance = d.openingBalance;
    state.rows = d.periods.map(p => {
      const promised = Math.round(p.promised * f.promised / 1e5) * 1e5;
      const scheduled = Math.round(p.scheduled * f.scheduled / 1e5) * 1e5;
      const expected = Math.round(p.expected * f.expected / 1e5) * 1e5;
      const inflow = promised + scheduled + expected;
      const outflow = outflowTotal(p);
      const net = inflow - outflow;
      balance += net;
      return {
        period: p, promised, scheduled, expected, inflow, outflow, net,
        closing: balance, under: balance < state.threshold
      };
    });
  }

  // ------------------------------------------------------------------
  // KPI
  // ------------------------------------------------------------------
  function renderKPI() {
    const rows = state.rows;
    const sum = (fn) => rows.reduce((s, r) => s + fn(r), 0);
    const totalIn = sum(r => r.inflow);
    const totalOut = sum(r => r.outflow);
    const net = totalIn - totalOut;
    const minRow = rows.reduce((m, r) => (r.closing < m.closing ? r : m), rows[0]);
    const maxOutRow = rows.reduce((m, r) => (r.outflow > m.outflow ? r : m), rows[0]);
    const overdueInForecast = sum(r => r.promised + r.expected);
    const overdueTotal = 520000000;

    $('#kpi-row').innerHTML = `
      <article class="kpi kpi--in">
        <p class="kpi-label">Tổng thu dự kiến</p>
        <p class="kpi-value mono">${fmt.vnd(totalIn)}</p>
        <p class="kpi-sub">Cam kết ${tri(sum(r => r.promised))} · đến hạn ${tri(sum(r => r.scheduled))} · thu hồi ${tri(sum(r => r.expected))}</p>
      </article>
      <article class="kpi kpi--out">
        <p class="kpi-label">Tổng chi dự kiến</p>
        <p class="kpi-value mono">${fmt.vnd(totalOut)}</p>
        <p class="kpi-sub">Đỉnh ${tri(maxOutRow.outflow)} · ${maxOutRow.period.range}</p>
      </article>
      <article class="kpi ${net < 0 ? 'kpi--out' : 'kpi--in'}">
        <p class="kpi-label">Dòng tiền ròng 7 tuần</p>
        <p class="kpi-value mono">${net > 0 ? '+' : ''}${fmt.vnd(net)}</p>
        <p class="kpi-sub">Kịch bản ${fmt.esc(state.data.scenarios[state.scenario].label)} · chi giữ nguyên</p>
      </article>
      <article class="kpi ${minRow.under ? 'kpi--out' : 'kpi--warn'}">
        <p class="kpi-label">Số dư thấp nhất</p>
        <p class="kpi-value mono">${fmt.vnd(minRow.closing)}</p>
        <p class="kpi-sub">${minRow.period.range} · ngưỡng ${tri(state.threshold)}${minRow.under ? ' · dưới ngưỡng' : ''}</p>
      </article>
      <article class="kpi kpi--warn">
        <p class="kpi-label">Nợ quá hạn trong dự báo</p>
        <p class="kpi-value mono">${tri(overdueInForecast)}</p>
        <p class="kpi-sub">${fmt.percent(overdueInForecast / overdueTotal * 100)} của 520 triệu đang quá hạn</p>
      </article>`;
  }

  // ------------------------------------------------------------------
  // Cảnh báo thanh khoản
  // ------------------------------------------------------------------
  function renderAlert() {
    const risk = state.rows.filter(r => r.under);
    const strip = $('#alert-strip');
    if (!risk.length) {
      strip.className = 'alert-strip is-ok';
      strip.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M8.2 12.4l2.6 2.6 5-5.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="alert-body">
          <p class="alert-title">Toàn bộ 7 tuần giữ trên ngưỡng an toàn</p>
          <p class="alert-desc">Ở kịch bản ${fmt.esc(state.data.scenarios[state.scenario].label.toLowerCase())},
            số dư thấp nhất là ${fmt.vnd(Math.min.apply(null, state.rows.map(r => r.closing)))} tại tuần
            ${fmt.esc(state.rows.reduce((m, r) => (r.closing < m.closing ? r : m), state.rows[0]).period.range)} —
            vẫn cao hơn ngưỡng ${tri(state.threshold)} mà bạn đang đặt.</p>
        </div>`;
      return;
    }
    const first = risk[0];
    const last = risk[risk.length - 1];
    strip.className = 'alert-strip';
    strip.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 4 2.8 20h18.4L12 4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 10v4m0 3h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <div class="alert-body">
        <p class="alert-title">Dòng tiền rơi xuống dưới ngưỡng an toàn từ tuần ${fmt.esc(first.period.range)}</p>
        <p class="alert-desc">Ở kịch bản ${fmt.esc(state.data.scenarios[state.scenario].label.toLowerCase())},
          số dư cuối kỳ ${fmt.vnd(first.closing)} — thấp hơn ngưỡng ${tri(state.threshold)}.
          ${risk.length > 1 ? 'Tình trạng kéo dài qua ' + risk.length + ' tuần liên tiếp, tuần cuối kỳ còn ' + fmt.vnd(last.closing) + '.' : ''}</p>
        <ul class="alert-actions">
          <li>Đôn đốc 3 hóa đơn đang tranh chấp trị giá 295,5 triệu ₫, riêng HD-2026-0731 chiếm 152,5 triệu ₫.</li>
          <li>Đàm phán dời phần chi nhà cung cấp của tuần 26/10 – 01/11 sang nửa sau tháng 11.</li>
          <li>Giữ nguyên lịch chi lương 15/11 và ưu tiên xác nhận cam kết của Phước Lộc trước 25/10.</li>
        </ul>
      </div>`;
  }

  // ------------------------------------------------------------------
  // Biểu đồ
  // ------------------------------------------------------------------
  function renderChart() {
    const rows = state.rows;
    const W = 900, H = 320, L = 70, R = 28, T = 22, B = 56;
    const pw = W - L - R, ph = H - T - B;

    const maxRaw = Math.max.apply(null, rows.map(r => Math.max(r.inflow, r.outflow, r.closing))
      .concat([state.threshold])) * 1.12;
    const step = Math.pow(10, Math.floor(Math.log10(maxRaw))) / 2;
    const maxVal = Math.ceil(maxRaw / step) * step;

    const y = v => T + ph - (v / maxVal) * ph;
    const gw = pw / rows.length;
    const cx = i => L + gw * i + gw / 2;
    const barW = Math.min(30, gw * 0.26);

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ dòng tiền 7 tuần">`;

    // lưới + trục Y
    for (let k = 0; k <= 4; k++) {
      const v = maxVal * k / 4;
      const yy = y(v);
      svg += `<line x1="${L}" y1="${yy}" x2="${W - R}" y2="${yy}" stroke="#E7E2D8" stroke-width="1"/>`;
      svg += `<text x="${L - 12}" y="${yy + 3.5}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="10" fill="#7C7768">${(v / M).toLocaleString('vi-VN')}</text>`;
    }

    // ngưỡng an toàn
    const yT = y(state.threshold);
    svg += `<line x1="${L}" y1="${yT}" x2="${W - R}" y2="${yT}" stroke="#9A7514" stroke-width="1.6" stroke-dasharray="7 5"/>`;
    svg += `<text x="${W - R}" y="${yT - 8}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="10" fill="#9A7514">Ngưỡng an toàn ${tri(state.threshold)}</text>`;

    // cột
    rows.forEach((r, i) => {
      const x0 = cx(i) - barW - 4;
      const x1 = cx(i) + 4;
      svg += `<rect x="${x0}" y="${y(r.inflow)}" width="${barW}" height="${T + ph - y(r.inflow)}" fill="#1B4D3E" rx="2"/>`;
      svg += `<rect x="${x1}" y="${y(r.outflow)}" width="${barW}" height="${T + ph - y(r.outflow)}" fill="#B14A2B" rx="2"/>`;
    });

    // đường số dư
    const pts = rows.map((r, i) => cx(i) + ',' + y(r.closing)).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="#171A1F" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    rows.forEach((r, i) => {
      svg += `<circle cx="${cx(i)}" cy="${y(r.closing)}" r="4.5" fill="${r.under ? '#B14A2B' : '#FFFFFF'}" stroke="${r.under ? '#B14A2B' : '#171A1F'}" stroke-width="2"/>`;
    });

    // nhãn trục X
    rows.forEach((r, i) => {
      svg += `<text x="${cx(i)}" y="${T + ph + 22}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#3F444B">${fmt.esc(r.period.range)}</text>`;
      svg += `<text x="${cx(i)}" y="${T + ph + 38}" text-anchor="middle" font-family="Be Vietnam Pro, sans-serif" font-size="9" letter-spacing="1" fill="#7C7768">${fmt.esc(r.period.label.toUpperCase())}</text>`;
    });

    // vùng bắt sự kiện
    rows.forEach((r, i) => {
      svg += `<rect class="chart-hit" data-week="${fmt.esc(r.period.id)}" x="${L + gw * i}" y="${T}" width="${gw}" height="${ph}" fill="transparent"/>`;
    });

    svg += `</svg>`;
    $('#chart').innerHTML = svg;
    $('#chart-scenario').textContent = state.data.scenarios[state.scenario].label;
  }

  // ------------------------------------------------------------------
  // Cơ cấu
  // ------------------------------------------------------------------
  function renderComposition() {
    const rows = state.rows;
    const s = (fn) => rows.reduce((a, r) => a + fn(r), 0);
    const inParts = [
      { name: 'Cam kết thu của khách hàng', val: s(r => r.promised), cls: 'f-in-1',
        note: '6 hóa đơn · Thiên Hà, Phú Thịnh, Phước Lộc, Bình Minh' },
      { name: 'Khoản phải thu đến hạn theo lịch', val: s(r => r.scheduled), cls: 'f-in-2',
        note: 'Các hóa đơn chưa tới hạn trong 7 tuần' },
      { name: 'Thu hồi nợ quá hạn (ngoài cam kết)', val: s(r => r.expected), cls: 'f-in-3',
        note: 'Nhóm 1–60 ngày, không tính khoản đang tranh chấp' }
    ];
    const outParts = ['vendor', 'payroll', 'tax', 'other'].map(k => ({
      name: OUT_LABELS[k], val: s(r => r.period.outflow[k]), cls: OUT_CLASSES[k], note: ''
    }));

    const draw = (parts, host, noteHost) => {
      const total = parts.reduce((a, p) => a + p.val, 0) || 1;
      const max = Math.max.apply(null, parts.map(p => p.val));
      $(host).innerHTML = parts.map(p => `
        <div class="comp-row">
          <p class="comp-name">${fmt.esc(p.name)}</p>
          <div class="comp-track"><div class="comp-fill ${p.cls}" style="width:${(p.val / max * 100).toFixed(1)}%"></div></div>
          <p class="comp-val">${fmt.vnd(p.val)}<small>${fmt.percent(p.val / total * 100)}</small></p>
        </div>`).join('');
      $(noteHost).textContent = parts.map(p => p.note).filter(Boolean).join(' · ');
    };

    draw(inParts, '#comp-in', '#comp-in-note');
    draw(outParts, '#comp-out', '#comp-out-note');
    $('#comp-out-note').textContent =
      'Khoản chi là cam kết cứng nên không đổi giữa hai kịch bản; tuần 26/10 – 01/11 tập trung 440 triệu chi nhà cung cấp và thuế quý III.';
    $('#comp-in-note').textContent =
      'Tỷ lệ thu hồi nợ quá hạn dự kiến thay đổi theo kịch bản — đây là đòn bẩy lớn nhất của dự báo.';
  }

  // ------------------------------------------------------------------
  // Bảng kỳ dự báo
  // ------------------------------------------------------------------
  function renderTable() {
    $('#cf-rows').innerHTML = state.rows.map(r => {
      const c = CONF[r.period.confidence];
      return `
      <tr data-week="${fmt.esc(r.period.id)}" class="${r.under ? 'is-risk' : ''}">
        <td data-label="Kỳ dự báo">
          <p class="week-name">${fmt.esc(r.period.range)}</p>
          <p class="week-range">${fmt.esc(r.period.label)} · ${fmt.esc(r.period.from)} – ${fmt.esc(r.period.to)}</p>
          ${r.under ? '<p class="row-note">Dưới ngưỡng an toàn</p>' : ''}
        </td>
        <td class="num" data-label="Thu theo cam kết"><span class="val-in">${fmt.vnd(r.promised)}</span></td>
        <td class="num" data-label="Thu theo lịch"><span class="num-mono">${fmt.vnd(r.scheduled)}</span></td>
        <td class="num" data-label="Thu hồi nợ quá hạn"><span class="num-mono">${fmt.vnd(r.expected)}</span></td>
        <td class="num" data-label="Tổng thu"><span class="num-mono">${fmt.vnd(r.inflow)}</span></td>
        <td class="num" data-label="Tổng chi"><span class="val-out">${fmt.vnd(r.outflow)}</span></td>
        <td class="num" data-label="Dòng tiền ròng">
          <span class="${r.net < 0 ? 'val-net-neg' : 'val-net-pos'}">${r.net > 0 ? '+' : ''}${fmt.vnd(r.net)}</span>
        </td>
        <td class="num" data-label="Số dư cuối kỳ">
          <span class="val-bal ${r.under ? 'is-under' : ''}">${fmt.vnd(r.closing)}</span>
        </td>
        <td data-label="Độ tin cậy"><span class="stamp ${c.stamp}">${fmt.esc(c.text)}</span></td>
      </tr>`;
    }).join('');
  }

  // ------------------------------------------------------------------
  // Drawer kỳ dự báo
  // ------------------------------------------------------------------
  function openDrawer(weekId) {
    const r = state.rows.filter(x => x.period.id === weekId)[0];
    if (!r) return;
    state.open = weekId;
    const p = r.period;
    const c = CONF[p.confidence];
    const o = p.outflow;
    const outT = r.outflow;

    $('#drawer-title').textContent = p.range + ' · ' + p.label;
    $('#drawer-body').innerHTML = `
      <div class="d-grid4">
        <div class="d-cell"><p class="k">Tổng thu</p><p class="v pos">${fmt.vnd(r.inflow)}</p></div>
        <div class="d-cell"><p class="k">Tổng chi</p><p class="v neg">${fmt.vnd(r.outflow)}</p></div>
        <div class="d-cell"><p class="k">Dòng tiền ròng</p><p class="v ${r.net < 0 ? 'neg' : 'pos'}">${r.net > 0 ? '+' : ''}${fmt.vnd(r.net)}</p></div>
        <div class="d-cell"><p class="k">Số dư cuối kỳ</p><p class="v ${r.under ? 'neg' : ''}">${fmt.vnd(r.closing)}</p></div>
      </div>

      <div class="d-block">
        <p class="detail-title">Nguồn thu trong kỳ</p>
        <div class="d-list">
          <div class="d-item"><div><strong>Thu theo cam kết</strong>
            <span class="code">${p.promisedFrom.length ? p.promisedFrom.length + ' hóa đơn đã xác nhận lịch' : 'Không có cam kết trong tuần'}</span></div>
            <span class="amt">${fmt.vnd(r.promised)}</span></div>
          <div class="d-item"><div><strong>Thu theo lịch</strong>
            <span class="code">Hóa đơn chưa tới hạn đến hạn trong tuần</span></div>
            <span class="amt">${fmt.vnd(r.scheduled)}</span></div>
          <div class="d-item"><div><strong>Thu hồi nợ quá hạn</strong>
            <span class="code">Ngoài cam kết, theo lịch đôn đốc</span></div>
            <span class="amt">${fmt.vnd(r.expected)}</span></div>
        </div>
      </div>

      ${p.promisedFrom.length ? `
      <div class="d-block">
        <p class="detail-title">Chi tiết cam kết thu</p>
        <div class="d-list">
          ${p.promisedFrom.map(i => `
            <div class="d-item">
              <div><strong>${fmt.esc(i.customer)}</strong>
                <span class="code">${fmt.esc(i.code)} · cam kết ${fmt.esc(i.date)}</span></div>
              <span class="amt">${fmt.vnd(i.amount)}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <div class="d-block">
        <p class="detail-title">Cơ cấu chi trong kỳ</p>
        <div class="d-bar">
          <span style="width:${(o.vendor / outT * 100).toFixed(1)}%;background:#B14A2B"></span>
          <span style="width:${(o.payroll / outT * 100).toFixed(1)}%;background:#8E2F1A"></span>
          <span style="width:${(o.tax / outT * 100).toFixed(1)}%;background:#C2612C"></span>
          <span style="width:${(o.other / outT * 100).toFixed(1)}%;background:#D3CCBD"></span>
        </div>
        <div class="d-bar-legend">
          <span><i style="background:#B14A2B"></i>Nhà cung cấp ${fmt.vnd(o.vendor)}</span>
          <span><i style="background:#8E2F1A"></i>Nhân sự ${fmt.vnd(o.payroll)}</span>
          <span><i style="background:#C2612C"></i>Thuế &amp; phí ${fmt.vnd(o.tax)}</span>
          <span><i style="background:#D3CCBD"></i>Khác ${fmt.vnd(o.other)}</span>
        </div>
      </div>

      <div class="d-block">
        <p class="detail-title">Ghi chú kỳ dự báo · độ tin cậy ${fmt.esc(c.text.toLowerCase())}</p>
        <div class="d-notes">
          ${p.notes.map(n => '<p class="d-note">' + fmt.esc(n) + '</p>').join('')}
        </div>
      </div>`;

    $('#drawer-foot').innerHTML = `
      <button class="btn btn--primary" type="button" data-drawer="adjust">Ghi nhận điều chỉnh</button>
      <button class="btn btn--ghost" type="button" data-drawer="export">Xuất kỳ này</button>`;

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
  // Tooltip biểu đồ
  // ------------------------------------------------------------------
  function bindChart() {
    const wrap = $('#chart-wrap');
    const tip = $('#chart-tip');
    $('#chart').addEventListener('mousemove', function (e) {
      const hit = e.target.closest('[data-week]');
      if (!hit) { tip.hidden = true; return; }
      const r = state.rows.filter(x => x.period.id === hit.dataset.week)[0];
      if (!r) { tip.hidden = true; return; }
      tip.innerHTML = `
        <p class="chart-tip-title">${fmt.esc(r.period.range)}</p>
        <div class="chart-tip-row"><b>Tiền vào</b><span>${fmt.vnd(r.inflow)}</span></div>
        <div class="chart-tip-row"><b>Tiền ra</b><span>${fmt.vnd(r.outflow)}</span></div>
        <div class="chart-tip-sep"></div>
        <div class="chart-tip-row"><b>Dòng ròng</b><span>${r.net > 0 ? '+' : ''}${fmt.vnd(r.net)}</span></div>
        <div class="chart-tip-row"><b>Số dư cuối kỳ</b><span>${fmt.vnd(r.closing)}</span></div>`;
      tip.hidden = false;
      const box = wrap.getBoundingClientRect();
      const x = e.clientX - box.left + 16;
      tip.style.left = Math.min(x, box.width - 236) + 'px';
      tip.style.top = Math.max(8, e.clientY - box.top - 20) + 'px';
    });
    $('#chart').addEventListener('mouseleave', () => { $('#chart-tip').hidden = true; });
    $('#chart').addEventListener('click', function (e) {
      const hit = e.target.closest('[data-week]');
      if (hit) openDrawer(hit.dataset.week);
    });
  }

  // ------------------------------------------------------------------
  // Render tổng
  // ------------------------------------------------------------------
  function renderAll() {
    computeRows();
    renderKPI();
    renderAlert();
    renderChart();
    renderComposition();
    renderTable();
  }

  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;
  }

  // ------------------------------------------------------------------
  // Sự kiện
  // ------------------------------------------------------------------
  function bind() {
    $$('.sc-btn').forEach(btn => btn.addEventListener('click', function () {
      state.scenario = this.dataset.scenario;
      $$('.sc-btn').forEach(b => b.classList.toggle('is-active', b === this));
      $('#sc-desc').textContent = state.data.scenarios[state.scenario].desc;
      renderAll();
      toast('Đã đổi kịch bản', 'Dự báo tính lại theo kịch bản ' +
        state.data.scenarios[state.scenario].label.toLowerCase() + '.', 'warn');
    }));

    $('#f-threshold').addEventListener('input', function () {
      const v = Number(this.value);
      state.threshold = (isNaN(v) || v < 0) ? 0 : v * M;
      renderAll();
    });

    $('#data-area').addEventListener('click', function (e) {
      const row = e.target.closest('tr[data-week]');
      if (row) openDrawer(row.dataset.week);
    });

    $('#drawer-close').addEventListener('click', closeDrawer);
    $('#drawer-overlay').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.open) closeDrawer();
    });
    $('#drawer-foot').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-drawer]');
      if (!btn) return;
      const r = state.rows.filter(x => x.period.id === state.open)[0];
      if (!r) return;
      if (btn.dataset.drawer === 'adjust') {
        toast('Đã ghi nhận điều chỉnh', r.period.range + ' · thay đổi sẽ được ghi vào nhật ký hoạt động.', 'warn');
      } else {
        toast('Đang tạo tệp xuất', 'Kỳ ' + r.period.range + ' sẽ sẵn sàng sau ít giây.', 'warn');
      }
    });

    $('#btn-export').addEventListener('click', () => {
      toast('Đang tạo tệp xuất', 'Dự báo 7 tuần · kịch bản ' +
        state.data.scenarios[state.scenario].label.toLowerCase() + '.', 'warn');
    });
    $('#btn-retry').addEventListener('click', load);
  }

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
  // Nạp dữ liệu
  // ------------------------------------------------------------------
  async function load() {
    state.loading = true; state.error = false;
    render();
    try {
      state.data = api.finance
        ? await api.finance.getCashflowForecast()
        : JSON.parse(JSON.stringify(MOCK.cashflowForecast));
    } catch (e) {
      state.error = true;
    } finally {
      state.loading = false;
      if (demoState === 'error') state.error = true;
      if (demoState === 'empty') state.empty = true;
      if (!state.error && !state.empty) {
        state.threshold = state.data.safetyThreshold;
        $('#f-threshold').value = Math.round(state.threshold / M);
        $('#head-horizon').textContent = state.data.horizon.split('·')[0].trim();
        $('#sc-desc').textContent = state.data.scenarios[state.scenario].desc;
        $$('.sc-btn').forEach(b => b.classList.toggle('is-active', b.dataset.scenario === state.scenario));
        renderAll();
      }
      render();
    }
  }

  (function init() {
    bind();
    bindChart();
    load();
  })();
})();