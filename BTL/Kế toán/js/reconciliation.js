/**
 * reconciliation.js — Trang "Đối soát công nợ"
 * Quy trình 5 bước có trạng thái: nhập sao kê → đối chiếu → xử lý lệch → xác nhận → hoàn tất.
 * Mọi thay đổi trạng thái đi qua hộp thoại xác nhận và ghi nhật ký hành động.
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
  const demoState = params.get('state');   // loading | empty | error | conflict

  const state = {
    step: 1,
    loading: true,
    error: false,
    empty: demoState === 'empty',
    mfilter: 'all',
    data: null
  };

  // ------------------------------------------------------------------
  // Toast
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
  // Modal
  // ------------------------------------------------------------------
  function openModal(opts) {
    return new Promise(resolve => {
      const modal = $('#modal');
      $('#modal-title').textContent = opts.title || 'Xác nhận';
      $('#modal-desc').innerHTML = opts.html || fmt.esc(opts.message || '');
      $('#modal-ok').textContent = opts.okText || 'Xác nhận';
      $('#modal-ok').className = 'btn ' + (opts.danger ? 'btn--danger' : 'btn--primary');
      $('#modal-cancel').textContent = opts.cancelText || 'Hủy bỏ';

      $('#modal-resolve').hidden = opts.mode !== 'resolve';
      $('#modal-import').hidden = opts.mode !== 'import';
      $('#modal-agree').hidden = opts.mode !== 'agree';
      if (opts.mode === 'agree') { $('#m-agree').checked = false; $('#modal-ok').disabled = true; }
      else $('#modal-ok').disabled = false;

      modal.hidden = false;
      if (opts.onOpen) opts.onOpen();
      setTimeout(() => {
        const first = modal.querySelector('.modal-form:not([hidden]) .input, .modal-form:not([hidden]) input');
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
        if (opts.mode === 'resolve' && !$('#m-note').value.trim()) {
          $('#note-error').hidden = false;
          $('#m-note').classList.add('is-invalid');
          $('#m-note').focus();
          return;
        }
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

  if ($('#m-agree')) {
    $('#m-agree').addEventListener('change', e => { $('#modal-ok').disabled = !e.target.checked; });
  }

  // ------------------------------------------------------------------
  // Stepper
  // ------------------------------------------------------------------
  function renderStepper() {
    $$('#stepper .step').forEach(li => {
      const n = parseInt(li.dataset.step, 10);
      li.classList.toggle('is-done', n < state.step);
      li.classList.toggle('is-current', n === state.step);
      li.querySelector('.step-btn').setAttribute('aria-current', n === state.step ? 'step' : 'false');
    });
    $$('.step-panel').forEach(p => {
      p.hidden = parseInt(p.dataset.panel, 10) !== state.step;
    });
  }

  function goStep(n) {
    state.step = n;
    renderStepper();
    render();
    $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ------------------------------------------------------------------
  // Step 1 — sao kê
  // ------------------------------------------------------------------
  function renderStatement() {
    const d = state.data;
    if (!d) return;
    $('#s-file').textContent = d.statement.file;
    $('#s-meta').textContent = d.statement.bank + ' · Kỳ ' + d.period.replace('-', '/') +
      ' · Nạp bởi ' + d.statement.uploadedBy;
    $('#s-rows').textContent = d.statement.rows;
    $('#s-debit').textContent = fmt.vnd(d.statement.debitTotal);
    $('#s-credit').textContent = fmt.vnd(d.statement.creditTotal);
    $('#s-at').textContent = d.statement.uploadedAt;

    const rows = d.matches.slice(0, 5).map(m => m.bank.ref === '—'
      ? { date: m.ledger.date, ref: '—', content: 'Chưa tìm thấy dòng tương ứng', amount: 0, zero: true }
      : { date: m.bank.date, ref: m.bank.ref, content: m.bank.content, amount: m.bank.amount, zero: false });

    $('#preview-body').innerHTML = rows.map(r => `
      <tr>
        <td class="mono">${fmt.esc(r.date)}</td>
        <td class="mono">${fmt.esc(r.ref)}</td>
        <td>${fmt.esc(r.content)}</td>
        <td class="num mono"${r.zero ? ' style="color:var(--sienna)"' : ''}>${r.zero ? '—' : fmt.vnd(r.amount)}</td>
      </tr>`).join('');
  }

  // ------------------------------------------------------------------
  // Step 2 — cầu ghép
  // ------------------------------------------------------------------
  function renderBridge() {
    const d = state.data;
    if (!d) return;
    $('#k-total').textContent = d.summary.matched + d.summary.partial + d.summary.unmatched;
    $('#k-matched').textContent = d.summary.matched;
    $('#k-partial').textContent = d.summary.partial;
    $('#k-unmatched').textContent = d.summary.unmatched;
    $('#k-rate').textContent = String(d.summary.rate).replace('.', ',') + '%';
    $('#k-meter').style.width = d.summary.rate + '%';

    const list = d.matches.filter(m => state.mfilter === 'all' || m.status === state.mfilter);
    $('#bridge-empty').hidden = list.length > 0;

    $('#bridge-list').innerHTML = list.map(m => {
      const conf = m.status === 'unmatched' ? '!' : m.confidence + '%';
      return `
      <div class="bridge is-${m.status}">
        <div class="bridge-side">
          <p class="bs-ref">${fmt.esc(m.ledger.ref)} · ${fmt.esc(m.ledger.date)}</p>
          <p class="bs-party">${fmt.esc(m.ledger.party)}</p>
          <p class="bs-amount">${fmt.vnd(m.ledger.amount)}</p>
        </div>

        <div class="bridge-link">
          <span class="link-dot"></span>
          <span class="link-line"></span>
          <span class="link-chip">${conf}</span>
          <span class="link-line"></span>
          <span class="link-dot"></span>
        </div>

        <div class="bridge-side right">
          <p class="bs-ref">${fmt.esc(m.bank.ref)}${m.bank.ref !== '—' ? ' · ' + fmt.esc(m.bank.date) : ''}</p>
          <p class="bs-party">${fmt.esc(m.bank.content)}</p>
          ${m.bank.amount
            ? '<p class="bs-amount">' + fmt.vnd(m.bank.amount) + '</p>'
            : '<p class="bs-amount is-zero">không có dòng tương ứng</p>'}
        </div>
      </div>`;
    }).join('');

    const open = d.exceptions.filter(e => e.status === 'open').length;
    const el = $('#open-ex');
    if (el) el.textContent = open;
  }

  // ------------------------------------------------------------------
  // Step 3 — lệch lệch & thanh phân kỳ
  // ------------------------------------------------------------------
  function renderExceptions() {
    const d = state.data;
    if (!d) return;

    const open = d.exceptions.filter(e => e.status === 'open');
    const abs = d.exceptions.reduce((s, e) => s + Math.abs(e.diff), 0);
    const net = d.exceptions.reduce((s, e) => s + e.diff, 0);

    $('#d-count').textContent = open.length;
    $('#d-abs').textContent = fmt.vnd(abs);
    const netEl = $('#d-net');
    netEl.textContent = (net > 0 ? '+' : net < 0 ? '−' : '') + fmt.vnd(Math.abs(net));
    netEl.className = 'ds-value mono ' + (net > 0 ? 'is-over' : 'is-under');

    const max = Math.max.apply(null, d.exceptions.map(e => Math.abs(e.diff)).concat([1]));
    $('#exc-empty').hidden = open.length > 0;

    $('#exc-body').innerHTML = d.exceptions.map(e => {
      const pct = Math.max(2, Math.round(Math.abs(e.diff) / max * 50));
      const barCls = e.diff > 0 ? 'is-over' : e.diff < 0 ? 'is-under' : 'is-flat';
      const numCls = e.diff > 0 ? 'is-over' : e.diff < 0 ? 'is-under' : 'is-flat';
      const label = e.diff > 0 ? '+' + fmt.vnd(e.diff) : e.diff < 0 ? '−' + fmt.vnd(Math.abs(e.diff)) : 'không lệch số';
      return `
      <tr class="${e.status === 'open' ? 'is-open' : 'is-resolved'}">
        <td class="e-type"><span class="type-tag">${fmt.esc(e.type)}</span></td>
        <td class="e-ref mono">${fmt.esc(e.ref)}</td>
        <td class="e-party">
          <span class="bs-party" style="margin:0">${fmt.esc(e.party)}</span>
          <span class="bs-ref">${fmt.esc(e.note)}</span>
        </td>
        <td class="e-delta"><span class="delta-num ${numCls}">${label}</span></td>
        <td class="e-bar">
          <div class="delta"><span class="delta-zero"></span>
            <span class="delta-bar ${barCls}" style="width:${e.diff === 0 ? 0 : pct}%"></span></div>
        </td>
        <td class="e-status">
          ${e.status === 'open'
            ? '<span class="stamp stamp--danger">Chưa xử lý</span>'
            : '<span class="stamp stamp--success">Đã xử lý</span>'}
        </td>
        <td class="e-act">
          <div class="row-acts">
            ${e.status === 'open'
              ? '<button class="link-btn" data-resolve="' + e.id + '">Xử lý</button>'
              : '<span class="bs-ref" title="' + fmt.esc(e.resolution + ' · ' + e.resolvedBy) + '">Chi tiết</span>'}
          </div>
        </td>
      </tr>`;
    }).join('');

    const hint = $('#exc-hint');
    if (open.length === 0) {
      hint.innerHTML = 'Toàn bộ lệch lệch đã được xử lý — có thể khóa sổ.';
    } else {
      hint.innerHTML = 'Còn <b>' + open.length + '</b> dòng chưa xử lý — cần xử lý toàn bộ trước khi khóa sổ.';
    }
  }

  // ------------------------------------------------------------------
  // Step 4 — danh mục kiểm tra
  // ------------------------------------------------------------------
  function renderChecklist() {
    const d = state.data;
    if (!d) return;
    const open = d.exceptions.filter(e => e.status === 'open').length;
    const items = [
      { cls: 'ok', title: 'Sao kê ngân hàng đã nạp đủ', sub: d.statement.rows + ' dòng · tệp ' + d.statement.file },
      { cls: d.summary.unmatched > 0 ? 'warn' : 'ok', title: 'Tỷ lệ đối chiếu tự động', sub: d.summary.rate + '% — còn ' + d.summary.unmatched + ' dòng chưa khớp' },
      { cls: open === 0 ? 'ok' : 'bad', title: 'Lệch lệch đã xử lý', sub: open === 0 ? 'Toàn bộ đã xử lý' : 'Còn ' + open + ' dòng chưa xử lý' },
      { cls: 'ok', title: 'Tổng tiền khớp sổ cái', sub: 'Chênh lệch còn lại ' + fmt.vnd(d.summary.diffAmount) },
      { cls: 'ok', title: 'Người xác nhận có quyền', sub: 'Trần Thị B · Trưởng phòng Tài chính' }
    ];
    $('#checklist').innerHTML = items.map(i => `
      <li class="${i.cls}">
        <span class="cl-mark">${i.cls === 'ok' ? '✓' : i.cls === 'warn' ? '!' : '×'}</span>
        <span class="cl-text">${fmt.esc(i.title)}<i>${fmt.esc(i.sub)}</i></span>
      </li>`).join('');
  }

  // ------------------------------------------------------------------
  // Trace
  // ------------------------------------------------------------------
  function renderTrace() {
    const d = state.data;
    if (!d) return;
    $('#trace').innerHTML = d.trace.map(t => `
      <div class="trace-item tone-${t.tone || 'info'}">
        <span class="trace-dot"></span>
        <p class="trace-time">${fmt.esc(t.time)}</p>
        <div class="trace-head">
          <span class="trace-action">${fmt.esc(t.action)}</span>
          <span class="trace-actor">bởi ${fmt.esc(t.actor)}</span>
        </div>
        ${t.note ? '<p class="trace-note">"' + fmt.esc(t.note) + '"</p>' : ''}
      </div>`).join('');
  }

  // ------------------------------------------------------------------
  // Render tổng
  // ------------------------------------------------------------------
  function render() {
    const loading = $('#state-loading'), error = $('#state-error'), empty = $('#state-empty');
    loading.hidden = !state.loading;
    error.hidden = !state.error;
    empty.hidden = !(state.empty && !state.loading && !state.error);
    $$('.step-panel').forEach(p => {
      p.hidden = state.loading || state.error || state.empty ||
        parseInt(p.dataset.panel, 10) !== state.step;
    });
    $('#trace').parentElement.hidden = state.loading || state.error || state.empty;

    if (state.loading || state.error || state.empty || !state.data) return;

    renderStatement();
    renderBridge();
    renderExceptions();
    renderChecklist();
    renderTrace();
  }

  // ------------------------------------------------------------------
  // Xử lý lệch lệch
  // ------------------------------------------------------------------
  async function resolveException(id) {
    const ex = state.data.exceptions.find(e => e.id === id);
    const res = await openModal({
      title: 'Xử lý lệch lệch ' + ex.ref,
      html: 'Sai khác <strong>' + fmt.esc(ex.type) + '</strong> với <strong>' + fmt.esc(ex.party) +
        '</strong>. Chọn cách xử lý và ghi rõ nguyên nhân để lưu vào biên bản đối soát.',
      okText: 'Ghi nhận xử lý',
      mode: 'resolve',
      collect: () => ({ resolution: $('#m-resolution').value, note: $('#m-note').value.trim() })
    });
    if (!res) return;

    try {
      const updated = api.reconciliation
        ? await api.reconciliation.resolveException(id, res)
        : await fakeResolve(id, res);
      const idx = state.data.exceptions.findIndex(e => e.id === id);
      state.data.exceptions[idx] = Object.assign({}, state.data.exceptions[idx], updated);
      state.data.trace.unshift({
        time: nowText(), actor: 'Trần Thị B', action: 'Xử lý lệch lệch ' + ex.ref,
        tone: 'warn', note: res.resolution + '. ' + res.note
      });
      render();
      toast('Đã xử lý lệch lệch', ex.ref + ' · ' + res.resolution + '.');
    } catch (err) {
      handleConflict(err, ex);
    }
  }

  function fakeResolve(id, res) {
    return new Promise((resolve, reject) => setTimeout(() => {
      const ex = state.data.exceptions.find(e => e.id === id);
      if (ex.stale) return reject({
        code: 'CONFLICT',
        message: 'Dòng ' + ex.ref + ' vừa được Lê Văn C xử lý lúc 14:05.'
      });
      resolve({ status: 'resolved', resolution: res.resolution, resolvedBy: 'Trần Thị B', resolvedAt: nowText() });
    }, 620));
  }

  // ------------------------------------------------------------------
  // Nhập sao kê
  // ------------------------------------------------------------------
  async function importStatement() {
    const data = await openModal({
      title: 'Nhập sao kê ngân hàng',
      html: 'Hệ thống sẽ ghi đè dữ liệu sao kê hiện tại của kỳ <strong>10/2026</strong> và chạy lại đối chiếu.',
      okText: 'Nạp và đối chiếu',
      mode: 'import',
      collect: () => ({ file: $('#m-file').value.trim(), bank: $('#m-bank').value })
    });
    if (!data || !data.file) return;

    toast('Đang nạp sao kê', data.file + ' · bắt đầu đối chiếu tự động.', 'warn');
    if (api.reconciliation) { try { await api.reconciliation.importStatement(data.file); } catch (e) {} }
    if (api.reconciliation) { try { await api.reconciliation.autoMatch(); } catch (e) {} }

    state.empty = false;
    state.data.statement.file = data.file;
    state.data.statement.bank = data.bank;
    state.data.trace.unshift({
      time: nowText(), actor: 'Nguyễn Văn A', action: 'Nhập sao kê ngân hàng', tone: 'info',
      note: 'Tệp ' + data.file + ' · 128 dòng.'
    });
    goStep(2);
    toast('Đã nạp sao kê', 'Đối chiếu tự động hoàn tất: 96/128 dòng khớp hoàn toàn.');
  }

  // ------------------------------------------------------------------
  // Xác nhận ghép sổ
  // ------------------------------------------------------------------
  async function confirmLedger() {
    const open = state.data.exceptions.filter(e => e.status === 'open').length;
    const res = await openModal({
      title: 'Xác nhận ghép sổ kỳ 10/2026?',
      html: 'Sau khi xác nhận, kỳ 10/2026 sẽ <strong>khóa sổ</strong> và không thể chỉnh sửa.' +
        (open > 0 ? '<br><strong style="color:var(--sienna)">Cảnh báo: còn ' + open + ' dòng lệch lệch chưa xử lý.</strong>' : '') +
        '<br>Thao tác này được ghi vào nhật ký hoạt động với đầy đủ thời gian và người thực hiện.',
      okText: 'Khóa sổ',
      mode: 'agree',
      collect: () => ({ agreed: true })
    });
    if (!res) return;

    try {
      const done = api.reconciliation
        ? await api.reconciliation.confirm('Kỳ 10/2026 khóa sổ.')
        : { code: 'GH-2026-10-001', at: nowText(), by: 'Trần Thị B' };

      if (demoState === 'conflict') throw {
        code: 'CONFLICT',
        message: 'Kỳ 10/2026 vừa được Lê Văn C chốt lúc 14:05.'
      };

      state.data.trace.unshift({
        time: nowText(), actor: 'Trần Thị B', action: 'Xác nhận ghép sổ', tone: 'ok',
        note: 'Kỳ 10/2026 khóa sổ.'
      });
      $('#f-code').textContent = done.code;
      $('#f-at').textContent = done.at;
      $('#f-by').textContent = done.by;
      goStep(5);
      toast('Ghép sổ hoàn tất', 'Chứng từ ' + done.code + ' đã được lưu.');
    } catch (err) {
      handleConflict(err);
    }
  }

  // ------------------------------------------------------------------
  // Xử lý xung đột
  // ------------------------------------------------------------------
  function handleConflict(err, item) {
    if (err && err.code === 'CONFLICT') {
      if (item) item.stale = true;
      $('#conflict-text').innerHTML =
        '<strong>' + fmt.esc(err.message) + '</strong> Thao tác của bạn bị hủy vì dựa trên dữ liệu cũ. ' +
        'Hãy tải lại để xem thay đổi trước khi tiếp tục.';
      $('#conflict-band').hidden = false;
      $('#conflict-band').scrollIntoView({ behavior: 'smooth', block: 'center' });
      render();
      return;
    }
    toast('Không hoàn tất được thao tác', (err && err.message) || 'Vui lòng thử lại.', 'error');
  }

  function nowText() {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' · ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  // ------------------------------------------------------------------
  // Gắn sự kiện
  // ------------------------------------------------------------------
  function bind() {
    // Stepper
    $('#stepper').addEventListener('click', e => {
      const li = e.target.closest('.step');
      if (li && !state.loading && !state.error) goStep(parseInt(li.dataset.step, 10));
    });

    // Điều hướng bước
    $('#panel').addEventListener('click', e => {
      const goto = e.target.closest('[data-goto]');
      if (goto) { goStep(parseInt(goto.dataset.goto, 10)); return; }

      const res = e.target.closest('[data-resolve]');
      if (res) { resolveException(res.dataset.resolve); return; }
    });

    // Bộ lọc mức khớp
    $$('[data-mfilter]').forEach(b => b.addEventListener('click', () => {
      $$('[data-mfilter]').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      state.mfilter = b.dataset.mfilter;
      renderBridge();
    }));

    // Nút
    $('#btn-import').addEventListener('click', importStatement);
    $('#btn-import-2').addEventListener('click', importStatement);
    $('#btn-replace').addEventListener('click', importStatement);
    $('#btn-confirm').addEventListener('click', confirmLedger);
    $('#btn-retry').addEventListener('click', load);
    $('#btn-rematch').addEventListener('click', async () => {
      toast('Đang chạy lại đối chiếu', 'Quét lại ' + state.data.statement.rows + ' dòng sao kê.', 'warn');
      if (api.reconciliation) { try { await api.reconciliation.autoMatch(); } catch (e) {} }
      state.data.trace.unshift({
        time: nowText(), actor: 'Hệ thống', action: 'Đối chiếu tự động', tone: 'ok',
        note: 'Khớp 96/128 dòng, tỷ lệ 90,6%.'
      });
      render();
      toast('Đối chiếu hoàn tất', 'Tỷ lệ khớp 90,6% — không đổi so với lần trước.');
    });
    $('#btn-export').addEventListener('click', () => {
      toast('Đang tạo biên bản', 'Biên bản đối soát kỳ 10/2026 sẽ được tải xuống trong ít giây.', 'warn');
    });
    $('#btn-cert').addEventListener('click', () => {
      toast('Đang tải biên bản', 'Chứng từ GH-2026-10-001.pdf đã sẵn sàng.', 'warn');
    });
    $('#conflict-reload').addEventListener('click', () => {
      $('#conflict-band').hidden = true;
      load();
      toast('Đã tải bản mới nhất', 'Hãy kiểm tra thay đổi trước khi thao tác lại.');
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
      state.data = api.reconciliation
        ? await api.reconciliation.get()
        : window.MOCK.reconciliation;
    } catch (e) {
      state.error = true;
    } finally {
      state.loading = false;
      if (demoState === 'error') state.error = true;
      render();
    }
  }

  (function init() {
    bind();
    load();
  })();
})();