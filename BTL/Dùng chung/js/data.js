/* =========================================================
   InvoicePilot — Dữ liệu giả lập (mock)
   Lý do dùng JS thay vì .json: chạy được trực tiếp bằng
   file:// (không vướng CORS của fetch). Khi chuyển sang
   JSON Server / MockAPI chỉ cần thay IP.data bằng fetch.
   ========================================================= */
(function () {
  'use strict';
  const IP = (window.IP = window.IP || {});
  const now = Date.now();
  const ago = (mins) => new Date(now - mins * 60000).toISOString();

  IP.data = {
    /* ---------- Người dùng (tài khoản demo) ---------- */
    users: [
      { id:'U01', name:'Nguyễn Minh Anh',   email:'ketoan@invoicepilot.vn',    password:'123456',
        role:'accountant', roleLabel:'Kế toán',     dept:'Phòng Kế toán',  phone:'0901 234 567', color:'#0E7C61', status:'active' },
      { id:'U02', name:'Trần Quốc Bảo',     email:'kinhdoanh@invoicepilot.vn', password:'123456',
        role:'sales',      roleLabel:'Kinh doanh',  dept:'Phòng Kinh doanh', phone:'0902 345 678', color:'#2C5F9E', status:'active' },
      { id:'U03', name:'Lê Thị Cẩm',        email:'quanly@invoicepilot.vn',    password:'123456',
        role:'manager',    roleLabel:'Quản lý',     dept:'Ban Giám đốc',    phone:'0903 456 789', color:'#A2711A', status:'active' },
      { id:'U04', name:'Phạm Đăng Duy',     email:'admin@invoicepilot.vn',     password:'123456',
        role:'admin',      roleLabel:'Quản trị viên', dept:'Hệ thống',      phone:'0904 567 890', color:'#7A4CBF', status:'active' }
    ],

    /* ---------- Thông báo ---------- */
    notifications: [
      { id:'N01', type:'reminder', title:'3 hóa đơn sẽ đến hạn trong 3 ngày',
        body:'INV-2026-014, INV-2026-018 và INV-2026-021 cần được nhắc thanh toán.',
        time:ago(12), read:false, link:'sales-payment-reminders.html' },
      { id:'N02', type:'payment',  title:'Đã ghi nhận khoản thu 42.000.000 ₫',
        body:'Phiếu thu PAY-2026-031 đã được đối chiếu với hóa đơn INV-2026-007.',
        time:ago(58), read:false, link:'accountant-reconciliation.html' },
      { id:'N03', type:'ai',       title:'AI phát hiện 2 bất thường trên hóa đơn nháp',
        body:'Ngày đáo hạn sớm hơn điều khoản tín dụng và thiếu mã số thuế người mua.',
        time:ago(145), read:false, link:'accountant-invoice-form.html' },
      { id:'N04', type:'invoice',  title:'Hóa đơn INV-2026-009 đã được đánh dấu quá hạn',
        body:'Khách hàng Công ty TNHH An Phát trễ thanh toán 12 ngày.',
        time:ago(320), read:true, link:'manager-overdue-invoices.html' },
      { id:'N05', type:'system',   title:'Cập nhật mẫu hóa đơn điện tử',
        body:'Quản trị viên đã thay đổi tiền tố số hóa đơn thành INV-2026.',
        time:ago(880), read:true, link:'admin-invoice-settings.html' },
      { id:'N06', type:'reminder', title:'Nhắc nợ REM-2026-042 đã được khách hàng phản hồi',
        body:'Khách hàng xác nhận sẽ thanh toán trước ngày 28/03/2026.',
        time:ago(1520), read:true, link:'sales-payment-reminders.html' },
      { id:'N07', type:'ai',       title:'Bản tóm tắt dòng tiền quý I đã sẵn sàng',
        body:'AI-3 đã tổng hợp dữ liệu 30/60/90 ngày cho báo cáo quản lý.',
        time:ago(2600), read:true, link:'manager-cashflow-forecast.html' },
      { id:'N08', type:'system',   title:'Sao lưu dữ liệu LocalStorage hoàn tất',
        body:'Dữ liệu giả lập của bạn được giữ nguyên trên trình duyệt này.',
        time:ago(4300), read:true, link:'settings.html' }
    ],

    /* ---------- Registry màn hình (dùng cho sidebar + tìm kiếm + 404) ---------- */
    pages: [
      { href:'index.html',                        label:'Trang chủ',                   group:'Tổng quan',   icon:'home',     page:'home' },
      { href:'accountant-invoice-list.html',      label:'Danh sách hóa đơn',           group:'Kế toán',     icon:'file',     page:'accountant-invoice-list' },
      { href:'accountant-invoice-form.html',      label:'Lập hóa đơn',                 group:'Kế toán',     icon:'edit',     page:'accountant-invoice-form' },
      { href:'accountant-reconciliation.html',    label:'Đối chiếu công nợ',           group:'Kế toán',     icon:'scale',    page:'accountant-reconciliation' },
      { href:'sales-customer-balance.html',       label:'Công nợ khách hàng',          group:'Kinh doanh',  icon:'users',    page:'sales-customer-balance' },
      { href:'sales-payment-reminders.html',      label:'Nhắc thanh toán',             group:'Kinh doanh',  icon:'bell',     page:'sales-payment-reminders' },
      { href:'sales-invoice-detail.html',         label:'Chi tiết hóa đơn (KD)',       group:'Kinh doanh',  icon:'file',     page:'sales-invoice-detail' },
      { href:'manager-receivable-dashboard.html', label:'Dashboard công nợ',           group:'Quản lý',     icon:'chart',    page:'manager-receivable-dashboard' },
      { href:'manager-overdue-invoices.html',     label:'Hóa đơn quá hạn',             group:'Quản lý',     icon:'alert',    page:'manager-overdue-invoices' },
      { href:'manager-cashflow-forecast.html',    label:'Dự báo dòng tiền',            group:'Quản lý',     icon:'trend',    page:'manager-cashflow-forecast' },
      { href:'admin-customer-management.html',    label:'Quản lý khách hàng',          group:'Quản trị viên', icon:'building', page:'admin-customer-management' },
      { href:'admin-user-management.html',        label:'Quản lý người dùng',          group:'Quản trị viên', icon:'shield', page:'admin-user-management' },
      { href:'admin-invoice-settings.html',       label:'Cấu hình hóa đơn',            group:'Quản trị viên', icon:'settings', page:'admin-invoice-settings' },
      { href:'profile.html',                      label:'Hồ sơ cá nhân',               group:'Tài khoản',   icon:'user',     page:'profile' },
      { href:'settings.html',                     label:'Cài đặt',                     group:'Tài khoản',   icon:'settings', page:'settings' },
      { href:'notifications.html',                label:'Thông báo',                   group:'Tài khoản',   icon:'bell',     page:'notifications' }
    ],

    /* ---------- Vai trò (dùng cho tab ở trang chủ) ---------- */
    roles: [
      { id:'accountant', name:'Kế toán', icon:'file',
        desc:'Quản lý hóa đơn, ghi nhận phiếu thu và đối chiếu công nợ với sổ sách.',
        tasks:['Lập và sửa hóa đơn','AI rà soát bất thường (AI-1)','Ghi nhận thanh toán','Đối chiếu và xuất báo cáo tuổi nợ'] },
      { id:'sales', name:'Kinh doanh', icon:'users',
        desc:'Theo dõi công nợ của từng khách hàng và chủ động nhắc thanh toán đúng hạn.',
        tasks:['Xem số dư theo khách hàng','Soạn nhắc nợ bằng AI (AI-2)','Ghi chú tương tác','Lên lịch nhắc tự động'] },
      { id:'manager', name:'Quản lý', icon:'chart',
        desc:'Nắm bức tranh công nợ toàn doanh nghiệp và dự báo dòng tiền các giai đoạn tới.',
        tasks:['Dashboard KPI công nợ','Xử lý danh sách quá hạn','Dự báo dòng tiền bằng AI (AI-3)','Theo dõi hiệu suất thu hồi'] },
      { id:'admin', name:'Quản trị viên', icon:'shield',
        desc:'Quản lý khách hàng, người dùng và toàn bộ cấu hình nghiệp vụ của hệ thống.',
        tasks:['Quản lý khách hàng','Phân quyền người dùng','Cấu hình mẫu & đánh số hóa đơn','Theo dõi nhật ký hệ thống'] }
    ]
  };
})();