/**
 * api.js — API giả lập cho InvoicePilot
 * Đặc điểm:
 *  - Tất cả hàm trả về Promise (giống fetch thật) → sau này thay backend chỉ cần đổi thân hàm
 *  - Có độ trễ mô phỏng, có thể bật lỗi ngẫu nhiên để test trạng thái lỗi
 *  - Validate đúng theo wireframe Page 04
 */
(function () {
  'use strict';

  const DB = window.MOCK.DB;
  const T = window.MOCK._internals;
  const TODAY = window.MOCK.TODAY;

  // -----------------------------------------------------------------------
  // Cấu hình giả lập
  // -----------------------------------------------------------------------
  const config = { minLatency: 150, maxLatency: 500, errorRate: 0 };

  function delay() {
    const ms = config.minLatency + Math.random() * (config.maxLatency - config.minLatency);
    return new Promise(res => setTimeout(res, ms));
  }
  function fail(message, code) {
    const e = new Error(message);
    e.code = code || 'BAD_REQUEST';
    throw e;
  }
  function ok(data) { return JSON.parse(JSON.stringify(data)); }

  function nextId(list, prefix, pad) {
    const max = list.reduce((m, x) => {
      const n = parseInt(String(x.id).replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return prefix + String(max + 1).padStart(pad || 4, '0');
  }

  /** Bộ lọc + sắp xếp + phân trang dùng chung cho mọi list */
  function query(list, opts) {
    opts = opts || {};
    let rows = list.slice();

    if (opts.q) {
      const q = String(opts.q).toLowerCase().trim();
      rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
    }
    if (opts.status != null) {
      const st = [].concat(opts.status).filter(status => status !== '');
      if (st.length) rows = rows.filter(r => st.includes(r.status));
    }
    if (opts.customerId) rows = rows.filter(r => r.customerId === opts.customerId);
    if (opts.from) rows = rows.filter(r => (r.issueDate || r.date || r.time || '') >= opts.from);
    if (opts.to) rows = rows.filter(r => (r.issueDate || r.date || r.time || '') <= opts.to);

    if (opts.sort) {
      const [field, dir] = String(opts.sort).split(':');
      rows.sort((a, b) => {
        const x = a[field], y = b[field];
        if (x === y) return 0;
        return (x > y ? 1 : -1) * (dir === 'desc' ? -1 : 1);
      });
    }

    const page = Math.max(1, opts.page || 1);
    const pageSize = opts.pageSize || 10;
    const total = rows.length;
    return {
      items: ok(rows.slice((page - 1) * pageSize, page * pageSize)),
      total, page, pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  // -----------------------------------------------------------------------
  // Validate hóa đơn (khớp wireframe Page 04)
  // -----------------------------------------------------------------------
  function validateInvoice(data, isUpdate) {
    const errors = {};
    if (!data.code || !String(data.code).trim()) errors.code = 'Số hóa đơn là bắt buộc.';
    else {
      const dup = DB.invoices.some(i => i.code === data.code && i.id !== data.id);
      if (dup) errors.code = 'Số hóa đơn đã tồn tại.';
    }
    if (!data.customerId) errors.customerId = 'Phải chọn khách hàng.';
    if (!data.issueDate) errors.issueDate = 'Ngày phát hành là bắt buộc.';
    else if (data.issueDate > TODAY) errors.issueDate = 'Ngày phát hành không được lớn hơn hôm nay.';

    const term = data.termDays != null ? data.termDays
      : T.daysBetween(data.issueDate, data.dueDate);
    if (!data.dueDate) errors.dueDate = 'Hạn thanh toán là bắt buộc.';
    else if (!(term > 0)) errors.dueDate = 'Hạn thanh toán phải sau ngày phát hành.';
    else if (term > 180) errors.dueDate = 'Kỳ hạn tối đa 180 ngày.';

    if (!Array.isArray(data.items) || data.items.length === 0) {
      errors.items = 'Hóa đơn cần ít nhất 1 dòng hàng.';
    } else {
      data.items.forEach((it, i) => {
        if (!it.name || !it.name.trim()) errors['items.' + i + '.name'] = 'Tên hàng/dịch vụ là bắt buộc.';
        if (!(it.qty > 0) || !Number.isInteger(Number(it.qty))) errors['items.' + i + '.qty'] = 'Số lượng phải là số nguyên dương.';
        if (it.unitPrice == null || isNaN(it.unitPrice) || it.unitPrice < 0) errors['items.' + i + '.unitPrice'] = 'Đơn giá không hợp lệ.';
        else if (String(Math.round(it.unitPrice)).length > 12) errors['items.' + i + '.unitPrice'] = 'Đơn giá tối đa 12 chữ số.';
      });
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  // =======================================================================
  // API
  // =======================================================================
  const api = {

    // ---------- Cấu hình demo ----------
    setLatency(min, max) { config.minLatency = min; config.maxLatency = max || min; },
    setErrorRate(rate) { config.errorRate = rate; },
    getToday() { return TODAY; },
    getCurrentUser() { return ok(DB.users.find(u => u.id === window.MOCK.CURRENT_USER_ID)); },

    // ---------- Auth (demo) ----------
    auth: {
      async login(email, password) {
        await delay();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) fail('Email không đúng định dạng.', 'INVALID_EMAIL');
        if (!password || password.length < 8) fail('Mật khẩu tối thiểu 8 ký tự.', 'INVALID_PASSWORD');
        const user = DB.users.find(u => u.email === email) || DB.users[0];
        if (user.status === 'disabled') fail('Tài khoản đã bị vô hiệu hóa.', 'DISABLED');
        return ok({ token: 'mock-token-' + Date.now(), user });
      },
      async loginAs(role) {
        await delay();
        const user = DB.users.find(u => u.role === role && u.status === 'active') || DB.users[0];
        return ok({ token: 'mock-token-' + Date.now(), user });
      },
      async forgotPassword(email) { await delay(); return ok({ sent: true, email }); },
      async verifyOtp(code) {
        await delay();
        if (!/^\d{6}$/.test(code)) fail('Mã xác thực gồm 6 chữ số.', 'INVALID_OTP');
        return ok({ verified: true });
      }
    },

    // ---------- Hóa đơn ----------
    invoices: {
      async list(opts) {
        await delay();
        if (Math.random() < config.errorRate) fail('Không tải được danh sách hóa đơn.', 'SERVER');
        return query(DB.invoices, Object.assign({ sort: 'issueDate:desc' }, opts));
      },

      async get(codeOrId) {
        await delay();
        const inv = DB.invoices.find(i => i.id === codeOrId || i.code === codeOrId);
        if (!inv) fail('Không tìm thấy hóa đơn.', 'NOT_FOUND');
        return ok(inv);
      },

      /** data: {code, customerId, issueDate, dueDate, taxRate, items[], note} */
      async create(data) {
        await delay();
        const v = validateInvoice(data);
        if (!v.valid) { const e = new Error('Dữ liệu không hợp lệ.'); e.code = 'VALIDATION'; e.errors = v.errors; throw e; }

        const inv = {
          id: nextId(DB.invoices, 'INV-'),
          code: data.code,
          customerId: data.customerId,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          orderCode: data.orderCode || '',
          taxRate: data.taxRate != null ? data.taxRate : DB.settings.defaultTaxRate,
          currency: data.currency || 'VND',
          status: data.status || 'draft',
          note: data.note || '',
          attachments: data.attachments || [],
          createdBy: window.MOCK.CURRENT_USER_ID,
          createdAt: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
          updatedAt: TODAY + ' ' + new Date().toTimeString().slice(0, 5),
          history: [{ at: TODAY, action: 'Tạo hóa đơn', userId: window.MOCK.CURRENT_USER_ID }],
          items: data.items.map((it, i) => ({
            lineId: 'L' + (i + 1), name: it.name,
            qty: Number(it.qty), unitPrice: Number(it.unitPrice),
            discountPct: Number(it.discountPct || 0)
          }))
        };
        DB.invoices.unshift(T.normalizeInvoice(inv, DB.payments));
        DB.activityLogs.unshift({
          id: nextId(DB.activityLogs, 'LOG-', 3), time: TODAY + ' 00:00',
          userId: window.MOCK.CURRENT_USER_ID, action: 'Tạo hóa đơn',
          targetType: 'invoice', targetCode: inv.code, ip: '10.0.0.5', meta: {}
        });
        return ok(DB.invoices[0]);
      },

      async update(codeOrId, patch) {
        await delay();
        const idx = DB.invoices.findIndex(i => i.id === codeOrId || i.code === codeOrId);
        if (idx < 0) fail('Không tìm thấy hóa đơn.', 'NOT_FOUND');
        const current = DB.invoices[idx];
        if (current.status === 'paid') fail('Hóa đơn đã thu đủ, không thể chỉnh sửa.', 'LOCKED');

        const merged = Object.assign({}, current, patch, { id: current.id });
        const v = validateInvoice(merged, true);
        if (!v.valid) { const e = new Error('Dữ liệu không hợp lệ.'); e.code = 'VALIDATION'; e.errors = v.errors; throw e; }

        merged.updatedAt = TODAY;
        merged.history = (current.history || []).concat([{
          at: TODAY, action: 'Cập nhật hóa đơn', userId: window.MOCK.CURRENT_USER_ID
        }]);
        DB.invoices[idx] = T.normalizeInvoice(merged, DB.payments);
        return ok(DB.invoices[idx]);
      },

      async issue(codeOrId) {
        await delay();
        const inv = DB.invoices.find(i => i.id === codeOrId || i.code === codeOrId);
        if (!inv) fail('Không tìm thấy hóa đơn.', 'NOT_FOUND');
        if (inv.status !== 'draft') fail('Chỉ hóa đơn Nháp mới được phát hành.', 'INVALID_STATE');
        inv.status = 'issued';
        inv.history.push({ at: TODAY, action: 'Phát hành hóa đơn', userId: window.MOCK.CURRENT_USER_ID });
        return ok(T.normalizeInvoice(inv, DB.payments));
      },

      async cancel(codeOrId, reason) {
        await delay();
        const inv = DB.invoices.find(i => i.id === codeOrId || i.code === codeOrId);
        if (!inv) fail('Không tìm thấy hóa đơn.', 'NOT_FOUND');
        if (inv.paidAmount > 0) fail('Hóa đơn đã có thanh toán, không thể hủy.', 'HAS_PAYMENT');
        if (!reason || reason.trim().length < 10) fail('Phải nhập lý do hủy (tối thiểu 10 ký tự).', 'VALIDATION');
        inv.status = 'cancelled';
        inv.history.push({ at: TODAY, action: 'Hủy hóa đơn: ' + reason, userId: window.MOCK.CURRENT_USER_ID });
        return ok(T.normalizeInvoice(inv, DB.payments));
      },

      /** Không có xóa cứng — chỉ lưu trữ (theo yêu cầu nghiệp vụ) */
      async archive(codeOrId) {
        await delay();
        const inv = DB.invoices.find(i => i.id === codeOrId || i.code === codeOrId);
        if (!inv) fail('Không tìm thấy hóa đơn.', 'NOT_FOUND');
        if (inv.status === 'draft') fail('Hóa đơn Nháp dùng chức năng Xóa nháp.', 'INVALID_STATE');
        inv.status = 'cancelled';
        inv.archived = true;
        return ok(T.normalizeInvoice(inv, DB.payments));
      },

      /** Tính tổng ngay trên form (gọi khi người dùng sửa dòng hàng) */
      computeTotals(items, taxRate) {
        const subtotal = (items || []).reduce((s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0), 0);
        const discountTotal = (items || []).reduce((s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0) * (Number(it.discountPct || 0) / 100), 0);
        const taxable = subtotal - discountTotal;
        const taxTotal = Math.round(taxable * (taxRate == null ? DB.settings.defaultTaxRate : taxRate));
        return { subtotal, discountTotal, taxTotal, total: taxable + taxTotal };
      },

      async suggestNumber() {
        await delay();
        const s = DB.settings;
        return s.prefix + '-' + TODAY.slice(0, 4) + '-' + String(s.nextNumber).padStart(s.seqDigits, '0');
      }
    },

    // ---------- Khách hàng ----------
    customers: {
      async list(opts) {
        await delay();
        return query(DB.customers, Object.assign({ sort: 'code:asc' }, opts));
      },
      async get(idOrCode) {
        await delay();
        const c = DB.customers.find(x => x.id === idOrCode || x.code === idOrCode);
        if (!c) fail('Không tìm thấy khách hàng.', 'NOT_FOUND');
        return ok(c);
      },
      async create(data) {
        await delay();
        if (!data.name || !data.name.trim()) fail('Tên khách hàng là bắt buộc.', 'VALIDATION');
        if (data.type === 'business' && data.taxId && !/^\d{10,13}$/.test(data.taxId)) fail('Mã số thuế phải từ 10–13 chữ số.', 'VALIDATION');
        if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) fail('Email không đúng định dạng.', 'VALIDATION');
        if (!(Number(data.creditLimit) > 0)) fail('Hạn mức tín dụng phải lớn hơn 0.', 'VALIDATION');

        const c = Object.assign({
          id: nextId(DB.customers, 'CUS-'),
          code: 'KH-' + String(DB.customers.length + 1).padStart(3, '0'),
          type: 'business', tags: [], status: 'active',
          avgPaymentDays: 0, creditScore: 60,
          ownerId: window.MOCK.CURRENT_USER_ID, createdAt: TODAY
        }, data);
        DB.customers.unshift(c);
        return ok(c);
      },
      async update(idOrCode, patch) {
        await delay();
        const idx = DB.customers.findIndex(x => x.id === idOrCode || x.code === idOrCode);
        if (idx < 0) fail('Không tìm thấy khách hàng.', 'NOT_FOUND');
        DB.customers[idx] = Object.assign({}, DB.customers[idx], patch);
        return ok(DB.customers[idx]);
      },
      /** Không xóa cứng — chỉ lưu trữ */
      async archive(idOrCode) {
        await delay();
        return api.customers.update(idOrCode, { status: 'archived' });
      },

      /** Số dư công nợ của 1 khách hàng */
      async balance(idOrCode) {
        await delay();
        const c = await api.customers.get(idOrCode);
        const invs = DB.invoices.filter(i => i.customerId === c.id && i.status !== 'cancelled');
        const totalDebt = invs.reduce((s, i) => s + i.remaining, 0);
        const overdue = invs.filter(i => i.status === 'overdue').reduce((s, i) => s + i.remaining, 0);
        return ok({
          customerId: c.id, totalDebt, overdue,
          creditLimit: c.creditLimit,
          usagePct: Math.round((totalDebt / c.creditLimit) * 100),
          invoices: invs.map(i => ({ code: i.code, total: i.total, remaining: i.remaining, dueDate: i.dueDate, status: i.status }))
        });
      }
    },

    // ---------- Phiếu thu ----------
    payments: {
      async list(opts) {
        await delay();
        return query(DB.payments, Object.assign({ sort: 'date:desc' }, opts));
      },
      /** data: {customerId, invoiceId, amount, date, method, reference, note} */
      async create(data) {
        await delay();
        if (!(Number(data.amount) > 0)) fail('Số tiền phải lớn hơn 0.', 'VALIDATION');
        const inv = DB.invoices.find(i => i.id === data.invoiceId);
        if (!inv) fail('Hóa đơn liên kết không tồn tại.', 'VALIDATION');
        if (Number(data.amount) > inv.remaining) fail('Số tiền vượt quá số còn nợ (' + window.fmt.vnd(inv.remaining) + ').', 'VALIDATION');
        if (!data.date) fail('Ngày giao dịch là bắt buộc.', 'VALIDATION');

        const p = Object.assign({
          id: nextId(DB.payments, 'PAY-'),
          code: 'PM-' + String(DB.payments.length + 21).padStart(4, '0'),
          type: 'in', status: 'matched', createdBy: window.MOCK.CURRENT_USER_ID
        }, data, { amount: Number(data.amount) });
        DB.payments.unshift(p);
        return ok(p);
      }
    },

    // ---------- Nhắc nợ ----------
    reminders: {
      async list(opts) {
        await delay();
        return query(DB.reminders, Object.assign({ sort: 'scheduledAt:desc' }, opts));
      },
      async create(data) {
        await delay();
        const r = Object.assign({
          id: nextId(DB.reminders, 'REM-'),
          code: 'REM-' + String(DB.reminders.length + 32).padStart(4, '0'),
          status: 'draft', source: 'manual',
          createdBy: window.MOCK.CURRENT_USER_ID
        }, data);
        DB.reminders.unshift(r);
        return ok(r);
      },
      async update(id, patch) {
        await delay();
        const idx = DB.reminders.findIndex(r => r.id === id);
        if (idx < 0) fail('Không tìm thấy nhắc nợ.', 'NOT_FOUND');
        DB.reminders[idx] = Object.assign({}, DB.reminders[idx], patch);
        return ok(DB.reminders[idx]);
      },
      async schedule(id, scheduledAt) {
        return api.reminders.update(id, { status: 'scheduled', scheduledAt });
      },
      async send(id) {
        const r = await api.reminders.update(id, { status: 'sent', sentAt: TODAY });
        return r;
      }
    },

    // ---------- Kế hoạch xử lý nợ ----------
    debtPlans: {
      async list(opts) {
        await delay();
        return query(DB.debtPlans, Object.assign({ sort: 'createdAt:desc' }, opts));
      },
      async approve(id) {
        await delay();
        const p = DB.debtPlans.find(x => x.id === id);
        if (!p) fail('Không tìm thấy kế hoạch.', 'NOT_FOUND');
        if (p.status !== 'pending') fail('Chỉ duyệt kế hoạch đang chờ.', 'INVALID_STATE');
        p.status = 'approved'; p.reviewerId = window.MOCK.CURRENT_USER_ID;
        return ok(p);
      },
      async reject(id, reason) {
        await delay();
        const p = DB.debtPlans.find(x => x.id === id);
        if (!p) fail('Không tìm thấy kế hoạch.', 'NOT_FOUND');
        if (!reason || reason.trim().length < 10) fail('Lý do từ chối tối thiểu 10 ký tự.', 'VALIDATION');
        p.status = 'rejected'; p.rejectReason = reason;
        return ok(p);
      }
    },

    // ---------- Đối chiếu ngân hàng ----------
    bank: {
      async listTransactions(opts) {
        await delay();
        return query(DB.bankTransactions, opts);
      },
      async match(bankId, invoiceCode, diffReason) {
        await delay();
        const t = DB.bankTransactions.find(x => x.id === bankId);
        if (!t) fail('Không tìm thấy giao dịch.', 'NOT_FOUND');
        t.matchStatus = diffReason ? 'diff' : 'matched';
        t.invoiceCode = invoiceCode;
        t.diffReason = diffReason || null;
        return ok(t);
      },
      async markUnmatched(bankId) {
        await delay();
        const t = DB.bankTransactions.find(x => x.id === bankId);
        if (t) t.matchStatus = 'unmatched';
        return ok(t);
      },
      /** Tổng hợp tiến độ đối chiếu cho thanh trạng thái */
      async summary() {
        await delay();
        const rows = DB.bankTransactions;
        return ok({
          total: rows.length,
          matched: rows.filter(r => r.matchStatus === 'matched').length,
          diff: rows.filter(r => r.matchStatus === 'diff').length,
          unmatched: rows.filter(r => r.matchStatus === 'unmatched').length
        });
      }
    },

    // ---------- Thống kê ----------
    stats: {
      async receivable() {
        await delay();
        const live = DB.invoices.filter(i => i.status !== 'cancelled' && i.status !== 'draft');
        const totalDebt = live.reduce((s, i) => s + i.remaining, 0);
        const overdue = live.filter(i => i.status === 'overdue').reduce((s, i) => s + i.remaining, 0);
        const dueSoon = live.filter(i => i.status !== 'overdue' && i.status !== 'paid' && T.daysBetween(TODAY, i.dueDate) <= 30)
          .reduce((s, i) => s + i.remaining, 0);
        const collected = DB.payments.filter(p => p.type === 'in').reduce((s, p) => s + p.amount, 0);
        return ok({
          totalDebt, overdue, dueSoon, collected,
          collectionRate: live.reduce((s, i) => s + i.total, 0) > 0
            ? Math.round((collected / (collected + totalDebt)) * 100) : 0,
          dso: 34,
          overdueInvoiceCount: live.filter(i => i.status === 'overdue').length,
          invoiceCount: live.length
        });
      },

      async topDebtors(limit) {
        await delay();
        const map = {};
        DB.invoices.filter(i => i.status !== 'cancelled').forEach(i => {
          map[i.customerId] = (map[i.customerId] || 0) + i.remaining;
        });
        const rows = Object.keys(map).map(cid => {
          const c = DB.customers.find(x => x.id === cid);
          return { customerId: cid, name: c ? c.name : cid, code: c ? c.code : '', amount: map[cid] };
        }).filter(r => r.amount > 0).sort((a, b) => b.amount - a.amount);
        return ok(rows.slice(0, limit || 5));
      },

      async aging() {
        await delay();
        const buckets = { b0: 0, b30: 0, b60: 0, b90: 0 };
        const rows = DB.customers.map(c => {
          const r = { customerId: c.id, name: c.name, b0: 0, b30: 0, b60: 0, b90: 0, total: 0 };
          DB.invoices.filter(i => i.customerId === c.id && i.remaining > 0 && i.status !== 'cancelled').forEach(i => {
            const late = T.daysBetween(i.dueDate, TODAY);
            const k = late <= 0 ? 'b0' : late <= 30 ? 'b30' : late <= 60 ? 'b60' : 'b90';
            r[k] += i.remaining; buckets[k] += i.remaining; r.total += i.remaining;
          });
          return r;
        }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
        return ok({ buckets, rows, grandTotal: buckets.b0 + buckets.b30 + buckets.b60 + buckets.b90 });
      },

      async cashflow(days) {
        await delay();
        days = days || 30;
        const open = DB.invoices.filter(i => i.remaining > 0 && i.status !== 'cancelled' && i.status !== 'draft');
        const weeks = [];
        for (let w = 0; w < 4; w++) {
          const from = T.addDays(TODAY, w * 7), to = T.addDays(TODAY, (w + 1) * 7 - 1);
          const inflow = open.filter(i => i.dueDate >= from && i.dueDate <= to)
            .reduce((s, i) => s + Math.round(i.remaining * (T.daysBetween(TODAY, i.dueDate) <= 30 ? 0.95 : 0.7)), 0);
          const outflow = 45000000 + (w === 2 ? 7000000 : 0); // chi phí dự kiến
          weeks.push({ from, to, inflow, outflow, net: inflow - outflow });
        }
        return ok({ weeks, horizonDays: days });
      }
    },

    // ---------- Cấu hình ----------
    settings: {
      async get() { await delay(); return ok(DB.settings); },
      async update(patch) {
        await delay();
        Object.assign(DB.settings, patch);
        return ok(DB.settings);
      }
    },

    // ---------- Nhật ký ----------
    logs: {
      async list(opts) { await delay(); return query(DB.activityLogs, Object.assign({ sort: 'time:desc' }, opts)); }
    },

    // ---------- Thông báo ----------
    notifications: {
      async list() {
        await delay();
        return ok([
          { id: 'NOTI-1', type: 'reminder', title: 'INV-2026-0142 sắp đến hạn trong 3 ngày', time: '2 giờ trước', read: false },
          { id: 'NOTI-2', type: 'approval', title: 'Kế hoạch xử lý nợ của Hoa Sen chờ bạn duyệt', time: '5 giờ trước', read: false },
          { id: 'NOTI-3', type: 'ai', title: 'AI-1 phát hiện 2 trường bất thường trên INV-0140', time: 'Hôm qua', read: false },
          { id: 'NOTI-4', type: 'system', title: 'Đối chiếu sao kê 11/10 hoàn tất: 14/16 khớp', time: 'Hôm qua', read: true }
        ]);
      },
      async markAllRead() { await delay(); return ok({ updated: true }); }
    },

    // =====================================================================
    // AI — luôn trả về cấu trúc 5 khối: input → loading → result → explain → control
    // =====================================================================
    ai: {
      /**
       * AI-1 · Kiểm tra bất thường hóa đơn
       * @param {Object} data dữ liệu form hóa đơn
       * @returns {{state, confidence, findings, explanation}}
       */
      async checkAnomaly(data) {
        await delay();
        const findings = [];
        const rules = [];

        if (!data.items || data.items.length === 0) {
          return {
            state: 'insufficient', confidence: 0,
            findings: [], explanation: {
              message: 'Không đủ dữ liệu để đưa ra đề xuất.',
              hint: 'Hóa đơn cần có ít nhất 1 dòng hàng và ngày phát hành hợp lệ.',
              inputs: [], rules: []
            }
          };
        }

        // R-01 · Ngày hạn
        if (data.dueDate && data.issueDate && data.dueDate <= data.issueDate) {
          findings.push({
            id: 'F1', severity: 'high',
            field: 'dueDate',
            title: 'Hạn thanh toán sớm hơn ngày phát hành',
            detail: 'Ngày phát hành = ' + window.fmt.date(data.issueDate) + ' nhưng hạn thanh toán = ' + window.fmt.date(data.dueDate) + '.',
            suggestion: { dueDate: T.addDays(data.issueDate, 30) },
            suggestionText: 'Đổi hạn thành ' + window.fmt.date(T.addDays(data.issueDate, 30))
          });
          rules.push('R-01 · Ngày hạn phải sau ngày phát hành ít nhất 7 ngày');
        }

        // R-02 · Số tiền lớn
        const total = api.invoices.computeTotals(data.items, data.taxRate).total;
        const th = DB.settings.anomalyThresholds.amountWarn;
        if (total > th) {
          findings.push({
            id: 'F2', severity: 'medium', field: 'total',
            title: 'Số tiền vượt ngưỡng cảnh báo',
            detail: 'Tổng cộng ' + window.fmt.vnd(total) + ' vượt ngưỡng ' + window.fmt.vnd(th) + '.',
            suggestionText: 'Cần người duyệt trước khi phát hành.',
            suggestion: null
          });
          rules.push('R-05 · Số tiền > ngưỡng ' + window.fmt.vnd(th) + ' cần người duyệt');
        }

        // R-03 · Đơn giá bất thường so với danh mục
        (data.items || []).forEach((it, i) => {
          const cat = window.MOCK.serviceCatalog.find(c => c.name === it.name);
          if (cat && it.unitPrice > cat.unitPrice * 2) {
            findings.push({
              id: 'F' + (i + 3), severity: 'low', field: 'items.' + i + '.unitPrice',
              title: 'Đơn giá cao bất thường',
              detail: '"' + it.name + '" có đơn giá ' + window.fmt.vnd(it.unitPrice) + ', cao hơn 2 lần mức tham khảo ' + window.fmt.vnd(cat.unitPrice) + '.',
              suggestionText: 'Xác nhận lại đơn giá với bộ phận kinh doanh.',
              suggestion: null
            });
            rules.push('R-03 · Đơn giá lệch > 200% mức tham khảo của danh mục');
          }
        });

        if (findings.length === 0) {
          findings.push({
            id: 'F0', severity: 'none', field: null,
            title: 'Không phát hiện bất thường',
            detail: 'Các trường ngày, tiền và đơn giá đều nằm trong quy tắc.',
            suggestionText: 'Có thể phát hành hóa đơn.', suggestion: null
          });
        }

        return {
          state: 'success',
          confidence: findings.some(f => f.severity === 'high') ? 0.82 : 0.91,
          findings,
          explanation: {
            inputs: ['Số dòng hàng: ' + (data.items || []).length,
              'Ngày phát hành: ' + window.fmt.date(data.issueDate),
              'Kỳ hạn: ' + T.daysBetween(data.issueDate, data.dueDate) + ' ngày',
              'Tổng tiền: ' + window.fmt.vnd(total)],
            rules: rules.length ? rules : ['R-01 · Ngày hạn hợp lệ', 'R-02 · Số tiền trong ngưỡng'],
            note: 'Kết quả dựa trên quy tắc nghiệp vụ đã cấu hình trong Cài đặt, không phải khẳng định chắc chắn.'
          }
        };
      },

      /**
       * AI-2 · Soạn thư nhắc nợ
       */
      async generateReminder(opts) {
        await delay();
        const inv = DB.invoices.find(i => i.id === opts.invoiceId || i.code === opts.invoiceId);
        if (!inv) {
          return {
            state: 'insufficient', confidence: 0,
            explanation: { message: 'Không đủ dữ liệu để soạn thư.', hint: 'Cần chọn hóa đơn hợp lệ trước khi chạy AI.' }
          };
        }
        const cust = DB.customers.find(c => c.id === inv.customerId);
        const tone = opts.tone || 'polite';
        const lateDays = T.daysBetween(inv.dueDate, TODAY);

        const openers = {
          polite: 'Kính gửi Anh/Chị,',
          firm: 'Kính gửi Anh/Chị,',
          strict: 'Kính gửi Anh/Chị ' + (cust ? cust.name : '') + ','
        };
        const middles = {
          polite: 'Công ty chúng tôi xin phép nhắc nhẹ về hóa đơn ' + inv.code + ' trị giá ' + window.fmt.vnd(inv.remaining) + ', hạn thanh toán ' + window.fmt.date(inv.dueDate) + '.',
          firm: 'Hóa đơn ' + inv.code + ' trị giá ' + window.fmt.vnd(inv.remaining) + ' đã đến hạn thanh toán ' + window.fmt.date(inv.dueDate) + '. Chúng tôi rất mong nhận được thanh toán trong thời gian sớm nhất.',
          strict: 'Hóa đơn ' + inv.code + ' đã quá hạn ' + lateDays + ' ngày với số tiền còn nợ ' + window.fmt.vnd(inv.remaining) + '. Đề nghị Anh/Chị hoàn tất thanh toán trong 3 ngày làm việc tới.'
        };
        const closers = {
          polite: 'Nếu Anh/Chị đã thanh toán, xin vui lòng bỏ qua email này. Trân trọng cảm ơn.',
          firm: 'Vui lòng phản hồi email này nếu có vướng mắc về chứng từ. Xin cảm ơn sự hợp tác.',
          strict: 'Trường hợp không nhận được phản hồi, chúng tôi sẽ áp dụng quy trình thu hồi nợ theo hợp đồng đã ký.'
        };

        return {
          state: 'success',
          confidence: 0.88,
          subject: (tone === 'strict' ? 'THÔNG BÁO NỢ QUÁ HẠN ' : 'Nhắc thanh toán ') + inv.code + ' · ' + window.fmt.vnd(inv.remaining),
          body: [openers[tone], '', middles[tone], '', closers[tone], '', 'Trân trọng,', 'Phòng Kế toán – ' + DB.settings.companyName].join('\n'),
          explanation: {
            inputs: [
              'Khách hàng: ' + (cust ? cust.name : '—'),
              'Hóa đơn: ' + inv.code + ' · còn nợ ' + window.fmt.vnd(inv.remaining),
              'Hạn thanh toán: ' + window.fmt.date(inv.dueDate) + ' (' + window.fmt.dueText(inv.dueDate) + ')',
              'Mức độ lịch sự: ' + tone + ' · Kênh: ' + (opts.channel || 'email')
            ],
            rules: [
              'R-10 · Giọng điệu tăng dần theo số ngày quá hạn',
              'R-11 · Chỉ nêu số tiền còn nợ, không nêu tổng hóa đơn',
              'R-12 · Không dùng từ ngữ đe dọa ở mức polite/firm'
            ],
            note: 'Thư được tạo tự động, người dùng cần đọc lại trước khi gửi.'
          }
        };
      },

      /**
       * AI-3 · Tóm tắt dòng tiền
       */
      async summarizeCashflow(payload) {
        await delay();
        const weeks = (payload && payload.weeks) || (await api.stats.cashflow(30)).weeks;
        const down = weeks.filter(w => w.net < 0);

        if (!weeks.length) {
          return {
            state: 'insufficient', confidence: 0,
            explanation: { message: 'Không đủ dữ liệu để đưa ra đề xuất.', hint: 'Chưa có hóa đơn hoặc kỳ dự báo trống.' }
          };
        }

        const out = {
          state: 'success',
          confidence: down.length > 0 ? 0.74 : 0.9,
          paragraphs: [
            'Trong 30 ngày tới, tổng tiền dự kiến thu về là ' + window.fmt.vnd(weeks.reduce((s, w) => s + w.inflow, 0)) + ', tập trung ở 2 tuần đầu.',
            down.length
              ? 'Dòng tiền ròng dự kiến âm ' + window.fmt.vnd(Math.abs(down[0].net)) + ' trong tuần ' + window.fmt.date(down[0].from) + ' – ' + window.fmt.date(down[0].to) + '.'
              : 'Dòng tiền ròng duy trì dương trong toàn bộ kỳ dự báo.',
            'Nhóm nợ 31–60 ngày là nguồn đóng góp chính cho khoản dự kiến thu; tỷ lệ thu hồi giả định 70%.'
          ],
          bullets: weeks.map(w => window.fmt.date(w.from) + ' → vào ' + window.fmt.vndShort(w.inflow) + ', ra ' + window.fmt.vndShort(w.outflow) + ', ròng ' + window.fmt.vndShort(w.net)),
          explanation: {
            inputs: ['Kỳ dự báo: 30 ngày', 'Giả định thu hồi 0–30 ngày: 95%', 'Giả định thu hồi 31–60 ngày: 70%', 'Chi phí dự kiến: 180.000.000 ₫/tháng'],
            rules: ['R-20 · Dòng vào = Σ(còn nợ × tỷ lệ thu hồi theo nhóm tuổi nợ)', 'R-21 · Dòng ra lấy từ chi phí trung bình 3 tháng gần nhất'],
            note: 'Đây là tóm tắt tham khảo, không phải cam kết tài chính.'
          }
        };
        return out;
      }
    },

    // ---------- Reset dữ liệu demo (nút "Tải lại dữ liệu mẫu") ----------
    async reset() {
      await delay();
      location.reload();
    }
  };

  window.api = api;
  function simulate(action, latency) {
    return new Promise(function (resolve, reject) {
      window.setTimeout(function () {
        try {
          resolve(action());
        } catch (error) {
          reject(error);
        }
      }, latency || 0);
    });
  }

    // ---- Bổ sung: danh mục hàng hóa + tạo/cập nhật hóa đơn ----
  api.products = {
    list: function () {
      return simulate(function () {
        return (window.MOCK && MOCK.PRODUCTS) || [];
      });
    }
  };

  api.invoices.create = function (payload) {
    return simulate(function () {
      const seq = MOCK.DB.invoices.length + 1;
      const code = payload.code || ('INV-2026-' + String(200 + seq).padStart(4, '0'));
      const inv = Object.assign({ id: 'inv-new-' + seq, code: code, createdAt: new Date().toISOString() }, payload);
      MOCK.DB.invoices.unshift(normalizeInvoice(inv));
      return normalizeInvoice(inv);
    }, 700);
  };

  api.invoices.update = function (code, patch) {
    return simulate(function () {
      const inv = MOCK.DB.invoices.find(i => i.code === code);
      if (!inv) throw { code: 'NOT_FOUND', message: 'Không tìm thấy hóa đơn ' + code };
      Object.assign(inv, patch);
      return normalizeInvoice(inv);
    }, 700);
  };
    api.debtPlans = {
    list: function (params) {
      return simulate(function () {
      return { items: MOCK.debtPlans.slice(), total: MOCK.debtPlans.length };
      }, 620);
    },
    create: function (payload) {
      return simulate(function () {
        const plan = Object.assign({ id: 'pl-' + Date.now(), status: 'pending', stale: false, trace: [] }, payload);
      MOCK.debtPlans.unshift(plan);
        return plan;
      }, 700);
    },
    approve: function (id, note) {
      return simulate(function () {
      const plan = MOCK.debtPlans.find(p => p.id === id);
        if (!plan) throw { code: 'NOT_FOUND', message: 'Không tìm thấy kế hoạch.' };
        if (plan.stale) throw {
          code: 'CONFLICT',
          message: 'Kế hoạch ' + plan.code + ' vừa được Lê Văn C cập nhật lúc 10:22.'
        };
        plan.status = 'approved';
        plan.trace.push({ time: fmtNow(), actor: 'Trần Thị B', action: 'Duyệt kế hoạch', tone: 'ok', note: note || '' });
        return plan;
      }, 620);
    },
    reject: function (id, note) {
      return simulate(function () {
        const plan = MOCK.debtPlans.find(p => p.id === id);
        if (!plan) throw { code: 'NOT_FOUND', message: 'Không tìm thấy kế hoạch.' };
        plan.status = 'rejected';
        plan.trace.push({ time: fmtNow(), actor: 'Trần Thị B', action: 'Từ chối', tone: 'bad', note: note || '' });
        return plan;
      }, 620);
    }
  };

  function fmtNow() {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' · ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
    api.reconciliation = {
    get: function () {
      return simulate(function () {
        return JSON.parse(JSON.stringify(MOCK.reconciliation));
      }, 620);
    },
    importStatement: function (fileName) {
      return simulate(function () {
        MOCK.reconciliation.trace.unshift({
          time: fmtNow(), actor: 'Nguyễn Văn A', action: 'Nhập sao kê ngân hàng', tone: 'info',
          note: 'Tệp ' + fileName + ' · 128 dòng.'
        });
        return MOCK.reconciliation.statement;
      }, 760);
    },
    autoMatch: function () {
      return simulate(function () {
        MOCK.reconciliation.trace.unshift({
          time: fmtNow(), actor: 'Hệ thống', action: 'Đối chiếu tự động', tone: 'ok',
          note: 'Khớp 96/128 dòng, tỷ lệ 90,6%.'
        });
        return MOCK.reconciliation.summary;
      }, 900);
    },
    resolveException: function (id, payload) {
      return simulate(function () {
        const ex = MOCK.reconciliation.exceptions.find(e => e.id === id);
        if (!ex) throw { code: 'NOT_FOUND', message: 'Không tìm thấy dòng lệch lệch.' };
        if (ex.stale) throw {
          code: 'CONFLICT',
          message: 'Dòng ' + ex.ref + ' vừa được Lê Văn C xử lý lúc 14:05.'
        };
        ex.status = 'resolved';
        ex.resolution = payload.resolution;
        ex.resolvedBy = 'Trần Thị B';
        ex.resolvedAt = fmtNow();
        MOCK.reconciliation.trace.unshift({
          time: fmtNow(), actor: 'Trần Thị B', action: 'Xử lý lệch lệch ' + ex.ref, tone: 'warn',
          note: payload.resolution + '. ' + (payload.note || '')
        });
        return ex;
      }, 620);
    },
    confirm: function (note) {
      return simulate(function () {
        if (MOCK.reconciliation.stale) throw {
          code: 'CONFLICT',
          message: 'Kỳ 10/2026 vừa được Lê Văn C chốt lúc 14:05.'
        };
        MOCK.reconciliation.confirmed = {
          code: 'GH-2026-10-001', at: fmtNow(), by: 'Trần Thị B'
        };
        MOCK.reconciliation.trace.unshift({
          time: fmtNow(), actor: 'Trần Thị B', action: 'Xác nhận ghép sổ', tone: 'ok', note: note || 'Kỳ 10/2026 khóa sổ.'
        });
        return MOCK.reconciliation.confirmed;
      }, 700);
    }
  };

  function fmtNow() {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' · ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
    api.balances = {
    get: function () {
      return simulate(function () {
        return JSON.parse(JSON.stringify(MOCK.balances));
      }, 620);
    },
    sendStatement: function (id, payload) {
      return simulate(function () {
        const cus = MOCK.balances.customers.find(c => c.id === id);
        if (!cus) throw { code: 'NOT_FOUND', message: 'Không tìm thấy khách hàng.' };
        if (cus.stale) throw {
          code: 'CONFLICT',
          message: 'Số dư ' + cus.name + ' vừa được Đỗ Quốc Huy cập nhật lúc 14:05.'
        };
        cus.statementSent = { at: fmtNow(), by: 'Phạm Thu Hà', period: payload.period };
        MOCK.balances.trace.unshift({
          time: fmtNow(), actor: 'Phạm Thu Hà', action: 'Gửi bảng kê công nợ', tone: 'ok',
          note: cus.name + ' · kỳ ' + payload.period + '. ' + (payload.note || '')
        });
        return cus.statementSent;
      }, 700);
    },
    recordPayment: function (id, payload) {
      return simulate(function () {
        const cus = MOCK.balances.customers.find(c => c.id === id);
        if (!cus) throw { code: 'NOT_FOUND', message: 'Không tìm thấy khách hàng.' };
        const rest = [ 'b4', 'b3', 'b2', 'b1' ];
        let left = payload.amount;
        rest.forEach(function (k) {
          const cut = Math.min(cus.aging[k], left);
          cus.aging[k] -= cut;
          left -= cut;
        });
        cus.statement.unshift({
          date: payload.date, ref: payload.ref || 'PT-2026-0388',
          desc: 'Thu tiền theo ghi nhận của kinh doanh',
          debit: 0, credit: payload.amount
        });
        MOCK.balances.trace.unshift({
          time: fmtNow(), actor: 'Phạm Thu Hà', action: 'Ghi nhận thu tiền', tone: 'info',
          note: cus.name + ' · ' + payload.amount.toLocaleString('vi-VN') + ' ₫.'
        });
        return cus;
      }, 720);
    }
  };

  function fmtNow() {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' · ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
    const customerReminderData = {
      customers: MOCK.customers.filter(c => c.overdue > 0).map(c => {
        const history = (c.history || []).filter(h => /nhắc nợ|gửi email nhắc/i.test(h.what))
          .map((h, index) => ({
            date: h.when.slice(0, 10),
            channel: 'Email',
            stage: index + 1,
            result: 'Đã gửi',
            by: h.who
          }));
        const stage = Math.min(4, history.length);
        return Object.assign({}, c, {
          balance: c.outstanding,
          daysLate: c.avgDaysOverdue,
          oldest: c.avgDaysOverdue + ' ngày trước',
          type: 'overdue',
          dueSoon: 0,
          stage,
          nextAt: '13/10/2026',
          channels: ['email'],
          lastAt: history.length ? history[history.length - 1].date : '',
          promise: null,
          history,
          stale: false
        });
      }),
      templates: [
        { id: 't1', name: 'Nhắc thanh toán nhẹ nhàng', tone: 'soft', label: 'Thân thiện', when: 'Nhắc nợ lần 1', subject: 'Nhắc thanh toán công nợ – {{KH}}', body: 'Kính gửi {{KH}}, Quý khách vui lòng kiểm tra khoản công nợ {{TIEN}} và phản hồi thời gian thanh toán dự kiến.' },
        { id: 't2', name: 'Nhắc thanh toán lần 2', tone: 'info', label: 'Theo dõi', when: 'Nhắc nợ lần 2', subject: 'Theo dõi khoản công nợ – {{KH}}', body: 'Kính gửi {{KH}}, khoản công nợ {{TIEN}} đã đến hạn {{SONGAY}}. Vui lòng xác nhận kế hoạch thanh toán.' },
        { id: 't3', name: 'Cảnh báo quá hạn', tone: 'warn', label: 'Quá hạn', when: 'Cảnh báo quá hạn', subject: 'Thông báo công nợ quá hạn – {{KH}}', body: 'Kính gửi {{KH}}, công nợ {{TIEN}} đang quá hạn {{SONGAY}}. Xin Quý khách ưu tiên xử lý và phản hồi trước {{HAN}}.' },
        { id: 't4', name: 'Thông báo chuyển xử lý', tone: 'danger', label: 'Khẩn', when: 'Chuyển xử lý nợ', subject: 'Yêu cầu xử lý công nợ – {{KH}}', body: 'Kính gửi {{KH}}, đề nghị Quý khách thanh toán khoản {{TIEN}} hoặc liên hệ {{NGUOIGUI}} trước {{HAN}} để thống nhất phương án.' }
      ],
      trace: [],
      recoveryRate: 72
    };
    api.customerReminders = {
    get: function () {
      return simulate(function () {
        return JSON.parse(JSON.stringify(customerReminderData));
      }, 580);
    },
    send: function (id, payload) {
      return simulate(function () {
        const cus = customerReminderData.customers.find(c => c.id === id);
        if (!cus) throw { code: 'NOT_FOUND', message: 'Không tìm thấy khách hàng.' };
        if (cus.stale) throw {
          code: 'CONFLICT',
          message: cus.name + ' vừa được Đỗ Quốc Huy gửi nhắc nợ lúc 14:05.'
        };
        cus.stage = Math.min(4, cus.stage + 1);
        cus.lastAt = payload.date;
        cus.channels = payload.channels;
        cus.history.push({
          date: payload.date,
          channel: payload.channels.map(k => k === 'phone' ? 'Điện thoại' : k === 'zalo' ? 'Zalo' : k === 'sms' ? 'SMS' : 'Email').join(' + '),
          stage: cus.stage, result: 'Đã gửi', by: 'Phạm Thu Hà'
        });
        customerReminderData.trace.unshift({
          time: fmtNow(), actor: 'Phạm Thu Hà',
          action: 'Gửi nhắc nợ lần ' + cus.stage, tone: cus.stage >= 3 ? 'warn' : 'ok',
          note: cus.name + ' · mẫu ' + payload.templateName + '. ' + (payload.note || '')
        });
        return cus;
      }, 720);
    },
    sendBulk: function (ids, payload) {
      return simulate(function () {
        let sent = 0;
        ids.forEach(function (id) {
          const cus = customerReminderData.customers.find(c => c.id === id);
          if (!cus || cus.stale) return;
          cus.stage = Math.min(4, cus.stage + 1);
          cus.lastAt = payload.date;
          cus.history.push({ date: payload.date, channel: 'Email', stage: cus.stage, result: 'Đã gửi', by: 'Phạm Thu Hà' });
          sent++;
        });
        customerReminderData.trace.unshift({
          time: fmtNow(), actor: 'Phạm Thu Hà', action: 'Gửi nhắc nợ hàng loạt', tone: 'info',
          note: sent + ' khách hàng · mẫu ' + payload.templateName + '.'
        });
        return { sent: sent, total: ids.length };
      }, 820);
    },
    promise: function (id, payload) {
      return simulate(function () {
        const cus = customerReminderData.customers.find(c => c.id === id);
        if (!cus) throw { code: 'NOT_FOUND', message: 'Không tìm thấy khách hàng.' };
        cus.promise = { amount: payload.amount, date: payload.date };
        cus.history.push({
          date: fmtDate(), channel: 'Ghi nhận', stage: cus.stage,
          result: 'Hứa thanh toán ' + payload.amount.toLocaleString('vi-VN') + ' ₫ ngày ' + payload.date,
          by: 'Phạm Thu Hà'
        });
        customerReminderData.trace.unshift({
          time: fmtNow(), actor: 'Phạm Thu Hà', action: 'Ghi nhận hứa thanh toán', tone: 'info',
          note: cus.name + ' · ' + payload.amount.toLocaleString('vi-VN') + ' ₫ · hẹn ' + payload.date + '.'
        });
        return cus;
      }, 640);
    }
  };

  function fmtDate() {
    return new Date().toLocaleDateString('vi-VN');
  }
    api.invoices.getDetail = function (id) {
      return simulate(function () {
        const rec = MOCK.invoiceDetail[id];
        if (!rec) throw { code: 'NOT_FOUND', message: 'Không tìm thấy hóa đơn ' + id + '.' };
        return JSON.parse(JSON.stringify(rec));
      }, 560);
    };
    api.invoices.send = function (id, payload) {
      return simulate(function () {
        const rec = MOCK.invoiceDetail[id];
        if (!rec) throw { code: 'NOT_FOUND', message: 'Không tìm thấy hóa đơn.' };
        if (rec.stale) throw {
          code: 'CONFLICT',
          message: 'Hóa đơn ' + rec.code + ' vừa được Kế toán cập nhật lúc 14:05.'
        };
        rec.sentCount += 1;
        rec.timeline.unshift({
          time: nowStamp(), actor: 'Phạm Thu Hà', action: 'Gửi lại hóa đơn', tone: 'ok',
          note: 'Gửi tới ' + payload.email + '. ' + (payload.message || '')
        });
        return rec;
      }, 700);
    };
    api.invoices.requestAdjust = function (id, payload) {
      return simulate(function () {
        const rec = MOCK.invoiceDetail[id];
        if (!rec) throw { code: 'NOT_FOUND', message: 'Không tìm thấy hóa đơn.' };
        if (rec.stale) throw {
          code: 'CONFLICT',
          message: 'Hóa đơn ' + rec.code + ' vừa được Kế toán cập nhật lúc 14:05.'
        };
        rec.timeline.unshift({
          time: nowStamp(), actor: 'Phạm Thu Hà', action: 'Tạo yêu cầu điều chỉnh hóa đơn', tone: 'warn',
          note: 'Điều chỉnh ' + payload.amount.toLocaleString('vi-VN') + ' ₫ · lý do: ' + payload.reason +
            ' · chờ Kế toán duyệt.'
        });
        return rec;
      }, 760);
    };

  function nowStamp() {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' · ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
    api.receivable = {
    getOverview: function (period) {
      return simulate(function () {
        const rec = MOCK.receivableOverview;
        if (!rec) throw { code: 'NOT_FOUND', message: 'Không có số liệu công nợ.' };
        const out = JSON.parse(JSON.stringify(rec));
        out.period = period || rec.period;
        return out;
      }, 620);
    }
  };
    api.invoices.getOverdue = function () {
      return simulate(function () {
        const items = MOCK.overdueInvoices;
        if (!items) throw { code: 'NOT_FOUND', message: 'Không có dữ liệu hóa đơn quá hạn.' };
        return JSON.parse(JSON.stringify(items));
      }, 560);
    };
    api.finance = {
    getCashflowForecast: function () {
      return simulate(function () {
        const data = MOCK.cashflowForecast;
        if (!data) throw { code: 'NOT_FOUND', message: 'Không có dữ liệu dự báo dòng tiền.' };
        return JSON.parse(JSON.stringify(data));
      }, 520);
    }
  };
    api.customerProfiles = {
    list: function () {
      return simulate(function () {
      const rows = MOCK.customers;
        if (!rows || !rows.length) throw { code: 'EMPTY', message: 'Chưa có khách hàng nào trong hệ thống.' };
        return JSON.parse(JSON.stringify(rows));
      }, 420);
    }
  };
    api.users = {
    list: function () {
      return simulate(function () {
        const rows = MOCK.DB.users;
        if (!rows || !rows.length) throw { code: 'EMPTY', message: 'Chưa có tài khoản người dùng.' };
        return JSON.parse(JSON.stringify(rows));
      }, 380);
    }
  };
    api.invoiceSeries = {
    list: function () {
      return simulate(function () {
        const rows = MOCK.invoiceSeries;
        if (!rows || !rows.length) throw { code: 'EMPTY', message: 'Chưa có ký hiệu hóa đơn.' };
        return JSON.parse(JSON.stringify(rows));
      }, 340);
    },
    update: function (id, patch) {
      return simulate(function () {
        const row = MOCK.invoiceSeries.filter(function (s) { return s.id === id; })[0];
        if (!row) throw { code: 'NOT_FOUND', message: 'Không tìm thấy ký hiệu hóa đơn.' };
        Object.assign(row, patch);
        return JSON.parse(JSON.stringify(row));
      }, 380);
    }
  };
  api.invoiceSettings = {
    get: function () {
      return simulate(function () {
        return JSON.parse(JSON.stringify(MOCK.invoiceSettings));
      }, 320);
    },
    update: function (payload) {
      return simulate(function () {
        MOCK.invoiceSettings = Object.assign(MOCK.invoiceSettings, payload);
        return JSON.parse(JSON.stringify(MOCK.invoiceSettings));
      }, 460);
    }
  };
})();