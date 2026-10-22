/**
 * mock-data.js — Dữ liệu mẫu InvoicePilot (CSE122)
 * Mục đích: thay thế backend thật. Mọi màn hình chỉ đọc qua window.api.
 * Ngày tham chiếu cố định = 12/10/2026 để demo ổn định (không phụ thuộc giờ máy).
 */
(function () {
  'use strict';

  // -----------------------------------------------------------------------
  // 0. Hằng số
  // -----------------------------------------------------------------------
  const TODAY = '2026-10-12';
  const CURRENT_USER_ID = 'USR-01'; // Nguyễn Văn A (Kế toán) — đổi khi demo vai trò khác

  const INVOICE_STATUS = {
    DRAFT: 'draft',        // Nháp
    ISSUED: 'issued',      // Đã phát hành
    PARTIAL: 'partial',    // Đã thu một phần
    PAID: 'paid',          // Đã thu đủ
    OVERDUE: 'overdue',    // Quá hạn
    CANCELLED: 'cancelled' // Đã hủy
  };

  const STATUS_LABEL = {
    draft: 'Nháp',
    issued: 'Đã phát hành',
    partial: 'Đã thu một phần',
    paid: 'Đã thu',
    overdue: 'Quá hạn',
    cancelled: 'Đã hủy',
    archived: 'Đã lưu trữ'
  };

  const ROLES = {
    ACCOUNTANT: 'accountant',
    SALES: 'sales',
    MANAGER: 'manager',
    ADMIN: 'admin'
  };

  // -----------------------------------------------------------------------
  // 1. Người dùng
  // -----------------------------------------------------------------------
  const users = [
    { id: 'USR-01', name: 'Nguyễn Văn A', email: 'nvana@congty.vn', role: ROLES.ACCOUNTANT, department: 'Kế toán', status: 'active', createdAt: '2026-03-02', lastLogin: '2026-10-12 08:41' },
    { id: 'USR-02', name: 'Trần Thị B', email: 'ttbi@congty.vn', role: ROLES.SALES, department: 'Kinh doanh', status: 'active', createdAt: '2026-03-02', lastLogin: '2026-10-12 09:02' },
    { id: 'USR-03', name: 'Lê Quang Sơn', email: 'lqson@congty.vn', role: ROLES.MANAGER, department: 'Điều hành', status: 'active', createdAt: '2026-02-18', lastLogin: '2026-10-11 17:20' },
    { id: 'USR-04', name: 'Phạm Cẩm Tú', email: 'pctu@congty.vn', role: ROLES.ADMIN, department: 'Công nghệ', status: 'active', createdAt: '2026-02-18', lastLogin: '2026-10-12 07:55' },
    { id: 'USR-05', name: 'Hoàng Văn E', email: 'hve@congty.vn', role: ROLES.SALES, department: 'Kinh doanh', status: 'disabled', createdAt: '2026-05-14', lastLogin: '2026-09-28 10:12' },
    { id: 'USR-06', name: 'Vũ Thanh Mai', email: 'vtmai@congty.vn', role: ROLES.ACCOUNTANT, department: 'Kế toán', status: 'active', createdAt: '2026-06-01', lastLogin: '2026-10-10 14:33' }
  ];

  // -----------------------------------------------------------------------
  // 2. Khách hàng
  // -----------------------------------------------------------------------
  const customers = [
    {
      id: 'CUS-01', code: 'KH-001', name: 'Công ty TNHH Hoa Sen', type: 'business',
      taxId: '0123456789', email: 'nguoilienhe@hosen.vn', phone: '0901 234 567',
      address: '12 Nguyễn Văn Bình, Quận 1, TP.HCM', creditLimit: 50000000,
      paymentTermDays: 30, ownerId: 'USR-02', status: 'active',
      tags: ['VIP', 'Thân thiết'], avgPaymentDays: 22, creditScore: 72, createdAt: '2026-03-11'
    },
    {
      id: 'CUS-02', code: 'KH-002', name: 'Cửa hàng Minh Anh', type: 'individual',
      taxId: '', email: 'minhanh.store@gmail.com', phone: '0912 887 456',
      address: '45 Lê Lợi, Hải Châu, Đà Nẵng', creditLimit: 20000000,
      paymentTermDays: 30, ownerId: 'USR-02', status: 'active',
      tags: [], avgPaymentDays: 41, creditScore: 48, createdAt: '2026-04-02'
    },
    {
      id: 'CUS-03', code: 'KH-003', name: 'CTCP Phước Thành', type: 'business',
      taxId: '0287654321', email: 'finance@phuocthanh.com.vn', phone: '024 3822 1199',
      address: '18 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội', creditLimit: 100000000,
      paymentTermDays: 45, ownerId: 'USR-02', status: 'active',
      tags: ['Đối tác lớn'], avgPaymentDays: 18, creditScore: 86, createdAt: '2026-03-20'
    },
    {
      id: 'CUS-04', code: 'KH-004', name: 'TNHH Bình Minh', type: 'business',
      taxId: '0366112233', email: 'ketoan@binhminh.com', phone: '0903 555 222',
      address: '201 Võ Văn Kiệt, Quận 5, TP.HCM', creditLimit: 30000000,
      paymentTermDays: 30, ownerId: 'USR-05', status: 'active',
      tags: ['Rủi ro'], avgPaymentDays: 63, creditScore: 31, createdAt: '2026-03-25'
    },
    {
      id: 'CUS-05', code: 'KH-005', name: 'CTCP An Phú', type: 'business',
      taxId: '0112233445', email: 'ap@anphu.com.vn', phone: '028 7300 8899',
      address: '88 Nguyễn Huệ, TP. Huế', creditLimit: 60000000,
      paymentTermDays: 30, ownerId: 'USR-02', status: 'active',
      tags: [], avgPaymentDays: 29, creditScore: 68, createdAt: '2026-05-06'
    },
    {
      id: 'CUS-06', code: 'KH-006', name: 'TNHH Sao Việt', type: 'business',
      taxId: '0445566778', email: 'saoviet@gmail.com', phone: '0909 111 222',
      address: '5 Trần Hưng Đạo, Nha Trang, Khánh Hòa', creditLimit: 25000000,
      paymentTermDays: 15, ownerId: 'USR-05', status: 'active',
      tags: [], avgPaymentDays: 35, creditScore: 55, createdAt: '2026-06-12'
    },
    {
      id: 'CUS-07', code: 'KH-007', name: 'DNTN Hải Đăng', type: 'individual',
      taxId: '', email: 'haidang@haidang.vn', phone: '0938 777 999',
      address: '30 Hải Thượng Lãn Ông, Rạch Giá, Kiên Giang', creditLimit: 15000000,
      paymentTermDays: 15, ownerId: 'USR-02', status: 'active',
      tags: [], avgPaymentDays: 26, creditScore: 61, createdAt: '2026-07-01'
    },
    {
      id: 'CUS-08', code: 'KH-008', name: 'Công ty TNHH Mặt Trời Vàng', type: 'business',
      taxId: '0556677889', email: 'info@mattroivang.vn', phone: '0236 388 1122',
      address: '10 Bạch Đằng, Hải Châu, Đà Nẵng', creditLimit: 40000000,
      paymentTermDays: 30, ownerId: 'USR-02', status: 'archived',
      tags: ['Đã ngừng hợp tác'], avgPaymentDays: 20, creditScore: 70, createdAt: '2026-04-18'
    }
  ];

  // -----------------------------------------------------------------------
  // 3. Danh mục hàng hóa/dịch vụ (dùng khi sinh dữ liệu & autocomplete)
  // -----------------------------------------------------------------------
  const serviceCatalog = [
    { name: 'Dịch vụ kế toán tháng', unitPrice: 2500000 },
    { name: 'Tư vấn thuế quý', unitPrice: 1200000 },
    { name: 'Dịch vụ làm báo cáo tài chính', unitPrice: 4500000 },
    { name: 'Phí kiểm toán năm', unitPrice: 12000000 },
    { name: 'Tư vấn lao động – bảo hiểm', unitPrice: 3200000 },
    { name: 'Phí quản trị hệ thống', unitPrice: 5400000 },
    { name: 'Dịch vụ thành lập doanh nghiệp', unitPrice: 2800000 },
    { name: 'Đào tạo nội bộ', unitPrice: 6000000 }
  ];

  // -----------------------------------------------------------------------
  // 4. Hàm tiện ích nội bộ
  // -----------------------------------------------------------------------
  /** PRNG có seed — để dữ liệu sinh ra giống nhau mỗi lần chạy demo */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20261012);

  function addDays(iso, days) {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }
  function round(n, step) { return Math.round(n / step) * step; }

  /** Tính lại các trường tổng & trạng thái từ items + payments (nguồn sự thật duy nhất) */
  function normalizeInvoice(inv, payments) {
    const subtotal = inv.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const discountTotal = inv.items.reduce((s, it) => s + it.qty * it.unitPrice * (it.discountPct / 100), 0);
    const taxable = subtotal - discountTotal;
    const taxTotal = Math.round(taxable * inv.taxRate);
    const total = taxable + taxTotal;

    const paidAmount = payments
      .filter(p => p.invoiceId === inv.id && p.type === 'in' && p.status !== 'void')
      .reduce((s, p) => s + p.amount, 0);

    let status = inv.status;
    if (status !== 'draft' && status !== 'cancelled') {
      if (paidAmount >= total) status = INVOICE_STATUS.PAID;
      else if (paidAmount > 0) status = INVOICE_STATUS.PARTIAL;
      else if (daysBetween(inv.dueDate, TODAY) > 0) status = INVOICE_STATUS.OVERDUE;
      else status = INVOICE_STATUS.ISSUED;
    }

    return Object.assign({}, inv, {
      subtotal, discountTotal, taxTotal, total,
      paidAmount, remaining: total - paidAmount, status
    });
  }

  // -----------------------------------------------------------------------
  // 5. Hóa đơn — 10 hóa đơn viết tay (khớp wireframe) + 24 hóa đơn sinh tự động
  // -----------------------------------------------------------------------
  const invoices = [];
  const payments = [];
  const reminders = [];

  let invoiceSeq = 100;
  let paymentSeq = 20;
  let reminderSeq = 30;

  function makeItems(names) {
    return names.map((n, i) => {
      const s = serviceCatalog.find(c => c.name === n.name) || serviceCatalog[i % serviceCatalog.length];
      return {
        lineId: 'L' + (i + 1),
        name: n.name,
        qty: n.qty || 1,
        unitPrice: n.unitPrice != null ? n.unitPrice : (n.price != null ? n.price : s.unitPrice),
        discountPct: n.discountPct != null ? n.discountPct : (n.discount || 0)
      };
    });
  }

  function addInvoice(raw) {
    const inv = Object.assign({
      id: 'INV-' + String(invoiceSeq).padStart(4, '0'),
      currency: 'VND',
      taxRate: 0.1,
      note: '',
      attachments: [],
      createdBy: 'USR-01',
      createdAt: raw.issueDate + ' 09:12',
      updatedAt: raw.issueDate + ' 09:12',
      history: [
        { at: raw.issueDate + ' 09:12', action: 'Tạo hóa đơn', userId: 'USR-01' },
        { at: raw.issueDate + ' 09:40', action: 'Phát hành hóa đơn', userId: 'USR-01' }
      ]
    }, raw);
    inv.items = makeItems(raw.items);
    invoiceSeq++;
    invoices.push(inv);
    return inv;
  }

  function addPayment(raw) {
    const p = Object.assign({
      id: 'PAY-' + String(paymentSeq).padStart(4, '0'),
      type: 'in',
      method: 'transfer',
      status: 'matched',
      createdBy: 'USR-01',
      attachment: ''
    }, raw);
    paymentSeq++;
    payments.push(p);
    return p;
  }

  function addReminder(raw) {
    const r = Object.assign({
      id: 'REM-' + String(reminderSeq).padStart(4, '0'),
      channel: 'email',
      level: 1,
      source: 'manual',
      createdBy: 'USR-02',
      sentAt: null,
      openedAt: null
    }, raw);
    reminderSeq++;
    reminders.push(r);
    return r;
  }

  // ---- Các hóa đơn quan trọng (xuất hiện trong wireframe) ----
  addInvoice({ code: 'INV-2026-0142', customerId: 'CUS-01', issueDate: '2026-10-15', dueDate: '2026-11-14', orderCode: 'PO-8891', items: [{ name: 'Dịch vụ kế toán tháng', qty: 1 }, { name: 'Tư vấn thuế quý', qty: 1, discount: 5 }], note: 'Thanh toán trong vòng 30 ngày kể từ ngày phát hành.' });
  addInvoice({ code: 'INV-2026-0141', customerId: 'CUS-02', issueDate: '2026-10-12', dueDate: '2026-10-11', orderCode: 'PO-8877', items: [{ name: 'Dịch vụ kế toán tháng', qty: 1, price: 6200000 }, { name: 'Tư vấn thuế quý', qty: 1, price: 2000000 }] });
  addInvoice({ code: 'INV-2026-0140', customerId: 'CUS-03', issueDate: '2026-10-09', dueDate: '2026-11-08', orderCode: 'PO-8851', items: [{ name: 'Phí kiểm toán năm', qty: 1 }, { name: 'Dịch vụ làm báo cáo tài chính', qty: 1 }] });
  addInvoice({ code: 'INV-2026-0139', customerId: 'CUS-04', issueDate: '2026-10-05', dueDate: '2026-11-04', orderCode: 'PO-8840', status: 'draft', items: [{ name: 'Tư vấn lao động – bảo hiểm', qty: 1 }, { name: 'Đào tạo nội bộ', qty: 1 }] });
  addInvoice({ code: 'INV-2026-0138', customerId: 'CUS-05', issueDate: '2026-10-03', dueDate: '2026-11-02', items: [{ name: 'Phí quản trị hệ thống', qty: 1 }] });
  addInvoice({ code: 'INV-2026-0135', customerId: 'CUS-02', issueDate: '2026-09-28', dueDate: '2026-10-28', items: [{ name: 'Dịch vụ kế toán tháng', qty: 1, price: 6200000 }] });
  addInvoice({ code: 'INV-2026-0131', customerId: 'CUS-06', issueDate: '2026-09-20', dueDate: '2026-10-05', items: [{ name: 'Tư vấn thuế quý', qty: 1, price: 5400000 }] });
  addInvoice({ code: 'INV-2026-0121', customerId: 'CUS-01', issueDate: '2026-08-18', dueDate: '2026-09-17', items: [{ name: 'Dịch vụ kế toán tháng', qty: 1 }, { name: 'Tư vấn thuế quý', qty: 1 }] });
  addInvoice({ code: 'INV-2026-0118', customerId: 'CUS-04', issueDate: '2026-07-25', dueDate: '2026-08-28', items: [{ name: 'Phí kiểm toán năm', qty: 1 }, { name: 'Dịch vụ làm báo cáo tài chính', qty: 1 }] });
  addInvoice({ code: 'INV-2026-0095', customerId: 'CUS-02', issueDate: '2026-06-10', dueDate: '2026-07-10', items: [{ name: 'Dịch vụ thành lập doanh nghiệp', qty: 1 }, { name: 'Tư vấn thuế quý', qty: 1 }] });

  // ---- Sinh thêm 24 hóa đơn cho bảng (deterministic) ----
  const activeCustomers = customers.filter(c => c.status === 'active');
  for (let i = 0; i < 24; i++) {
    const cust = activeCustomers[Math.floor(rnd() * activeCustomers.length)];
    const issueOffset = -Math.floor(rnd() * 150) - 5; // trong 5 tháng gần nhất
    const issueDate = addDays(TODAY, issueOffset);
    const itemCount = 1 + Math.floor(rnd() * 3);
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const s = serviceCatalog[Math.floor(rnd() * serviceCatalog.length)];
      items.push({
        name: s.name,
        qty: 1 + Math.floor(rnd() * 2),
        unitPrice: round(s.unitPrice * (0.8 + rnd() * 0.6), 50000),
        discountPct: rnd() > 0.75 ? 5 : 0
      });
    }
    addInvoice({
      code: 'INV-2026-' + String(90 + i).padStart(4, '0'),
      customerId: cust.id,
      issueDate,
      dueDate: addDays(issueDate, cust.paymentTermDays),
      orderCode: 'PO-' + (8600 + i),
      items
    });
  }

  // ---- Phiếu thu ----
  addPayment({ code: 'PM-0021', customerId: 'CUS-02', invoiceId: invoices.find(i => i.code === 'INV-2026-0141').id, date: '2026-10-12', amount: 2000000, reference: 'FT261012881', method: 'transfer', note: 'Khách trả trước một phần', attachment: 'sao-ke-12-10.pdf' });
  addPayment({ code: 'PM-0020', customerId: 'CUS-03', invoiceId: invoices.find(i => i.code === 'INV-2026-0140').id, date: '2026-10-14', amount: 51300000, reference: 'FT261014002', method: 'transfer' });
  addPayment({ code: 'PM-0018', customerId: 'CUS-02', invoiceId: invoices.find(i => i.code === 'INV-2026-0135').id, date: '2026-10-14', amount: 6000000, reference: 'FT261014733', method: 'transfer', status: 'pending', note: 'Chờ đối chiếu: chênh lệch -200.000 ₫' });
  addPayment({ code: 'PM-0017', customerId: 'CUS-05', invoiceId: invoices.find(i => i.code === 'INV-2026-0138').id, date: '2026-10-13', amount: 5400000, reference: 'FT261013540', method: 'transfer' });
  addPayment({ code: 'PM-0015', customerId: 'CUS-01', invoiceId: invoices.find(i => i.code === 'INV-2026-0121').id, date: '2026-09-12', amount: 3708000, reference: 'FT260912110', method: 'transfer' });
  addPayment({ code: 'PM-0012', customerId: 'CUS-04', invoiceId: invoices.find(i => i.code === 'INV-2026-0118').id, date: '2026-08-05', amount: 15000000, reference: 'FT260805221', method: 'cash' });

  // ---- Nhắc nợ ----
  addReminder({ code: 'REM-0031', invoiceId: invoices.find(i => i.code === 'INV-2026-0142').id, customerId: 'CUS-01', channel: 'email', level: 2, status: 'draft', source: 'ai', subject: 'Nhắc thanh toán hóa đơn INV-2026-0142', body: 'Kính gửi Anh/Chị, chúng tôi xin phép nhắc về hóa đơn INV-2026-0142 trị giá 24.500.000 ₫…', scheduledAt: '2026-11-15 08:00', createdBy: 'USR-02' });
  addReminder({ code: 'REM-0030', invoiceId: invoices.find(i => i.code === 'INV-2026-0139').id, customerId: 'CUS-04', channel: 'zalo', level: 1, status: 'scheduled', scheduledAt: '2026-10-20 08:00', source: 'manual', subject: 'Nhắc nhẹ hạn thanh toán', body: 'Chào Anh/Chị, hóa đơn INV-2026-0139 sẽ đến hạn vào 04/11/2026.' });
  addReminder({ code: 'REM-0029', invoiceId: invoices.find(i => i.code === 'INV-2026-0121').id, customerId: 'CUS-01', channel: 'email', level: 1, status: 'opened', scheduledAt: '2026-10-12 08:00', sentAt: '2026-10-12 08:00', openedAt: '2026-10-12 10:22', source: 'manual', subject: 'Nhắc thanh toán hóa đơn INV-2026-0121', body: 'Chúng tôi xin cảm ơn sự hợp tác của Anh/Chị…' });
  addReminder({ code: 'REM-0028', invoiceId: invoices.find(i => i.code === 'INV-2026-0118').id, customerId: 'CUS-04', channel: 'email', level: 3, status: 'sent', scheduledAt: '2026-09-28 08:00', sentAt: '2026-09-28 08:00', source: 'manual', subject: 'Thông báo nợ quá hạn nghiêm trọng', body: 'Hóa đơn INV-2026-0118 đã quá hạn 31 ngày…' });

  // -----------------------------------------------------------------------
  // 6. Kế hoạch xử lý nợ
  // -----------------------------------------------------------------------
  const debtPlans = [
    {
      id: 'PLAN-012', code: 'PLAN-012', customerId: 'CUS-02', status: 'pending',
      createdBy: 'USR-02', reviewerId: 'USR-03', createdAt: '2026-10-12',
      expectedAmount: 30000000, expectedDate: '2026-11-30',
      problem: 'Nợ quá hạn 12 ngày, tổng 38.200.000 ₫, đã hứa trả 1 lần nhưng thất bại.',
      steps: [
        { name: 'Gọi điện xác nhận', dueDate: '2026-10-15', ownerId: 'USR-02', state: 'done' },
        { name: 'Gửi thư nhắc mức 2', dueDate: '2026-10-18', ownerId: 'USR-02', state: 'doing' },
        { name: 'Đề nghị trả góp 3 đợt', dueDate: '2026-10-22', ownerId: 'USR-02', state: 'pending' },
        { name: 'Chuyển pháp chế nếu quá hạn', dueDate: '2026-10-30', ownerId: 'USR-01', state: 'notstart' }
      ]
    },
    {
      id: 'PLAN-011', code: 'PLAN-011', customerId: 'CUS-04', status: 'approved',
      createdBy: 'USR-02', reviewerId: 'USR-03', createdAt: '2026-10-02',
      expectedAmount: 25000000, expectedDate: '2026-11-15',
      problem: 'Nợ quá hạn 45 ngày trên INV-2026-0118.',
      steps: [{ name: 'Thỏa thuận trả góp 2 đợt', dueDate: '2026-10-10', ownerId: 'USR-02', state: 'done' }]
    },
    {
      id: 'PLAN-010', code: 'PLAN-010', customerId: 'CUS-06', status: 'rejected',
      createdBy: 'USR-05', reviewerId: 'USR-03', createdAt: '2026-09-25',
      rejectReason: 'Chưa có bằng chứng khách hàng đã xác nhận lịch trả nợ. Bổ sung biên bản làm việc.',
      expectedAmount: 5400000, expectedDate: '2026-10-20',
      problem: 'Nợ quá hạn trên INV-2026-0131.',
      steps: [{ name: 'Gọi điện nhắc nợ', dueDate: '2026-09-30', ownerId: 'USR-05', state: 'done' }]
    }
  ];

  // -----------------------------------------------------------------------
  // 7. Sao kê ngân hàng (dùng cho màn Đối chiếu)
  // -----------------------------------------------------------------------
  const bankTransactions = [
    { id: 'GDS-001', date: '2026-10-12', amount: 2000000, content: 'CK 0141 THANH TOAN HOA DON', matchStatus: 'matched', invoiceCode: 'INV-2026-0141', paymentId: 'PAY-0021' },
    { id: 'GDS-002', date: '2026-10-13', amount: 5400000, content: 'CK 0138 HOA DON THANG 9', matchStatus: 'matched', invoiceCode: 'INV-2026-0138', paymentId: 'PAY-0017' },
    { id: 'GDS-003', date: '2026-10-14', amount: 6000000, content: 'CK 0135 MINH ANH', matchStatus: 'diff', invoiceCode: 'INV-2026-0135', diffAmount: -200000, diffReason: 'discount', suggestion: 'Chiết khấu thanh toán sớm 200.000 ₫' },
    { id: 'GDS-004', date: '2026-10-15', amount: 1000000, content: 'CHUYEN KHOAN NGUYEN VAN B', matchStatus: 'unmatched', invoiceCode: null },
    { id: 'GDS-005', date: '2026-10-16', amount: 51300000, content: 'CK 0140 PHUOC THANH', matchStatus: 'matched', invoiceCode: 'INV-2026-0140', paymentId: 'PAY-0020' }
  ];

  // -----------------------------------------------------------------------
  // 8. Cấu hình hệ thống
  // -----------------------------------------------------------------------
  const settings = {
    invoiceTemplate: 'Mẫu 01 - A4',
    prefix: 'INV',
    yearFormat: 'YYYY',
    seqDigits: 4,
    nextNumber: 143,
    defaultTaxRate: 0.1,
    defaultTermDays: 30,
    currency: 'VND',
    logo: 'assets/logo.svg',
    companyName: 'Công ty TNHH Dịch vụ Kế toán An Nhiên',
    companyTaxId: '0312345678',
    companyAddress: '42 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
    reminderRules: [
      { daysAfterDue: 3, channel: 'email', template: 'Mẫu nhắc nhẹ', active: true },
      { daysAfterDue: 7, channel: 'email', template: 'Mẫu nhắc lần 2', active: true },
      { daysAfterDue: 15, channel: 'email+zalo', template: 'Mẫu nghiêm khắc', active: true }
    ],
    anomalyThresholds: {
      amountWarn: 100000000,
      checkDuplicateNumber: true,
      checkDueDateInPast: true,
      checkMissingRequired: true,
      defaultSeverity: 'medium'
    }
  };

  // -----------------------------------------------------------------------
  // 9. Nhật ký hoạt động
  // -----------------------------------------------------------------------
  const activityLogs = [
    { id: 'LOG-101', time: '2026-10-12 09:40:21', userId: 'USR-01', action: 'Phát hành hóa đơn', targetType: 'invoice', targetCode: 'INV-2026-0142', ip: '10.0.0.5', meta: { total: 24500000 } },
    { id: 'LOG-100', time: '2026-10-12 09:12:03', userId: 'USR-01', action: 'Tạo hóa đơn', targetType: 'invoice', targetCode: 'INV-2026-0142', ip: '10.0.0.5', meta: {} },
    { id: 'LOG-099', time: '2026-10-11 16:22:10', userId: 'USR-03', action: 'Duyệt kế hoạch xử lý nợ', targetType: 'plan', targetCode: 'PLAN-011', ip: '10.0.0.2', meta: {} },
    { id: 'LOG-098', time: '2026-10-11 14:01:55', userId: 'USR-04', action: 'Sửa cấu hình nhắc nợ', targetType: 'settings', targetCode: 'SETTINGS', ip: '10.0.0.8', meta: { field: 'reminderRules' } },
    { id: 'LOG-097', time: '2026-10-10 11:45:12', userId: 'USR-02', action: 'Tạo nhắc nợ bằng AI', targetType: 'reminder', targetCode: 'REM-0031', ip: '10.0.0.3', meta: { source: 'ai' } },
    { id: 'LOG-096', time: '2026-10-09 08:30:44', userId: 'USR-01', action: 'Ghi nhận phiếu thu', targetType: 'payment', targetCode: 'PM-0020', ip: '10.0.0.5', meta: { amount: 51300000 } }
  ];

  // Chuẩn hóa trạng thái & tổng tiền cho toàn bộ hóa đơn
  for (let i = 0; i < invoices.length; i++) {
    invoices[i] = normalizeInvoice(invoices[i], payments);
  }

  // -----------------------------------------------------------------------
  // 10. Export
  // -----------------------------------------------------------------------
  window.MOCK = {
    TODAY,
    CURRENT_USER_ID,
    INVOICE_STATUS,
    STATUS_LABEL,
    ROLES,
    serviceCatalog,
    DB: {
      users, customers, invoices, payments, reminders,
      debtPlans, bankTransactions, settings, activityLogs
    },
    debtPlans: [
      {
        id: 'pl-1', code: 'KP-2026-014', customerId: 'cus-1', customerName: 'Công ty TNHH An Phát',
        amount: 86400000, method: 'Thanh toán nhiều kỳ', deadline: '2026-12-20',
        owner: 'Nguyễn Văn A', role: 'mine', status: 'pending', stale: false,
        trace: [
          { time: '12/10/2026 · 08:30', actor: 'Nguyễn Văn A', action: 'Tạo kế hoạch', tone: 'info', note: 'Công nợ quá hạn 32 ngày.' },
          { time: '12/10/2026 · 09:14', actor: 'Nguyễn Văn A', action: 'Gửi duyệt', tone: 'info', note: 'Đề xuất chia 3 kỳ, mỗi kỳ 28.800.000 ₫.' }
        ]
      },
      {
        id: 'pl-2', code: 'KP-2026-013', customerId: 'cus-4', customerName: 'Công ty Cổ phần Phúc Lộc',
        amount: 41250000, method: 'Chiết khấu thanh toán sớm', deadline: '2026-11-30',
        owner: 'Trần Thị B', role: 'awaiting', status: 'pending', stale: true,
        trace: [
          { time: '11/10/2026 · 14:02', actor: 'Trần Thị B', action: 'Tạo kế hoạch', tone: 'info', note: 'Đề xuất chiết khấu 2% nếu trả trước 15/11.' },
          { time: '12/10/2026 · 10:22', actor: 'Lê Văn C', action: 'Cập nhật số tiền', tone: 'warn', note: 'Điều chỉnh từ 39.500.000 ₫ lên 41.250.000 ₫.' }
        ]
      },
      {
        id: 'pl-3', code: 'KP-2026-012', customerId: 'cus-2', customerName: 'Doanh nghiệp tư nhân Minh Tuấn',
        amount: 23800000, method: 'Gia hạn công nợ', deadline: '2027-01-15',
        owner: 'Phạm Văn D', role: 'team', status: 'approved', stale: false,
        trace: [
          { time: '09/10/2026 · 11:40', actor: 'Phạm Văn D', action: 'Tạo kế hoạch', tone: 'info', note: '' },
          { time: '10/10/2026 · 08:55', actor: 'Trần Thị B', action: 'Duyệt kế hoạch', tone: 'ok', note: 'Đồng ý gia hạn thêm 60 ngày.' }
        ]
      },
      {
        id: 'pl-4', code: 'KP-2026-011', customerId: 'cus-5', customerName: 'Công ty TNHH Hoàng Gia',
        amount: 112000000, method: 'Chuyển bộ phận pháp lý', deadline: '2026-11-05',
        owner: 'Nguyễn Văn A', role: 'mine', status: 'rejected', stale: false,
        trace: [
          { time: '07/10/2026 · 16:10', actor: 'Nguyễn Văn A', action: 'Tạo kế hoạch', tone: 'info', note: 'Quá hạn 96 ngày, khách không phản hồi.' },
          { time: '08/10/2026 · 09:25', actor: 'Trần Thị B', action: 'Từ chối', tone: 'bad', note: 'Chưa đủ căn cứ pháp lý. Cần thêm 2 lần xác nhận công nợ bằng văn bản.' }
        ]
      },
      {
        id: 'pl-5', code: 'KP-2026-010', customerId: 'cus-7', customerName: 'Công ty TNHH Dịch vụ Sao Việt',
        amount: 35000000, method: 'Thanh toán nhiều kỳ', deadline: '2026-12-31',
        owner: 'Lê Văn C', role: 'team', status: 'executing', stale: false,
        trace: [
          { time: '05/10/2026 · 10:00', actor: 'Lê Văn C', action: 'Tạo kế hoạch', tone: 'info', note: 'Chia 2 kỳ.' },
          { time: '06/10/2026 · 13:30', actor: 'Trần Thị B', action: 'Duyệt kế hoạch', tone: 'ok', note: '' },
          { time: '11/10/2026 · 09:00', actor: 'Lê Văn C', action: 'Ghi nhận kỳ 1', tone: 'ok', note: 'Đã thu 17.500.000 ₫.' }
        ]
      }
    ],
    reconciliation: {
      period: '2026-10',
      account: 'VCB · 0071 0004 12345',
      statement: {
        file: 'sao-ke-VCB-T10-2026.xlsx', bank: 'Vietcombank',
        uploadedBy: 'Nguyễn Văn A', uploadedAt: '12/10/2026 · 08:05',
        rows: 128, debitTotal: 4286500000, creditTotal: 2914300000
      },
      summary: { matched: 96, partial: 21, unmatched: 11, matchedAmount: 4102750000, diffAmount: 183750000, rate: 90.6 },
      stale: false,
      matches: [
        { id: 'm-1', ledger: { ref: 'PT-2026-0412', date: '02/10/2026', party: 'Công ty TNHH An Phát', amount: 86400000 },
          bank: { ref: 'VCB/2610/004112', date: '02/10/2026', content: 'THANH TOAN HOA DON HD-2026-0281', amount: 86400000 },
          confidence: 100, status: 'matched' },
        { id: 'm-2', ledger: { ref: 'PT-2026-0415', date: '03/10/2026', party: 'Công ty Cổ phần Phúc Lộc', amount: 41250000 },
          bank: { ref: 'VCB/2610/004130', date: '03/10/2026', content: 'CHUYEN KHOAN PHUC LOC', amount: 41250000 },
          confidence: 97, status: 'matched' },
        { id: 'm-3', ledger: { ref: 'PT-2026-0418', date: '05/10/2026', party: 'Doanh nghiệp tư nhân Minh Tuấn', amount: 23800000 },
          bank: { ref: 'VCB/2610/004158', date: '06/10/2026', content: 'TT CONG NO T10', amount: 23800000 },
          confidence: 72, status: 'partial' },
        { id: 'm-4', ledger: { ref: 'PT-2026-0421', date: '07/10/2026', party: 'Công ty TNHH Hoàng Gia', amount: 112000000 },
          bank: { ref: '—', date: '—', content: 'Không tìm thấy dòng tương ứng', amount: 0 },
          confidence: 0, status: 'unmatched' },
        { id: 'm-5', ledger: { ref: 'PT-2026-0426', date: '09/10/2026', party: 'Công ty TNHH Dịch vụ Sao Việt', amount: 35000000 },
          bank: { ref: 'VCB/2610/004201', date: '09/10/2026', content: 'SAO VIET TT DOT 1', amount: 35000000 },
          confidence: 99, status: 'matched' },
        { id: 'm-6', ledger: { ref: 'PT-2026-0429', date: '10/10/2026', party: 'Công ty TNHH Bình Minh', amount: 19500000 },
          bank: { ref: 'VCB/2610/004233', date: '10/10/2026', content: 'BINH MINH TT 19.500.000', amount: 19000000 },
          confidence: 64, status: 'partial' }
      ],
      exceptions: [
        { id: 'ex-1', type: 'Lệch số tiền', ref: 'PT-2026-0429', party: 'Công ty TNHH Bình Minh',
          amount: 19500000, diff: -500000, note: 'Ngân hàng ghi nhận thiếu 500.000 ₫ so với chứng từ.', status: 'open', stale: false },
        { id: 'ex-2', type: 'Sai ngày ghi', ref: 'PT-2026-0418', party: 'DNTN Minh Tuấn',
          amount: 23800000, diff: 0, note: 'Sao kê lệch 1 ngày so với sổ cái.', status: 'open', stale: false },
        { id: 'ex-3', type: 'Không có chứng từ', ref: '—', party: 'Không xác định',
          amount: 75000000, diff: 75000000, note: 'Dòng thu trên sao kê chưa có phiếu thu tương ứng.', status: 'open', stale: true },
        { id: 'ex-4', type: 'Trùng chứng từ', ref: 'PT-2026-0402', party: 'Công ty TNHH An Phát',
          amount: 12500000, diff: 12500000, note: 'Hai dòng sao kê cùng tham chiếu một phiếu thu.', status: 'open', stale: false },
        { id: 'ex-5', type: 'Lệch số tiền', ref: 'PT-2026-0388', party: 'Công ty Cổ phần Phúc Lộc',
          amount: 48000000, diff: 2500000, note: 'Phí ngân hàng bị trừ vào tiền thu.', status: 'resolved', stale: false,
          resolution: 'Ghi nhận chênh lệch', resolvedBy: 'Trần Thị B', resolvedAt: '11/10/2026 · 15:20' }
      ],
      trace: [
        { time: '12/10/2026 · 08:05', actor: 'Nguyễn Văn A', action: 'Nhập sao kê ngân hàng', tone: 'info', note: 'Tệp sao-ke-VCB-T10-2026.xlsx · 128 dòng.' },
        { time: '12/10/2026 · 08:12', actor: 'Hệ thống', action: 'Đối chiếu tự động', tone: 'ok', note: 'Khớp 96/128 dòng, tỷ lệ 90,6%.' },
        { time: '11/10/2026 · 15:20', actor: 'Trần Thị B', action: 'Xử lý lệch lệch PT-2026-0388', tone: 'warn', note: 'Ghi nhận chênh lệch phí ngân hàng 2.500.000 ₫.' }
      ]
    },
    // tiện ích cho api.js
    _internals: { normalizeInvoice, addDays, daysBetween, mulberry32 },
    balances: {
      period: '2026-10',
      stale: false,
      customers: [
        { id: 'cus-01', code: 'KH-0012', name: 'Công ty TNHH An Phát', owner: 'Phạm Thu Hà',
          limit: 500000000, aging: { b1: 172500000, b2: 60000000, b3: 0, b4: 152500000 },
          lastActivity: '10/10/2026', oldest: '12/07/2026', stale: false,
          statement: [
            { date: '12/07/2026', ref: 'HD-2026-0181', desc: 'Bán hàng theo hợp đồng HĐ-2026-08', debit: 120000000, credit: 0 },
            { date: '25/07/2026', ref: 'PT-2026-0210', desc: 'Thu tiền chuyển khoản', debit: 0, credit: 60000000 },
            { date: '05/08/2026', ref: 'HD-2026-0233', desc: 'Bán hàng hóa đơn tháng 08', debit: 95000000, credit: 0 },
            { date: '30/08/2026', ref: 'PT-2026-0288', desc: 'Thu tiền mặt tại quỹ', debit: 0, credit: 40000000 },
            { date: '12/09/2026', ref: 'HD-2026-0301', desc: 'Bán hàng theo hợp đồng HĐ-2026-11', debit: 185000000, credit: 0 },
            { date: '10/10/2026', ref: 'HD-2026-0344', desc: 'Bán hàng hóa đơn tháng 10', debit: 85000000, credit: 0 }
          ] },
        { id: 'cus-02', code: 'KH-0027', name: 'Công ty Cổ phần Phúc Lộc', owner: 'Phạm Thu Hà',
          limit: 800000000, aging: { b1: 262000000, b2: 150000000, b3: 0, b4: 0 },
          lastActivity: '28/09/2026', oldest: '20/08/2026', stale: true,
          statement: [
            { date: '20/08/2026', ref: 'HD-2026-0245', desc: 'Bán hàng hóa đơn tháng 08', debit: 212000000, credit: 0 },
            { date: '02/09/2026', ref: 'PT-2026-0301', desc: 'Thu tiền chuyển khoản', debit: 0, credit: 80000000 },
            { date: '18/09/2026', ref: 'HD-2026-0318', desc: 'Bán hàng hóa đơn tháng 09', debit: 190000000, credit: 0 },
            { date: '28/09/2026', ref: 'HD-2026-0330', desc: 'Bổ sung hàng theo phụ lục 02', debit: 90000000, credit: 0 }
          ] },
        { id: 'cus-03', code: 'KH-0033', name: 'Doanh nghiệp tư nhân Minh Tuấn', owner: 'Đỗ Quốc Huy',
          limit: 300000000, aging: { b1: 187000000, b2: 60000000, b3: 0, b4: 41000000 },
          lastActivity: '06/10/2026', oldest: '15/07/2026', stale: false,
          statement: [
            { date: '15/07/2026', ref: 'HD-2026-0190', desc: 'Bán hàng hóa đơn tháng 07', debit: 141000000, credit: 0 },
            { date: '22/08/2026', ref: 'PT-2026-0275', desc: 'Thu tiền chuyển khoản', debit: 0, credit: 45000000 },
            { date: '12/09/2026', ref: 'HD-2026-0305', desc: 'Bán hàng hóa đơn tháng 09', debit: 152000000, credit: 0 },
            { date: '06/10/2026', ref: 'HD-2026-0352', desc: 'Bán lẻ phát sinh ngoài hợp đồng', debit: 40000000, credit: 0 }
          ] },
        { id: 'cus-04', code: 'KH-0041', name: 'Công ty TNHH Hoàng Gia', owner: 'Đỗ Quốc Huy',
          limit: 600000000, aging: { b1: 222000000, b2: 180000000, b3: 0, b4: 210000000 },
          lastActivity: '08/10/2026', oldest: '12/07/2026', stale: false,
          statement: [
            { date: '12/07/2026', ref: 'HD-2026-0185', desc: 'Bán hàng theo hợp đồng HĐ-2026-05', debit: 210000000, credit: 0 },
            { date: '05/08/2026', ref: 'HD-2026-0238', desc: 'Bán hàng hóa đơn tháng 08', debit: 180000000, credit: 0 },
            { date: '20/08/2026', ref: 'PT-2026-0280', desc: 'Thu tiền chuyển khoản một phần', debit: 0, credit: 60000000 },
            { date: '14/09/2026', ref: 'HD-2026-0310', desc: 'Bán hàng hóa đơn tháng 09', debit: 172000000, credit: 0 },
            { date: '08/10/2026', ref: 'HD-2026-0356', desc: 'Bán hàng hóa đơn tháng 10', debit: 110000000, credit: 0 }
          ] },
        { id: 'cus-05', code: 'KH-0055', name: 'Công ty TNHH Dịch vụ Sao Việt', owner: 'Phạm Thu Hà',
          limit: 250000000, aging: { b1: 61000000, b2: 35000000, b3: 0, b4: 0 },
          lastActivity: '09/10/2026', oldest: '25/09/2026', stale: false,
          statement: [
            { date: '25/09/2026', ref: 'HD-2026-0322', desc: 'Bán hàng hóa đơn tháng 09', debit: 61000000, credit: 0 },
            { date: '09/10/2026', ref: 'HD-2026-0360', desc: 'Bán hàng hóa đơn tháng 10', debit: 35000000, credit: 0 }
          ] },
        { id: 'cus-06', code: 'KH-0062', name: 'Công ty TNHH Bình Minh', owner: 'Đỗ Quốc Huy',
          limit: 400000000, aging: { b1: 236000000, b2: 0, b3: 0, b4: 18000000 },
          lastActivity: '30/09/2026', oldest: '10/08/2026', stale: false,
          statement: [
            { date: '10/08/2026', ref: 'HD-2026-0240', desc: 'Bán hàng hóa đơn tháng 08', debit: 236000000, credit: 0 },
            { date: '30/09/2026', ref: 'HD-2026-0334', desc: 'Bán hàng hóa đơn tháng 09', debit: 18000000, credit: 0 }
          ] }
      ],
      trace: [
        { time: '12/10/2026 · 09:20', actor: 'Phạm Thu Hà', action: 'Gửi bảng kê công nợ', tone: 'ok', note: 'Công ty TNHH An Phát · kỳ 10/2026.' },
        { time: '10/10/2026 · 14:05', actor: 'Đỗ Quốc Huy', action: 'Ghi nhận thu tiền', tone: 'info', note: 'Công ty TNHH Hoàng Gia · 60.000.000 ₫.' },
        { time: '08/10/2026 · 08:40', actor: 'Hệ thống', action: 'Cập nhật tuổi nợ', tone: 'warn', note: '3 khách hàng vượt ngưỡng cảnh báo quá hạn.' }
      ]
    },
    invoiceDetail: {
      'HD-2026-0731': {
        id: 'inv-0731',
        code: 'HD-2026-0731',
        series: 'C25TAA',
        no: '0000731',
        form: 'Mẫu số 01-2/2026',
        type: 'Hóa đơn GTGT bán hàng',
        status: 'overdue',
        statusLabel: 'Quá hạn thanh toán',
        issuedAt: '12/06/2026',
        dueAt: '12/07/2026',
        daysLate: 92,
        seller: {
          name: 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ SƠN HẢI',
          taxCode: '0301 528 117',
          address: '48 Nguyễn Thị Minh Khai, P. Bến Nghé, Q. 1, TP. Hồ Chí Minh',
          bank: 'Vietcombank CN Sài Gòn · 0071 0004 12886'
        },
        buyer: {
          code: 'KH-0012',
          name: 'Công ty TNHH An Phát',
          taxCode: '0302 881 402',
          address: '112 Đường số 6, P. An Lạc, Q. Bình Tân, TP. Hồ Chí Minh',
          contact: 'Nguyễn Thị Hạnh · 0912 440 155',
          email: 'nhaplieu@anphat.com.vn'
        },
        order: { code: 'DH-2026-0431', date: '10/06/2026' },
        contract: 'HĐKT-2026-014',
        warehouse: 'Kho Bình Tân',
        paymentTerm: 'Chuyển khoản trong 30 ngày',
        salesChannel: 'Hợp đồng năm 2026',
        createdBy: 'Phạm Thu Hà',
        editable: false,
        sentCount: 2,
        customerConfirmed: true,
        stale: false,
        lines: [
          { name: 'Xi măng Hà Tiên PCB40', sku: 'VL-XM-050', unit: 'bao 50 kg', qty: 800, price: 78000, amount: 62400000 },
          { name: 'Thép cây Hòa Phát D14', sku: 'VL-TP-D14', unit: 'cây 11,7 m', qty: 280, price: 285000, amount: 79800000 },
          { name: 'Gạch Tuynel 6 lỗ đặc', sku: 'VL-GT-6L', unit: 'viên', qty: 22000, price: 1850, amount: 40700000 },
          { name: 'Cát vàng xây tô', sku: 'VL-CV-001', unit: 'm³', qty: 60, price: 245000, amount: 14700000 }
        ],
        summary: {
          gross: 197600000,
          discount: 840741,
          discountLabel: 'Chiết khấu hợp đồng (làm tròn giá trị hóa đơn)',
          net: 196759259,
          vatRate: 8,
          vat: 15740741,
          total: 212500000,
          paid: 60000000,
          remaining: 152500000,
          words: 'Hai trăm mười hai triệu năm trăm nghìn đồng chẵn.'
        },
        payments: [
          { date: '25/06/2026', content: 'Thanh toán trước hạn theo hợp đồng', method: 'Chuyển khoản',
            bank: 'Vietcombank · CN Sài Gòn', ref: 'GD-260625-118', amount: 60000000, remaining: 152500000 }
        ],
        aging: [
          { label: '0–30 ngày', amount: 0 },
          { label: '31–60 ngày', amount: 0 },
          { label: '61–90 ngày', amount: 0 },
          { label: 'Trên 90 ngày', amount: 152500000 }
        ],
        timeline: [
          { time: '12/06/2026 · 09:12', actor: 'Hệ thống', action: 'Phát hành hóa đơn', tone: 'info',
            note: 'Lập từ đơn hàng DH-2026-0431, tổng giá trị 212.500.000 ₫.' },
          { time: '13/06/2026 · 10:30', actor: 'Phạm Thu Hà', action: 'Gửi hóa đơn qua Email', tone: 'ok',
            note: 'Đã gửi tới nhaplieu@anphat.com.vn kèm bảng kê chi tiết.' },
          { time: '14/06/2026 · 15:02', actor: 'Khách hàng', action: 'Xác nhận đã nhận hóa đơn', tone: 'ok',
            note: 'Kế toán khách hàng phản hồi qua email, không có sai lệch.' },
          { time: '25/06/2026 · 11:20', actor: 'Nguyễn Văn Minh', action: 'Ghi nhận thanh toán', tone: 'ok',
            note: '60.000.000 ₫ qua chuyển khoản Vietcombank, mã GD-260625-118.' },
          { time: '12/07/2026 · 00:05', actor: 'Hệ thống', action: 'Cảnh báo quá hạn thanh toán', tone: 'bad',
            note: 'Còn nợ 152.500.000 ₫ sau hạn thanh toán 12/07/2026.' },
          { time: '08/10/2026 · 09:05', actor: 'Phạm Thu Hà', action: 'Gửi nhắc nợ lần 1', tone: 'warn',
            note: 'Email · khách hàng đã mở thư, chưa có phản hồi.' }
        ]
      }
    },
    invoiceAging: {
      totalOverdue: 520000000,
      buckets: [
        { label: '1–30 ngày', amount: 47000000, invoices: 4, customers: 3 },
        { label: '31–60 ngày', amount: 112500000, invoices: 7, customers: 4 },
        { label: '61–90 ngày', amount: 208000000, invoices: 6, customers: 3 },
        { label: 'Trên 90 ngày', amount: 152500000, invoices: 2, customers: 1 }
      ]
    },
    receivableOverview: {
      period: '10/2026',
      updatedAt: '12/10/2026 · 14:05',
      total: 3084000000,
      overdue: 520000000,
      dueSoon: 1385000000,
      later: 1179000000,
      customerCount: 20,
      invoiceCount: 85,
      overdueCustomers: 11,
      collected: 412000000,
      target: 600000000,
      daysLeft: 12,
      pendingApprovals: 4,
      pendingValue: 642500000,
      deltas: { total: 6.4, overdue: -3.2, dueSoon: 11.8 },
      aging: [
        { label: '1–30 ngày', amount: 47000000, customers: 3, invoices: 4, risk: 'low' },
        { label: '31–60 ngày', amount: 112500000, customers: 4, invoices: 7, risk: 'mid' },
        { label: '61–90 ngày', amount: 208000000, customers: 3, invoices: 6, risk: 'high' },
        { label: 'Trên 90 ngày', amount: 152500000, customers: 1, invoices: 2, risk: 'severe' }
      ],
      dueSchedule: [
        { label: 'Trong 7 ngày tới', amount: 1385000000, note: '9 hóa đơn · 6 khách hàng' },
        { label: '8 – 30 ngày tới', amount: 862000000, note: '14 hóa đơn · 8 khách hàng' },
        { label: '31 – 60 ngày tới', amount: 317000000, note: '6 hóa đơn · 4 khách hàng' }
      ],
      targetWeeks: [
        { label: 'Tuần 1', amount: 145000000 },
        { label: 'Tuần 2', amount: 118000000 },
        { label: 'Tuần 3', amount: 92000000 },
        { label: 'Tuần 4', amount: 57000000, current: true }
      ],
      topOverdue: [
        { code: 'KH-0012', name: 'Công ty TNHH An Phát', owner: 'Phạm Thu Hà',
          balance: 385000000, overdue: 152500000, dueAt: '12/07/2026', daysLate: 92,
          promise: 'Chưa chốt lịch', risk: 'Cao', riskLevel: 'severe' },
        { code: 'KH-0045', name: 'Công ty TNHH Thương mại Bình Minh', owner: 'Trần Quốc Hưng',
          balance: 312000000, overdue: 98000000, dueAt: '18/07/2026', daysLate: 86,
          promise: '28/10/2026 · 60.000.000 ₫', risk: 'Trung bình', riskLevel: 'high' },
        { code: 'KH-0021', name: 'Công ty TNHH Sản xuất Thiên Hà', owner: 'Lê Thị Hồng Gấm',
          balance: 268000000, overdue: 75000000, dueAt: '03/08/2026', daysLate: 70,
          promise: '15/10/2026 · 75.000.000 ₫', risk: 'Cao', riskLevel: 'high' },
        { code: 'KH-0088', name: 'Cửa hàng vật tư Phước Lộc', owner: 'Phạm Thu Hà',
          balance: 190000000, overdue: 40000000, dueAt: '22/08/2026', daysLate: 43,
          promise: '25/10/2026 · 40.000.000 ₫', risk: 'Thấp', riskLevel: 'mid' },
        { code: 'KH-0064', name: 'Công ty CP Xây dựng Phú Thịnh', owner: 'Phạm Thu Hà',
          balance: 224000000, overdue: 25000000, dueAt: '15/09/2026', daysLate: 29,
          promise: '22/10/2026 · 25.000.000 ₫', risk: 'Thấp', riskLevel: 'low' }
      ],
      collectors: [
        { name: 'Phạm Thu Hà', role: 'Nhân viên kinh doanh', customers: 4, overdue: 258500000,
          collected: 168000000, reminders: 12, responseRate: 72 },
        { name: 'Trần Quốc Hưng', role: 'Nhân viên kinh doanh', customers: 3, overdue: 132000000,
          collected: 104000000, reminders: 9, responseRate: 64 },
        { name: 'Lê Thị Hồng Gấm', role: 'Nhân viên kinh doanh', customers: 2, overdue: 87500000,
          collected: 92000000, reminders: 7, responseRate: 81 },
        { name: 'Vũ Anh Tuấn', role: 'Nhân viên kinh doanh', customers: 2, overdue: 42000000,
          collected: 48000000, reminders: 5, responseRate: 58 }
      ]
    },
    overdueInvoices: [
    { id: 'OI-001', code: 'HD-2026-0731', customerId: 'KH-0012', customerName: 'Công ty TNHH An Phát',
      owner: 'Phạm Thu Hà', issuedAt: '12/06/2026', dueAt: '12/07/2026',
      total: 212500000, paid: 60000000, remaining: 152500000,
      status: 'dispute', statusText: 'Chờ xác nhận đối chiếu',
      promiseDate: null, promiseAmount: 0,
      lastContact: '09/10/2026 · Gọi lần 2, khách xin thêm thời gian đối chiếu',
      caseId: null,
      timeline: [
        { date: '12/06/2026', user: 'Hệ thống', type: 'system', text: 'Phát hành hóa đơn 212.500.000 ₫ cho Công ty TNHH An Phát' },
        { date: '12/07/2026', user: 'Hệ thống', type: 'system', text: 'Hóa đơn đến hạn thanh toán, còn phải thu 152.500.000 ₫' },
        { date: '24/07/2026', user: 'Phạm Thu Hà', type: 'mail', text: 'Gửi email nhắc nợ lần 1 cho khách hàng' },
        { date: '10/09/2026', user: 'Phạm Thu Hà', type: 'note', text: 'Khách xác nhận đã nhận email, đang đối chiếu nội bộ' },
        { date: '09/10/2026', user: 'Phạm Thu Hà', type: 'call', text: 'Gọi lần 2 — khách xin thêm thời gian, chưa chốt lịch thanh toán' }
      ] },
    { id: 'OI-002', code: 'HD-2026-0722', customerId: 'KH-0045', customerName: 'Công ty TNHH Thương mại Bình Minh',
      owner: 'Trần Quốc Hưng', issuedAt: '18/06/2026', dueAt: '18/07/2026',
      total: 230000000, paid: 132000000, remaining: 98000000,
      status: 'dispute', statusText: 'Hóa đơn chưa được xác nhận',
      promiseDate: '28/10/2026', promiseAmount: 60000000,
      lastContact: '08/10/2026 · Hẹn làm việc với kế toán trưởng',
      caseId: 'CASE-1042',
      timeline: [
        { date: '18/06/2026', user: 'Hệ thống', type: 'system', text: 'Phát hành hóa đơn 230.000.000 ₫ cho Công ty TNHH Thương mại Bình Minh' },
        { date: '18/07/2026', user: 'Hệ thống', type: 'system', text: 'Hóa đơn đến hạn thanh toán, còn phải thu 98.000.000 ₫' },
        { date: '02/08/2026', user: 'Trần Quốc Hưng', type: 'mail', text: 'Gửi email nhắc nợ lần 1' },
        { date: '21/09/2026', user: 'Hệ thống', type: 'note', text: 'Tạo hồ sơ bất thường CASE-1042 — hóa đơn chưa được xác nhận' },
        { date: '08/10/2026', user: 'Trần Quốc Hưng', type: 'call', text: 'Hẹn làm việc với kế toán trưởng, cam kết thu 60.000.000 ₫ trước 28/10/2026' }
      ] },
    { id: 'OI-003', code: 'HD-2026-0741', customerId: 'KH-0021', customerName: 'Công ty TNHH Sản xuất Thiên Hà',
      owner: 'Lê Thị Hồng Gấm', issuedAt: '04/07/2026', dueAt: '03/08/2026',
      total: 45000000, paid: 0, remaining: 45000000,
      status: 'dispute', statusText: 'Phản đối chiết khấu 48.500.000 ₫',
      promiseDate: '15/10/2026', promiseAmount: 45000000,
      lastContact: '06/10/2026 · Chờ phòng kinh doanh xác nhận mức chiết khấu',
      caseId: 'CASE-1047' },
    { id: 'OI-004', code: 'HD-2026-0753', customerId: 'KH-0021', customerName: 'Công ty TNHH Sản xuất Thiên Hà',
      owner: 'Lê Thị Hồng Gấm', issuedAt: '09/07/2026', dueAt: '08/08/2026',
      total: 30000000, paid: 0, remaining: 30000000,
      status: 'promise', statusText: 'Cam kết thu 15/10/2026',
      promiseDate: '15/10/2026', promiseAmount: 30000000,
      lastContact: '06/10/2026 · Xác nhận thanh toán gộp hai hóa đơn' },
    { id: 'OI-005', code: 'HD-2026-0765', customerId: 'KH-0073', customerName: 'Công ty TNHH Minh Long',
      owner: 'Vũ Anh Tuấn', issuedAt: '16/07/2026', dueAt: '15/08/2026',
      total: 15000000, paid: 0, remaining: 15000000,
      status: 'contacted', statusText: 'Đã gửi mail nhắc nợ lần 1',
      promiseDate: null, promiseAmount: 0,
      lastContact: '07/10/2026 · Hứa phản hồi trước 14/10' },
    { id: 'OI-006', code: 'HD-2026-0769', customerId: 'KH-0073', customerName: 'Công ty TNHH Minh Long',
      owner: 'Vũ Anh Tuấn', issuedAt: '21/07/2026', dueAt: '20/08/2026',
      total: 12000000, paid: 0, remaining: 12000000,
      status: 'silent', statusText: 'Không phản hồi 2 lần liên hệ',
      promiseDate: null, promiseAmount: 0,
      lastContact: '28/09/2026 · Gọi máy bận' },
    { id: 'OI-007', code: 'HD-2026-0775', customerId: 'KH-0073', customerName: 'Công ty TNHH Minh Long',
      owner: 'Vũ Anh Tuấn', issuedAt: '26/07/2026', dueAt: '25/08/2026',
      total: 8000000, paid: 0, remaining: 8000000,
      status: 'contacted', statusText: 'Đã gửi mail nhắc nợ lần 1',
      promiseDate: null, promiseAmount: 0,
      lastContact: '07/10/2026 · Hứa phản hồi trước 14/10' },
    { id: 'OI-008', code: 'HD-2026-0812', customerId: 'KH-0088', customerName: 'Cửa hàng vật tư Phước Lộc',
      owner: 'Phạm Thu Hà', issuedAt: '23/07/2026', dueAt: '22/08/2026',
      total: 22000000, paid: 0, remaining: 22000000,
      status: 'promise', statusText: 'Cam kết thu 25/10/2026',
      promiseDate: '25/10/2026', promiseAmount: 22000000,
      lastContact: '05/10/2026 · Khách xác nhận trả đủ 40.000.000 ₫ ngày 25/10' },
    { id: 'OI-009', code: 'HD-2026-0826', customerId: 'KH-0088', customerName: 'Cửa hàng vật tư Phước Lộc',
      owner: 'Phạm Thu Hà', issuedAt: '06/08/2026', dueAt: '05/09/2026',
      total: 18000000, paid: 0, remaining: 18000000,
      status: 'promise', statusText: 'Cam kết thu 25/10/2026',
      promiseDate: '25/10/2026', promiseAmount: 18000000,
      lastContact: '05/10/2026 · Khách xác nhận trả đủ 40.000.000 ₫ ngày 25/10' },
    { id: 'OI-010', code: 'HD-2026-0833', customerId: 'KH-0031', customerName: 'Công ty TNHH Hoa Sen',
      owner: 'Trần Quốc Hưng', issuedAt: '26/07/2026', dueAt: '25/08/2026',
      total: 11000000, paid: 0, remaining: 11000000,
      status: 'contacted', statusText: 'Đã gửi mail nhắc nợ lần 2',
      promiseDate: null, promiseAmount: 0,
      lastContact: '02/10/2026 · Hứa chuyển khoản trong tháng' },
    { id: 'OI-011', code: 'HD-2026-0845', customerId: 'KH-0031', customerName: 'Công ty TNHH Hoa Sen',
      owner: 'Trần Quốc Hưng', issuedAt: '03/08/2026', dueAt: '02/09/2026',
      total: 8000000, paid: 0, remaining: 8000000,
      status: 'contacted', statusText: 'Đã gửi mail nhắc nợ lần 1',
      promiseDate: null, promiseAmount: 0,
      lastContact: '02/10/2026 · Hứa chuyển khoản trong tháng' },
    { id: 'OI-012', code: 'HD-2026-0850', customerId: 'KH-0057', customerName: 'Công ty CP Gỗ Tân Thành',
      owner: 'Phạm Thu Hà', issuedAt: '29/07/2026', dueAt: '28/08/2026',
      total: 24000000, paid: 0, remaining: 24000000,
      status: 'silent', statusText: 'Không phản hồi 3 lần liên hệ',
      promiseDate: null, promiseAmount: 0,
      lastContact: '30/09/2026 · Không nghe máy' },
    { id: 'OI-013', code: 'HD-2026-0861', customerId: 'KH-0057', customerName: 'Công ty CP Gỗ Tân Thành',
      owner: 'Phạm Thu Hà', issuedAt: '12/08/2026', dueAt: '11/09/2026',
      total: 17000000, paid: 0, remaining: 17000000,
      status: 'contacted', statusText: 'Đã gửi mail nhắc nợ lần 1',
      promiseDate: null, promiseAmount: 0,
      lastContact: '01/10/2026 · Hứa phản hồi sau khi chốt sổ' },
    { id: 'OI-014', code: 'HD-2026-0867', customerId: 'KH-0084', customerName: 'Công ty TNHH Vận tải Biển Đông',
      owner: 'Lê Thị Hồng Gấm', issuedAt: '31/07/2026', dueAt: '30/08/2026',
      total: 12500000, paid: 0, remaining: 12500000,
      status: 'silent', statusText: 'Không phản hồi 2 lần liên hệ',
      promiseDate: null, promiseAmount: 0,
      lastContact: '26/09/2026 · Hủy lịch hẹn' },
    { id: 'OI-015', code: 'HD-2026-0881', customerId: 'KH-0064', customerName: 'Công ty CP Xây dựng Phú Thịnh',
      owner: 'Phạm Thu Hà', issuedAt: '16/08/2026', dueAt: '15/09/2026',
      total: 25000000, paid: 0, remaining: 25000000,
      status: 'promise', statusText: 'Cam kết thu 22/10/2026',
      promiseDate: '22/10/2026', promiseAmount: 25000000,
      lastContact: '04/10/2026 · Xác nhận chuyển khoản ngày 22/10' },
    { id: 'OI-016', code: 'HD-2026-0884', customerId: 'KH-0066', customerName: 'Công ty TNHH Đại Phúc',
      owner: 'Trần Quốc Hưng', issuedAt: '21/08/2026', dueAt: '20/09/2026',
      total: 9000000, paid: 0, remaining: 9000000,
      status: 'fresh', statusText: 'Mới quá hạn',
      promiseDate: null, promiseAmount: 0,
      lastContact: '10/10/2026 · Đã gửi mail nhắc nợ tự động' },
    { id: 'OI-017', code: 'HD-2026-0890', customerId: 'KH-0066', customerName: 'Công ty TNHH Đại Phúc',
      owner: 'Trần Quốc Hưng', issuedAt: '29/08/2026', dueAt: '28/09/2026',
      total: 6000000, paid: 0, remaining: 6000000,
      status: 'fresh', statusText: 'Mới quá hạn',
      promiseDate: null, promiseAmount: 0,
      lastContact: '10/10/2026 · Đã gửi mail nhắc nợ tự động' },
    { id: 'OI-018', code: 'HD-2026-0895', customerId: 'KH-0079', customerName: 'Công ty CP Nam Việt',
      owner: 'Vũ Anh Tuấn', issuedAt: '02/09/2026', dueAt: '02/10/2026',
      total: 7000000, paid: 0, remaining: 7000000,
      status: 'fresh', statusText: 'Mới quá hạn',
      promiseDate: null, promiseAmount: 0,
      lastContact: '11/10/2026 · Đã gửi mail nhắc nợ tự động' }
  ],

  overdueInvoiceOwners: [
    { name: 'Phạm Thu Hà', role: 'Nhân viên kinh doanh' },
    { name: 'Trần Quốc Hưng', role: 'Nhân viên kinh doanh' },
    { name: 'Lê Thị Hồng Gấm', role: 'Nhân viên kinh doanh' },
    { name: 'Vũ Anh Tuấn', role: 'Nhân viên kinh doanh' }
  ],

  invoiceStatusMap: {
    dispute:   { text: 'Tranh chấp', stamp: 'stamp--danger' },
    promise:   { text: 'Cam kết thu', stamp: 'stamp--info' },
    contacted: { text: 'Đã liên hệ', stamp: 'stamp--warn' },
    silent:    { text: 'Không phản hồi', stamp: 'stamp--danger' },
    fresh:     { text: 'Mới quá hạn', stamp: 'stamp--neutral' }
  },
  cashflowForecast: {
    baseDate: '12/10/2026',
    openingBalance: 486000000,
    openingNote: 'Số dư tiền mặt + tiền gửi ngân hàng tại 01/10/2026 sau khi trừ cam kết chi tuần 12/10.',
    safetyThreshold: 150000000,
    horizon: '7 tuần · 12/10 – 29/11/2026',
    scenarios: {
      base: {
        key: 'base', label: 'Cơ sở',
        desc: 'Cam kết thu được thực hiện đúng hạn, các khoản đến hạn đúng kế hoạch, thu hồi được 100% dự kiến của nhóm nợ quá hạn không cam kết.',
        factors: { promised: 1, scheduled: 1, expected: 1 }
      },
      cautious: {
        key: 'cautious', label: 'Thận trọng',
        desc: 'Cam kết thu trễ 10%, khoản đến hạn trễ 3%, chỉ 70% khoản thu hồi nợ quá hạn thành công. Khoản chi giữ nguyên vì là cam kết cứng.',
        factors: { promised: 0.9, scheduled: 0.97, expected: 0.7 }
      }
    },
    periods: [
      { id: 'W1', label: 'Tuần 1', range: '12/10 – 18/10', from: '12/10/2026', to: '18/10/2026',
        promised: 75000000, scheduled: 185000000, expected: 12000000,
        outflow: { payroll: 180000000, vendor: 45000000, tax: 15000000, other: 25000000 },
        confidence: 'high',
        promisedFrom: [
          { code: 'HD-2026-0741', customer: 'Công ty TNHH Sản xuất Thiên Hà', amount: 45000000, date: '15/10/2026' },
          { code: 'HD-2026-0753', customer: 'Công ty TNHH Sản xuất Thiên Hà', amount: 30000000, date: '15/10/2026' }
        ],
        notes: ['Đầu kỳ nhận 75 triệu theo cam kết của Thiên Hà; 185 triệu đến hạn theo lịch từ 9 hóa đơn chưa tới hạn.',
                'Kỳ lương 15/10 chiếm 180 triệu trong tổng chi của tuần.'] },
      { id: 'W2', label: 'Tuần 2', range: '19/10 – 25/10', from: '19/10/2026', to: '25/10/2026',
        promised: 65000000, scheduled: 160000000, expected: 18000000,
        outflow: { payroll: 0, vendor: 165000000, tax: 30000000, other: 45000000 },
        confidence: 'high',
        promisedFrom: [
          { code: 'HD-2026-0881', customer: 'Công ty CP Xây dựng Phú Thịnh', amount: 25000000, date: '22/10/2026' },
          { code: 'HD-2026-0812', customer: 'Cửa hàng vật tư Phước Lộc', amount: 22000000, date: '25/10/2026' },
          { code: 'HD-2026-0826', customer: 'Cửa hàng vật tư Phước Lộc', amount: 18000000, date: '25/10/2026' }
        ],
        notes: ['Tuần có cam kết thu rõ ràng nhất (65 triệu); cần xác nhận Phước Lộc trước 25/10 để không trượt lịch.'] },
      { id: 'W3', label: 'Tuần 3', range: '26/10 – 01/11', from: '26/10/2026', to: '01/11/2026',
        promised: 60000000, scheduled: 230000000, expected: 20000000,
        outflow: { payroll: 0, vendor: 320000000, tax: 120000000, other: 40000000 },
        confidence: 'medium',
        promisedFrom: [
          { code: 'HD-2026-0722', customer: 'Công ty TNHH Thương mại Bình Minh', amount: 60000000, date: '28/10/2026' }
        ],
        notes: ['Đỉnh chi trả nhà cung cấp cộng thuế quý III — tuần có dòng tiền ròng âm lớn nhất kỳ.',
                'Cam kết của Bình Minh đi kèm điều kiện hóa đơn HD-2026-0722 được xác nhận tại Hồ sơ chờ duyệt.'] },
      { id: 'W4', label: 'Tuần 4', range: '02/11 – 08/11', from: '02/11/2026', to: '08/11/2026',
        promised: 0, scheduled: 205000000, expected: 30000000,
        outflow: { payroll: 0, vendor: 150000000, tax: 25000000, other: 60000000 },
        confidence: 'medium',
        promisedFrom: [],
        notes: ['Không có cam kết thu mới; thu hồi nợ quá hạn phụ thuộc kết quả đôn đốc của tuần trước.'] },
      { id: 'W5', label: 'Tuần 5', range: '09/11 – 15/11', from: '09/11/2026', to: '15/11/2026',
        promised: 0, scheduled: 175000000, expected: 35000000,
        outflow: { payroll: 180000000, vendor: 65000000, tax: 20000000, other: 30000000 },
        confidence: 'low',
        promisedFrom: [],
        notes: ['Kỳ chi lương 15/11; ở kịch bản thận trọng số dư bắt đầu rơi xuống vùng sát ngưỡng an toàn.'] },
      { id: 'W6', label: 'Tuần 6', range: '16/11 – 22/11', from: '16/11/2026', to: '22/11/2026',
        promised: 0, scheduled: 150000000, expected: 30000000,
        outflow: { payroll: 0, vendor: 120000000, tax: 25000000, other: 40000000 },
        confidence: 'low',
        promisedFrom: [],
        notes: ['Tuần thu đủ bù chi trong kịch bản cơ sở; ở kịch bản thận trọng số dư xuyên ngưỡng an toàn lần đầu.'] },
      { id: 'W7', label: 'Tuần 7', range: '23/11 – 29/11', from: '23/11/2026', to: '29/11/2026',
        promised: 0, scheduled: 120000000, expected: 22500000,
        outflow: { payroll: 0, vendor: 145000000, tax: 30000000, other: 35000000 },
        confidence: 'low',
        promisedFrom: [],
        notes: ['Cuối kỳ dự báo — cần quyết định gia hạn khoản chi nhà cung cấp hoặc đôn đốc 152,5 triệu của An Phát trước khi bước sang tháng 12.'] }
    ]
  },
  customers: [
    { id: 'KH-0012', code: 'TH', name: 'Công ty TNHH Sản xuất Thiên Hà', short: 'Thiên Hà',
      type: 'Doanh nghiệp', taxId: '0312458912',
      address: '48 Nguyễn Văn Quá, P. Đông Hưng Thuận, Q.12, TP.HCM',
      contact: 'Nguyễn Văn Hải', role: 'Trưởng phòng Kế toán',
      phone: '028 3712 4488', email: 'ketoan@thienha.com.vn',
      group: 'B', owner: 'Lê Minh Tuấn', status: 'active',
      outstanding: 560000000, overdue: 75000000,
      invoices: 9, overdueInvoices: 2, avgDaysOverdue: 27,
      lastInvoice: '02/10/2026', since: '03/2023', needsUpdate: false,
      note: 'Đã cam kết thu 75.000.000 ₫ trước 15/10/2026.',
      history: [
        { when: '11/10/2026 10:24', who: 'Lê Minh Tuấn', what: 'Ghi nhận cam kết thu 75.000.000 ₫ trước 15/10/2026.' },
        { when: '02/10/2026 16:40', who: 'Nguyễn Thị Lan', what: 'Phát hành 2 hóa đơn mới, tổng giá trị 128.000.000 ₫.' },
        { when: '15/06/2026 09:12', who: 'Lê Minh Tuấn', what: 'Chuyển nhóm công nợ từ A sang B do trễ thanh toán.' }
      ] },
    { id: 'KH-0024', code: 'PT', name: 'Công ty CP Xây dựng Phú Thịnh', short: 'Phú Thịnh',
      type: 'Doanh nghiệp', taxId: '0305887741',
      address: '122 Lê Trọng Tấn, P. Tân Quý, Q. Tân Phú, TP.HCM',
      contact: 'Trần Quốc Hưng', role: 'Giám đốc',
      phone: '028 3861 2255', email: 'hung.tran@phuthinh.com.vn',
      group: 'B', owner: 'Nguyễn Thị Lan', status: 'active',
      outstanding: 415000000, overdue: 25000000,
      invoices: 7, overdueInvoices: 1, avgDaysOverdue: 19,
      lastInvoice: '05/10/2026', since: '08/2022', needsUpdate: false,
      note: 'Cam kết thu 25.000.000 ₫ trước 22/10/2026.' },
    { id: 'KH-0007', code: 'BM', name: 'Công ty TNHH Thương mại Bình Minh', short: 'Bình Minh',
      type: 'Doanh nghiệp', taxId: '0311223344',
      address: '15/2 Võ Văn Kiệt, P. Cầu Kho, Q.1, TP.HCM',
      contact: 'Lê Thị Bích', role: 'Kế toán trưởng',
      phone: '028 3925 7788', email: 'bich.le@binhminh.vn',
      group: 'B', owner: 'Trần Văn Hùng', status: 'active',
      outstanding: 380000000, overdue: 98000000,
      invoices: 6, overdueInvoices: 2, avgDaysOverdue: 35,
      lastInvoice: '28/09/2026', since: '01/2021', needsUpdate: false,
      note: 'Cam kết thu 60.000.000 ₫ trước 28/10/2026.',
      watch: { level: 'high', note: 'Cam kết thu 60 triệu ₫ trước 28/10 đi kèm điều kiện xác nhận HD-2026-0722.' },
      history: [
        { when: '10/10/2026 14:05', who: 'Trần Văn Hùng', what: 'Đàm phán cam kết thu 60.000.000 ₫ trước 28/10/2026.' },
        { when: '01/10/2026 08:30', who: 'Hệ thống', what: 'Đánh dấu quá hạn 2 hóa đơn, tổng 98.000.000 ₫.' }
      ] },
    { id: 'KH-0031', code: 'PL', name: 'Cửa hàng vật tư Phước Lộc', short: 'Phước Lộc',
      type: 'Hộ kinh doanh', taxId: '8012345678',
      address: '34 Trần Hưng Đạo, P. Bửu Hòa, TP. Biên Hòa, Đồng Nai',
      contact: 'Võ Minh Trí', role: 'Chủ cửa hàng',
      phone: '0251 384 2299', email: 'phuocloc.vt@gmail.com',
      group: 'B', owner: 'Phạm Thu Hà', status: 'active',
      outstanding: 245000000, overdue: 40000000,
      invoices: 5, overdueInvoices: 2, avgDaysOverdue: 34,
      lastInvoice: '30/09/2026', since: '05/2024', needsUpdate: false,
      note: 'Cam kết thu 40.000.000 ₫ trước 25/10/2026.' },
    { id: 'KH-0018', code: 'AP', name: 'Công ty CP Xuất nhập khẩu An Phát', short: 'An Phát',
      type: 'Doanh nghiệp', taxId: '0304562218',
      address: '27 Điện Biên Phủ, P.25, Q. Bình Thạnh, TP.HCM',
      contact: 'Phạm Anh Dũng', role: 'Phó Tổng giám đốc',
      phone: '028 3512 9900', email: 'finance@anphatex.com',
      group: 'D', owner: 'Lê Minh Tuấn', status: 'disputed',
      outstanding: 198500000, overdue: 152500000,
      invoices: 4, overdueInvoices: 1, avgDaysOverdue: 86,
      lastInvoice: '12/09/2026', since: '11/2020', needsUpdate: false,
      note: 'Đang tranh chấp HD-2026-0731 (152.500.000 ₫) — chưa đưa vào dự báo dòng tiền.',
      watch: { level: 'high', note: 'Tranh chấp hóa đơn HD-2026-0731 (152,5 triệu ₫) — cần đối soát trước 20/10.' },
      history: [
        { when: '08/10/2026 09:15', who: 'Lê Minh Tuấn', what: 'Chuyển trạng thái sang Đang tranh chấp theo biên bản đối soát ngày 06/10/2026.' },
        { when: '06/10/2026 15:22', who: 'Vũ Quốc Bảo', what: 'Ghi nhận khiếu nại khối lượng nghiệm thu của HD-2026-0731.' }
      ] },
    { id: 'KH-0042', code: 'TT', name: 'Công ty TNHH Kỹ thuật Tân Thành', short: 'Tân Thành',
      type: 'Doanh nghiệp', taxId: '0313998877',
      address: '96 Phạm Văn Đồng, P. Linh Đông, TP. Thủ Đức, TP.HCM',
      contact: 'Hoàng Văn Nam', role: 'Quản lý dự án',
      phone: '028 3720 4411', email: 'nam.hoang@tanthanh-tech.vn',
      group: 'C', owner: 'Trần Văn Hùng', status: 'active',
      outstanding: 165000000, overdue: 41000000,
      invoices: 5, overdueInvoices: 2, avgDaysOverdue: 24,
      lastInvoice: '01/10/2026', since: '06/2023', needsUpdate: false,
      note: 'Chưa có cam kết thu cho 2 hóa đơn quá hạn.',
      watch: { level: 'medium', note: '2 hóa đơn quá hạn 41 triệu ₫, tuổi nợ 24 ngày, chưa có cam kết thu.' } },
    { id: 'KH-0029', code: 'ML', name: 'Công ty TNHH Vật liệu Minh Long', short: 'Minh Long',
      type: 'Doanh nghiệp', taxId: '0309123456',
      address: '14 Quốc lộ 1A, P. Thạnh Xuân, Q.12, TP.HCM',
      contact: 'Đỗ Thu Thủy', role: 'Kế toán',
      phone: '028 3899 3366', email: 'ketoan@minhlong-vl.com',
      group: 'C', owner: 'Phạm Thu Hà', status: 'active',
      outstanding: 142000000, overdue: 35000000,
      invoices: 4, overdueInvoices: 2, avgDaysOverdue: 22,
      lastInvoice: '27/09/2026', since: '09/2023', needsUpdate: false,
      note: '' },
    { id: 'KH-0055', code: 'HS', name: 'Hợp tác xã Nông nghiệp Hoa Sen', short: 'Hoa Sen',
      type: 'Tổ chức', taxId: '0401234567',
      address: 'Ấp 2, X. Tân An, H. Củ Chi, TP.HCM',
      contact: 'Nguyễn Thị Hoa', role: 'Giám đốc',
      phone: '028 3792 1188', email: 'hoasen.htx@agri.vn',
      group: 'B', owner: 'Nguyễn Thị Lan', status: 'active',
      outstanding: 96500000, overdue: 19000000,
      invoices: 3, overdueInvoices: 1, avgDaysOverdue: 15,
      lastInvoice: '06/10/2026', since: '02/2025', needsUpdate: false,
      note: '' },
    { id: 'KH-0038', code: 'BD', name: 'Công ty CP Logistics Biển Đông', short: 'Biển Đông',
      type: 'Doanh nghiệp', taxId: '0312887766',
      address: '5 Võ Nguyên Giáp, P. Tân Thuận Đông, Q.7, TP.HCM',
      contact: 'Lý Quốc Cường', role: 'Giám đốc vận hành',
      phone: '028 3777 5522', email: 'cuong.ly@biendong-logistics.vn',
      group: 'A', owner: 'Vũ Quốc Bảo', status: 'active',
      outstanding: 88000000, overdue: 12500000,
      invoices: 3, overdueInvoices: 2, avgDaysOverdue: 12,
      lastInvoice: '08/10/2026', since: '07/2022', needsUpdate: false,
      note: '' },
    { id: 'KH-0061', code: 'ĐP', name: 'Doanh nghiệp tư nhân Đại Phúc', short: 'Đại Phúc',
      type: 'Hộ kinh doanh', taxId: '8023456789',
      address: '215 Nguyễn Thị Thập, P. Tân Hưng, Q.7, TP.HCM',
      contact: 'Lê Văn Phúc', role: 'Chủ doanh nghiệp',
      phone: '028 3773 6644', email: 'daiphuc.dn@gmail.com',
      group: 'C', owner: 'Vũ Quốc Bảo', status: 'active',
      outstanding: 62000000, overdue: 15000000,
      invoices: 3, overdueInvoices: 2, avgDaysOverdue: 28,
      lastInvoice: '25/09/2026', since: '04/2024', needsUpdate: false,
      note: '' },
    { id: 'KH-0016', code: 'NV', name: 'Công ty TNHH Thực phẩm Nam Việt', short: 'Nam Việt',
      type: 'Doanh nghiệp', taxId: '0311556677',
      address: '82 Nguyễn Văn Trỗi, P.8, Q. Phú Nhuận, TP.HCM',
      contact: 'Trịnh Mỹ Linh', role: 'Kế toán',
      phone: '028 3844 2211', email: 'linh.trinh@namvietfood.vn',
      group: 'A', owner: 'Vũ Quốc Bảo', status: 'active',
      outstanding: 43500000, overdue: 7000000,
      invoices: 2, overdueInvoices: 1, avgDaysOverdue: 11,
      lastInvoice: '09/10/2026', since: '10/2021', needsUpdate: false,
      note: '' },
    { id: 'KH-0072', code: 'HG', name: 'Công ty CP Điện tử Hoàng Gia', short: 'Hoàng Gia',
      type: 'Doanh nghiệp', taxId: '0314445566',
      address: '68 Nguyễn Thị Minh Khai, P.6, Q.3, TP.HCM',
      contact: 'Nguyễn Hoàng Long', role: 'Trưởng phòng Kinh doanh',
      phone: '028 3822 9911', email: 'long.nguyen@hoanggia-elec.com',
      group: 'A', owner: 'Trần Văn Hùng', status: 'active',
      outstanding: 25000000, overdue: 0,
      invoices: 2, overdueInvoices: 0, avgDaysOverdue: 0,
      lastInvoice: '10/10/2026', since: '12/2024', needsUpdate: true,
      note: 'Thiếu số điện thoại bàn của đơn vị.' },
    { id: 'KH-0067', code: 'HB', name: 'Công ty TNHH Dịch vụ Hòa Bình', short: 'Hòa Bình',
      type: 'Doanh nghiệp', taxId: '0313667788',
      address: '12 Sương Nguyệt Ánh, P. Bến Thành, Q.1, TP.HCM',
      contact: 'Nguyễn Thị Hạnh', role: 'Giám đốc',
      phone: '028 3920 1144', email: '',
      group: 'A', owner: 'Nguyễn Thị Lan', status: 'active',
      outstanding: 18000000, overdue: 0,
      invoices: 1, overdueInvoices: 0, avgDaysOverdue: 0,
      lastInvoice: '07/10/2026', since: '03/2025', needsUpdate: true,
      note: 'Mã số thuế đang chờ xác minh lại.' },
    { id: 'KH-0088', code: 'HT', name: 'Tiệm sắt Hưng Thịnh', short: 'Hưng Thịnh',
      type: 'Hộ kinh doanh', taxId: '',
      address: '412 Tỉnh lộ 8, X. Tân Phú Trung, H. Củ Chi, TP.HCM',
      contact: 'Trần Văn Hưng', role: 'Chủ tiệm',
      phone: '0903 512 884', email: '',
      group: 'A', owner: 'Phạm Thu Hà', status: 'pending',
      outstanding: 11500000, overdue: 0,
      invoices: 1, overdueInvoices: 0, avgDaysOverdue: 0,
      lastInvoice: '05/10/2026', since: '09/2026', needsUpdate: true,
      note: 'Hộ kinh doanh mới, chưa có mã số thuế và email — chưa xuất được hóa đơn điện tử.',
      watch: { level: 'medium', note: 'Hộ kinh doanh chưa có MST và email — không xuất được hóa đơn điện tử.' } }
  ],
    users: [
    { id: 'U-001', name: 'Phạm Quốc Hưng', initials: 'QH', email: 'hung.pq@invoicepilot.vn',
      dept: 'Công nghệ thông tin', title: 'Trưởng phòng Công nghệ thông tin',
      role: 'Quản trị hệ thống', scope: 'Toàn hệ thống', status: 'active', mfa: true,
      lastLoginAt: '2026-10-12T08:02', created: '03/2021', manager: '—',
      phone: '0903 221 884', failed: 0, devices: 3,
      note: 'Tài khoản gốc của hệ thống — việc khóa cần 2 quản trị viên cùng phê duyệt.' },
    { id: 'U-002', name: 'Nguyễn Thị Lan', initials: 'NL', email: 'lan.nt@invoicepilot.vn',
      dept: 'Tài chính – Kế toán', title: 'Kế toán thu',
      role: 'Kế toán thu', scope: 'Theo phòng ban', status: 'active', mfa: true,
      lastLoginAt: '2026-10-12T07:48', created: '06/2021', manager: 'Hoàng Thị Mai',
      phone: '0907 415 220', failed: 1, devices: 2,
      note: 'Đang phụ trách 2 khách hàng: Phú Thịnh, Hoa Sen, Hòa Bình.' },
    { id: 'U-003', name: 'Lê Minh Tuấn', initials: 'LT', email: 'tuan.lm@invoicepilot.vn',
      dept: 'Tài chính – Kế toán', title: 'Quản lý công nợ',
      role: 'Quản lý công nợ', scope: 'Toàn hệ thống (công nợ)', status: 'active', mfa: true,
      lastLoginAt: '2026-10-12T08:10', created: '02/2020', manager: 'Hoàng Thị Mai',
      phone: '0908 332 117', failed: 0, devices: 4,
      note: 'Phụ trách Thiên Hà và An Phát — hai hồ sơ có công nợ quá hạn lớn nhất.',
      history: [
        { when: '11/10/2026 10:24', who: 'Lê Minh Tuấn', what: 'Ghi nhận cam kết thu 75.000.000 ₫ của Thiên Hà.' },
        { when: '08/10/2026 09:15', who: 'Lê Minh Tuấn', what: 'Chuyển An Phát sang trạng thái Đang tranh chấp.' }
      ] },
    { id: 'U-004', name: 'Trần Văn Hùng', initials: 'TH', email: 'hung.tv@invoicepilot.vn',
      dept: 'Kinh doanh', title: 'Nhân viên kinh doanh',
      role: 'Nhân viên kinh doanh', scope: 'Theo khách hàng được phân công', status: 'active', mfa: false,
      lastLoginAt: '2026-10-11T17:22', created: '09/2022', manager: 'Đỗ Quang Vinh',
      phone: '0912 664 003', failed: 2, devices: 2,
      watch: { level: 'medium', note: 'Chưa bật xác thực 2 lớp dù đang phụ trách 6 khách hàng có công nợ.' },
      note: 'Phụ trách Bình Minh, Tân Thành, Hoàng Gia.' },
    { id: 'U-005', name: 'Phạm Thu Hà', initials: 'PT', email: 'ha.pt@invoicepilot.vn',
      dept: 'Kinh doanh', title: 'Nhân viên kinh doanh',
      role: 'Nhân viên kinh doanh', scope: 'Theo khách hàng được phân công', status: 'active', mfa: true,
      lastLoginAt: '2026-10-11T16:05', created: '04/2023', manager: 'Đỗ Quang Vinh',
      phone: '0918 220 551', failed: 0, devices: 2, note: 'Phụ trách Phước Lộc, Minh Long, Hưng Thịnh.' },
    { id: 'U-006', name: 'Vũ Quốc Bảo', initials: 'VB', email: 'bao.vq@invoicepilot.vn',
      dept: 'Tài chính – Kế toán', title: 'Chuyên viên thu hồi nợ',
      role: 'Quản lý công nợ', scope: 'Theo khách hàng được phân công', status: 'active', mfa: true,
      lastLoginAt: '2026-10-12T07:55', created: '07/2023', manager: 'Lê Minh Tuấn',
      phone: '0909 771 320', failed: 0, devices: 2, note: 'Phụ trách Biển Đông, Đại Phúc, Nam Việt.' },
    { id: 'U-007', name: 'Hoàng Thị Mai', initials: 'HM', email: 'mai.ht@invoicepilot.vn',
      dept: 'Tài chính – Kế toán', title: 'Kế toán trưởng',
      role: 'Kế toán trưởng', scope: 'Toàn hệ thống', status: 'active', mfa: true,
      lastLoginAt: '2026-10-12T08:06', created: '01/2019', manager: 'Ban Tổng giám đốc',
      phone: '0903 118 902', failed: 0, devices: 3, note: 'Có quyền duyệt dự báo dòng tiền.' },
    { id: 'U-008', name: 'Đặng Văn Long', initials: 'DL', email: 'long.dv@invoicepilot.vn',
      dept: 'Kiểm toán nội bộ', title: 'Kiểm toán viên',
      role: 'Kiểm toán viên', scope: 'Chỉ đọc toàn hệ thống', status: 'active', mfa: true,
      lastLoginAt: '2026-10-10T09:30', created: '05/2024', manager: 'Hội đồng Kiểm toán',
      phone: '0915 332 780', failed: 0, devices: 1,
      note: 'Chỉ đọc — không phát hành, sửa hay hủy chứng từ.' },
    { id: 'U-009', name: 'Ngô Thanh Tùng', initials: 'NT', email: 'tung.nt@invoicepilot.vn',
      dept: 'Kinh doanh', title: 'Nhân viên kinh doanh',
      role: 'Nhân viên kinh doanh', scope: 'Theo khách hàng được phân công', status: 'locked', mfa: false,
      lastLoginAt: '2026-10-06T18:12', created: '11/2024', manager: 'Đỗ Quang Vinh',
      phone: '0938 445 112', failed: 5, devices: 1,
      watch: { level: 'high', note: 'Khóa tạm thời sau 5 lần đăng nhập sai — cần xác minh danh tính trước khi mở khóa.' },
      note: 'Tài khoản bị khóa tự động lúc 18:20 · 06/10/2026.' },
    { id: 'U-010', name: 'Trương Minh Châu', initials: 'TC', email: 'chau.tm@invoicepilot.vn',
      dept: 'Công nghệ thông tin', title: 'Quản trị hệ thống',
      role: 'Quản trị hệ thống', scope: 'Toàn hệ thống', status: 'active', mfa: true,
      lastLoginAt: '2026-10-12T07:30', created: '08/2022', manager: 'Phạm Quốc Hưng',
      phone: '0905 662 118', failed: 0, devices: 5,
      watch: { level: 'high', note: '2 phiên đăng nhập bất thường từ thiết bị mới tại Hà Nội trong 24 giờ qua.' },
      note: 'Đang thực hiện đợt rà soát quyền cuối quý.',
      sessions: [
        { device: 'Chrome · Windows 11', place: 'TP.HCM', at: '12/10/2026 07:30', trusted: true },
        { device: 'Safari · iPhone 14', place: 'Hà Nội', at: '11/10/2026 21:40', trusted: false },
        { device: 'Chrome · macOS', place: 'Hà Nội', at: '11/10/2026 20:58', trusted: false }
      ] },
    { id: 'U-011', name: 'Bùi Thị Hồng', initials: 'BH', email: 'hong.bt@invoicepilot.vn',
      dept: 'Tài chính – Kế toán', title: 'Kế toán tổng hợp',
      role: 'Kế toán thu', scope: 'Theo phòng ban', status: 'pending', mfa: false,
      lastLoginAt: '', created: '02/10/2026', manager: 'Hoàng Thị Mai',
      phone: '0912 004 771', failed: 0, devices: 0,
      watch: { level: 'medium', note: 'Lời mời kích hoạt đã quá 7 ngày — cần gửi lại hoặc hủy lời mời.' },
      note: 'Chờ kích hoạt từ 02/10/2026.' },
    { id: 'U-012', name: 'Phạm Nhật Nam', initials: 'PN', email: 'nam.pn@invoicepilot.vn',
      dept: 'Công nghệ thông tin', title: 'Chuyên viên hỗ trợ vận hành',
      role: 'Hỗ trợ vận hành', scope: 'Chỉ đọc toàn hệ thống', status: 'active', mfa: false,
      lastLoginAt: '2026-10-11T14:48', created: '01/2025', manager: 'Phạm Quốc Hưng',
      phone: '0909 112 553', failed: 1, devices: 2, note: 'Hỗ trợ xử lý sự cố đồng bộ dữ liệu.' },
    { id: 'U-013', name: 'Võ Thị Kim Liên', initials: 'VL', email: 'lien.vtk@invoicepilot.vn',
      dept: 'Tài chính – Kế toán', title: 'Kế toán thu',
      role: 'Kế toán thu', scope: 'Theo phòng ban', status: 'pending', mfa: false,
      lastLoginAt: '', created: '09/10/2026', manager: 'Hoàng Thị Mai',
      phone: '0934 220 118', failed: 0, devices: 0,
      note: 'Chờ xác minh email trước khi kích hoạt.' },
    { id: 'U-014', name: 'Đỗ Quang Vinh', initials: 'DV', email: 'vinh.dq@invoicepilot.vn',
      dept: 'Kinh doanh', title: 'Trưởng phòng Kinh doanh',
      role: 'Nhân viên kinh doanh', scope: 'Theo phòng ban', status: 'active', mfa: true,
      lastLoginAt: '2026-10-12T08:04', created: '03/2020', manager: 'Ban Tổng giám đốc',
      phone: '0908 445 221', failed: 0, devices: 3,
      note: 'Chức danh tổ chức là Trưởng phòng; vai trò trên hệ thống vẫn là Nhân viên kinh doanh.' }
  ],
    invoiceSeries: [
    { id: 'S-AA', code: 'AA/24E', sample: '01GTKT0/001', type: 'Hóa đơn GTGT',
      current: 128, step: 1, digits: 7, issued: 128,
      from: '01/01/2024', to: '31/12/2026', scope: 'Khách hàng trong nước',
      status: 'active', isDefault: true,
      notice: 'Thông báo phát hành số 12/TB-VP ngày 26/12/2023.',
      note: 'Ký hiệu dùng cho hóa đơn GTGT của khách hàng trong nước, thanh toán VND.' },
    { id: 'S-AB', code: 'AB/24E', sample: '02GTTT0/001', type: 'Hóa đơn bán hàng',
      current: 48, step: 1, digits: 7, issued: 48,
      from: '01/01/2024', to: '31/12/2026', scope: 'Khách hàng không khấu trừ thuế',
      status: 'active', isDefault: false,
      notice: 'Thông báo phát hành số 12/TB-VP ngày 26/12/2023.',
      note: 'Dùng cho hộ gia đình, cá nhân không cần khấu trừ thuế GTGT.' },
    { id: 'S-AC', code: 'AC/24E', sample: '03GTTT0/001', type: 'Hóa đơn điều chỉnh',
      current: 9, step: 1, digits: 7, issued: 9,
      from: '01/01/2024', to: '31/12/2026', scope: 'Điều chỉnh tăng / giảm',
      status: 'active', isDefault: false,
      notice: 'Thông báo phát hành số 12/TB-VP ngày 26/12/2023.',
      note: 'Liên kết với hóa đơn gốc — không phát hành độc lập.' },
    { id: 'S-AD', code: 'AD/24E', sample: '04GTTT0/001', type: 'Hóa đơn thay thế',
      current: 3, step: 1, digits: 7, issued: 3,
      from: '01/01/2024', to: '31/12/2026', scope: 'Thay thế hóa đơn đã phát hành',
      status: 'active', isDefault: false,
      notice: 'Thông báo phát hành số 12/TB-VP ngày 26/12/2023.',
      note: 'Dùng khi hóa đơn gốc có sai sót chưa gửi cơ quan thuế.' },
    { id: 'S-AE', code: 'AE/23E', sample: '01GTKT0/001', type: 'Hóa đơn GTGT (ngoại tệ)',
      current: 12, step: 1, digits: 7, issued: 12,
      from: '01/01/2023', to: '31/12/2026', scope: 'Khách hàng thanh toán ngoại tệ',
      status: 'paused', isDefault: false,
      notice: 'Thông báo phát hành số 08/TB-VP ngày 22/12/2022.',
      note: 'Tạm dừng sử dụng từ 01/07/2026 — chờ cập nhật tỷ giá hiển thị.' }
  ],

  invoiceSettings: {
    company: {
      name: 'CÔNG TY TNHH INVOICEPILOT', taxId: '0316874521',
      address: '128 Nguyễn Văn Trỗi, Phường 8, Q. Phú Nhuận, TP.HCM',
      phone: '(028) 3997 2288', email: 'hoadon@invoicepilot.vn',
      bank: 'Vietcombank CN Sài Gòn · 0071 0004 5678 9',
      hotline: '1900 6868'
    },
    numbering: {
      next: 129, digits: 7, step: 1, period: 'Theo năm',
      roundMoney: '0 ₫', roundTax: '1 ₫',
      taxRate: '8% (ưu đãi)', taxAccount: '3331 — Thuế GTGT đầu ra',
      dateFormat: 'dd/MM/yyyy', currency: 'VND',
      words: true, bilingual: false, termDays: 30
    },
    template: {
      name: 'Mẫu biểu 01 — song ngữ', logo: true, showBank: true,
      footer: 'Hóa đơn này đã được ký số và gửi cơ quan thuế theo Nghị định 123/2020/NĐ-CP. ' +
              'Đề nghị kiểm tra trong vòng 05 ngày kể từ ngày nhận.'
    },
    provider: {
      name: 'VNPT Invoice (eHoadon)', endpoint: 'https://api-vinvoice.vnpt.vn',
      account: 'INVPILOT_HCM', timeout: 45, cert: 'VNPT-CA',
      certExpire: '30/06/2027', status: 'connected',
      checkedAt: '12/10/2026 07:02', autoSend: true, syncTax: true
    },
    workflow: {
      approval: true, approvalLimit: 50000000,
      autoIssue: false, autoEmail: true,
      reminderDays: 3, savePdf: true, allowNeg: false
    },
    pending: 3,
    pendingOverdue: 1
  }
};
})();