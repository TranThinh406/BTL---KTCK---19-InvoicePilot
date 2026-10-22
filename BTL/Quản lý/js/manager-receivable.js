/**
 * manager-receivable.js — Tổng quan công nợ phải thu (vai trò Quản lý)
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
  const demoState = params.get('state');   // empty | error

  const state = { loading: true, error: false, empty: false, period: '10/2026', data: null };

  // ------------------------------------------------------------------
  // Định dạng
  // ------------------------------------------------------------------
  function shortVnd(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(2).replace('.', ',') + ' tỷ ₫';
    return (v / 1e6).toFixed(1).replace('.', ',') + ' triệu ₫';
  }
  function pct(part, whole) { return whole ? fmt.percent((part / whole) * 100) : '0%'; }
  function deltaText(d) {
    return (d > 0 ? '+' : '') + fmt.percent(d).replace('-', '−');
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
  // KPI
  // ------------------------------------------------------------------
  function renderKPI(o) {
    const d = o.deltas || {};
    const apprList = MOCK.DB.overdueCases || [];
    $('#kpi-row').innerHTML = `
      <article class="kpi">
        <p class="kpi-label">Tổng công nợ phải thu</p>
        <p class="kpi-value mono">${shortVnd(o.total)}</p>
        <p class="kpi-sub">${fmt.vnd(o.total)} · ${o.customerCount} khách hàng · ${o.invoiceCount} hóa đơn</p>
        <div class="kpi-bar" aria-hidden="true">
          <span class="seg seg--over" style="width:${(o.overdue / o.total * 100).toFixed(1)}%"></span>
          <span class="seg seg--soon" style="width:${(o.dueSoon / o.total * 100).toFixed(1)}%"></span>
          <span class="seg seg--later" style="width:${(o.later / o.total * 100).toFixed(1)}%"></span>
        </div>
        <p class="kpi-delta is-up">${deltaText(d.total)}
          <span class="delta-note">so với kỳ trước</span></p>
      </article>

      <article class="kpi kpi--alert">
        <p class="kpi-label">Đã quá hạn</p>
        <p class="kpi-value mono">${shortVnd(o.overdue)}</p>
        <p class="kpi-sub">${fmt.vnd(o.overdue)} · ${pct(o.overdue, o.total)} tổng công nợ · ${o.overdueCustomers} khách hàng</p>
        <div class="kpi-bar" aria-hidden="true">
          <span class="seg seg--over" style="width:${(o.overdue / o.total * 100).toFixed(1)}%"></span>
        </div>
        <p class="kpi-delta is-down">${deltaText(d.overdue)}
          <span class="delta-note">so với kỳ trước · xu hướng tốt</span></p>
      </article>

      <article class="kpi kpi--soon">
        <p class="kpi-label">Đến hạn trong 7 ngày</p>
        <p class="kpi-value mono">${shortVnd(o.dueSoon)}</p>
        <p class="kpi-sub">${fmt.vnd(o.dueSoon)} · ${pct(o.dueSoon, o.total)} tổng công nợ</p>
        <div class="kpi-bar" aria-hidden="true">
          <span class="seg seg--soon" style="width:${(o.dueSoon / o.total * 100).toFixed(1)}%"></span>
        </div>
        <p class="kpi-delta is-up">${deltaText(d.dueSoon)}
          <span class="delta-note">so với kỳ trước · cần theo sát</span></p>
      </article>

      <article class="kpi">
        <p class="kpi-label">Hồ sơ chờ tôi phê duyệt</p>
        <p class="kpi-value mono">${o.pendingApprovals}</p>
        <p class="kpi-sub">Giá trị liên quan ${fmt.vnd(o.pendingValue)}</p>
        <div class="kpi-dots" aria-hidden="true">
          ${Array.apply(null, Array(o.pendingApprovals)).map(() => '<i></i>').join('')}
        </div>
        <a class="kpi-link" href="manager-pending-approvals.html">
          Xử lý ${o.pendingApprovals} hồ sơ →
        </a>
      </article>`;
  }

  // ------------------------------------------------------------------
  // Dải mục tiêu thu hồi
  // ------------------------------------------------------------------
  function renderTarget(o) {
    const rate = o.target ? Math.round((o.collected / o.target) * 100) : 0;
    $('#t-pct').textContent = rate + '%';
    $('#t-value').textContent = fmt.vnd(o.collected) + ' / ' + fmt.vnd(o.target);
    $('#t-note').innerHTML = 'Còn <strong>' + o.daysLeft + ' ngày làm việc</strong> trong kỳ ' +
      fmt.esc(o.period) + ' — cần thu thêm ' + fmt.vnd(Math.max(0, o.target - o.collected)) + '.';
    $('#t-fill').style.width = Math.min(100, rate) + '%';

    const need = Math.max(0, o.target - o.collected);
    $('#t-weekly').textContent = o.daysLeft
      ? 'Bình quân mỗi tuần còn lại: ' + fmt.vnd(Math.round(need / Math.max(1, Math.ceil(o.daysLeft / 5))))
      : 'Kỳ đã đóng';

    const max = Math.max.apply(null, o.targetWeeks.map(w => w.amount).concat([1]));
    $('#t-weeks').innerHTML = o.targetWeeks.map(w => `
      <div class="week ${w.current ? 'is-current' : ''}">
        <span class="week-bar" style="height:${Math.max(6, Math.round(w.amount / max * 74))}px"></span>
        <span class="week-amount">${(w.amount / 1e6).toFixed(0)}tr</span>
        <span class="week-label">${fmt.esc(w.label)}${w.current ? ' ·' : ''}</span>
      </div>`).join('');
  }

  // ------------------------------------------------------------------
  // Tuổi nợ + lịch đáo hạn
  // ------------------------------------------------------------------
  function renderAging(o) {
    const total = o.aging.reduce((s, b) => s + b.amount, 0);
    const max = Math.max.apply(null, o.aging.map(b => b.amount).concat([1]));
    $('#aging-total').textContent = 'Tổng ' + fmt.vnd(total);

    $('#aging-rows').innerHTML = o.aging.map((b, i) => {
      const isRoll = b.label === '61–90 ngày';
      return `
      <div class="aging-row">
        <div class="aging-key">
          <span class="aging-label">${fmt.esc(b.label)}</span>
          <span class="aging-count mono">${b.customers} khách · ${b.invoices} hóa đơn</span>
        </div>
        <div class="aging-track">
          <span class="aging-fill risk-${b.risk}" data-w="${(b.amount / max * 100).toFixed(1)}"></span>
        </div>
        <div class="aging-num">
          <span class="aging-amount mono">${fmt.vnd(b.amount)}</span>
          <span class="aging-pct mono">${pct(b.amount, total)}</span>
        </div>
        <div class="aging-share mono">${pct(b.amount, o.total)}</div>
        ${isRoll ? '<div class="aging-roll"><span class="roll-arrow">↳ 30 ngày nữa sẽ chuyển lên nhóm "Trên 90 ngày"</span></div>' : ''}
      </div>`;
    }).join('');

    const rolling = o.aging.find(b => b.label === '61–90 ngày');
    const severe = o.aging.find(b => b.risk === 'severe');
    $('#aging-note').innerHTML =
      '<strong>' + fmt.vnd(rolling.amount) + '</strong> đang ở nhóm 61–90 ngày (' +
      pct(rolling.amount, total) + ' nợ quá hạn). Nếu không thu được trong 30 ngày tới, toàn bộ số này ' +
      'sang nhóm trên 90 ngày — nâng nợ khó đòi lên <strong>' +
      fmt.vnd(rolling.amount + severe.amount) + '</strong>. Ưu tiên Bình Minh (98 triệu) và Thiên Hà (75 triệu).';

    // Lịch đáo hạn
    const maxDue = Math.max.apply(null, o.dueSchedule.map(r => r.amount).concat([1]));
    $('#due-total').textContent = 'Tổng ' + fmt.vnd(o.dueSchedule.reduce((s, r) => s + r.amount, 0));
    $('#due-rows').innerHTML = o.dueSchedule.map(r => `
      <div class="due-row">
        <div>
          <p class="due-label">${fmt.esc(r.label)}</p>
          <p class="due-note">${fmt.esc(r.note)}</p>
        </div>
        <div class="due-track">
          <span class="due-fill" data-w="${(r.amount / maxDue * 100).toFixed(1)}"></span>
        </div>
        <p class="due-amount mono">${fmt.vnd(r.amount)}</p>
      </div>`).join('');

    // Chạy hoạt ảnh thanh
    requestAnimationFrame(() => {
      $$('.aging-fill, .due-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
    });
  }

  // ------------------------------------------------------------------
  // Hồ sơ chờ duyệt & cảnh báo
  // ------------------------------------------------------------------
  function statusStamp(item) {
    if (item.status === 'wait') return '<span class="stamp stamp--warn">Chờ duyệt</span>';
    if (item.status === 'progress') return '<span class="stamp stamp--info">Đang xử lý</span>';
    return '<span class="stamp stamp--danger">Giữ nhắc nợ</span>';
  }

  function renderApprovals() {
    const list = (MOCK.DB.overdueCases || []).slice(0, 3);
    $('#appr-list').innerHTML = list.map(c => `
      <a class="appr-item" href="manager-pending-approvals.html#${fmt.esc(c.id)}">
        <div class="appr-top">
          <span class="appr-name">${fmt.esc(c.name)}</span>
          <span class="appr-amount mono">${fmt.vnd(c.amount)}</span>
        </div>
        <p class="appr-desc">${fmt.esc(c.issue)} — ${fmt.esc(c.detail)}</p>
        <div class="appr-foot">
          ${statusStamp(c)}
          <span class="appr-time">Cập nhật ${fmt.esc(c.updated)}</span>
        </div>
      </a>`).join('') || '<p class="followup-empty" style="padding:16px 15px">Không có hồ sơ nào chờ duyệt.</p>';
  }

  function renderAlerts() {
    const list = (MOCK.DB.receivableAlerts || []).slice(0, 3);
    $('#alert-list').innerHTML = list.map(a => `
      <a class="alert-item" href="manager-alerts.html#${fmt.esc(a.id)}">
        <div class="alert-top">
          <span class="alert-title">${fmt.esc(a.title)}</span>
          <span class="stamp ${a.level === 'Cần phê duyệt' ? 'stamp--danger'
            : a.level === 'Cảnh báo' ? 'stamp--warn' : 'stamp--info'}">${fmt.esc(a.level)}</span>
        </div>
        <p class="alert-msg">${fmt.esc(a.message)}</p>
      </a>`).join('') || '<p class="followup-empty" style="padding:16px 15px">Không có cảnh báo nào.</p>';
  }

  // ------------------------------------------------------------------
  // Top khách hàng quá hạn
  // ------------------------------------------------------------------
  function renderTop(o) {
    $('#top-rows').innerHTML = o.topOverdue.map(c => `
      <tr>
        <td>
          <a href="../../Kinh%20doanh/html/sales-customer-detail.html?id=${fmt.esc(c.code)}">
            <p class="cus-name">${fmt.esc(c.name)}</p>
            <p class="cus-code">${fmt.esc(c.code)} · ${fmt.esc(c.owner)}</p>
          </a>
        </td>
        <td class="num"><span class="num-mono">${fmt.vnd(c.balance)}</span></td>
        <td class="num"><span class="overdue-amt">${fmt.vnd(c.overdue)}</span></td>
        <td><span class="num-mono">${fmt.esc(c.dueAt)}</span></td>
        <td class="num"><span class="num-mono">${c.daysLate} ngày</span></td>
        <td>
          <span class="promise ${c.promise.indexOf('Chưa') === 0 ? 'promise--none' : ''}">${fmt.esc(c.promise)}</span>
        </td>
        <td>
          <span class="stamp ${c.riskLevel === 'severe' ? 'stamp--danger'
            : c.riskLevel === 'high' ? 'stamp--danger'
            : c.riskLevel === 'mid' ? 'stamp--warn' : 'stamp--info'}">${fmt.esc(c.risk)}</span>
        </td>
      </tr>`).join('');
  }

  // ------------------------------------------------------------------
  // Hiệu quả theo nhân viên & ghi chú
  // ------------------------------------------------------------------
  function renderCollectors(o) {
    const max = Math.max.apply(null, o.collectors.map(c => c.overdue).concat([1]));
    $('#collector-total').textContent = 'Tổng quá hạn ' + fmt.vnd(o.collectors.reduce((s, c) => s + c.overdue, 0));
    $('#collector-rows').innerHTML = `
      <div class="collector-legend">
        <span><i class="dot dot--red"></i>Nợ quá hạn</span>
        <span><i class="dot dot--ok"></i>Đã thu trong kỳ</span>
      </div>` + o.collectors.map(c => {
        const over = (c.overdue / max * 100).toFixed(1);
        const paid = Math.min(over, (c.collected / max * 100).toFixed(1));
        return `
      <div class="collector-row">
        <div>
          <p class="collector-name">${fmt.esc(c.name)}</p>
          <p class="collector-meta">${c.customers} khách · ${c.reminders} nhắc nợ</p>
        </div>
        <div class="collector-track">
          <span class="collector-fill" data-w="${over}"></span>
          <span class="collector-paid" data-w="${paid}"></span>
        </div>
        <div class="collector-num">
          <span class="collector-over mono">${fmt.vnd(c.overdue)}</span>
          <span class="collector-collected mono">thu ${fmt.vnd(c.collected)}</span>
        </div>
        <div class="collector-rate mono">${c.responseRate}% phản hồi</div>
      </div>`;
      }).join('');

    requestAnimationFrame(() => {
      $$('.collector-fill, .collector-paid').forEach(el => { el.style.width = el.dataset.w + '%'; });
    });
  }

  function renderFollowups() {
    const list = MOCK.DB.followups || [];
    $('#followup-list').innerHTML = list.map(f => `
      <article class="followup">
        <p class="followup-title">${fmt.esc(f.customerName)}</p>
        <p class="followup-note">"${fmt.esc(f.note)}"</p>
        <p class="followup-foot">Ghi nhận ${fmt.esc(f.createdAt || f.updatedAt || 'trong kỳ 10/2026')} · ${fmt.esc(f.userName || 'Nhân viên kinh doanh')}</p>
      </article>`).join('') || '<p class="followup-empty">Chưa có ghi chú thu hồi nào trong kỳ.</p>';
  }

  // ------------------------------------------------------------------
  // Render & sự kiện
  // ------------------------------------------------------------------
  function render() {
    $('#state-loading').hidden = !state.loading;
    $('#state-error').hidden = !state.error;
    $('#state-empty').hidden = !(state.empty && !state.loading && !state.error);
    $('#data-area').hidden = state.loading || state.error || state.empty;
    if (state.loading || state.error || state.empty || !state.data) return;

    const o = state.data;
    renderKPI(o);
    renderTarget(o);
    renderAging(o);
    renderApprovals();
    renderAlerts();
    renderTop(o);
    renderCollectors(o);
    renderFollowups();

    $('#head-period').textContent = 'Kỳ ' + o.period;
    $('#period-label').textContent = 'Kỳ ' + o.period;
    $('#head-sub').textContent = 'Toàn bộ ' + o.customerCount + ' khách hàng · vai trò Quản lý';
    $('#head-updated').textContent = 'Cập nhật ' + o.updatedAt;
  }

  function bind() {
    // Menu kỳ dữ liệu
    const btn = $('#period-btn'), menu = $('#period-menu');
    btn.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', e => {
      if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    $$('#period-menu .pop-item').forEach(item => {
      item.addEventListener('click', () => {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        state.period = item.dataset.period;
        load();
        toast('Đã đổi kỳ dữ liệu', 'Số liệu công nợ được tổng hợp theo ' + item.textContent + '.');
      });
    });

    $('#btn-export').addEventListener('click', () => {
      toast('Đang tạo báo cáo', 'Tệp "Công nợ phải thu ' + state.period + '" sẽ sẵn sàng sau ít giây.', 'warn');
    });
    $('#btn-retry').addEventListener('click', load);
    $('#btn-empty-period').addEventListener('click', () => {
      state.period = '09/2026';
      state.empty = false;
      load();
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
      state.data = api.receivable
        ? await api.receivable.getOverview(state.period)
        : JSON.parse(JSON.stringify(window.MOCK.receivableOverview));
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
    bind();
    load();
  })();
})();