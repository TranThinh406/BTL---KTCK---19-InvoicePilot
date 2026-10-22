(function () {
  'use strict';

  const PAGES = {
    'admin-dashboard': {
      role: 'Quản trị viên', title: 'Tổng quan hệ thống',
      description: 'Theo dõi sức khỏe vận hành, dữ liệu khách hàng và cấu hình InvoicePilot.',
      metrics: [['Hồ sơ khách hàng', '14', 'Dữ liệu mẫu toàn hệ thống'], ['Người dùng', '14', 'Tài khoản theo 4 vai trò'], ['Hóa đơn đang theo dõi', '85', 'Đã đồng bộ sổ cái'], ['Cảnh báo cần chú ý', '4', 'Có thể xử lý ngay']],
      section: 'Tình trạng vận hành',
      columns: ['Hạng mục', 'Trạng thái', 'Cập nhật'],
      rows: [['Hồ sơ khách hàng', '14 hồ sơ mẫu', '12/10/2026', 'admin-customer-management.html', 'Quản lý'], ['Người dùng & phân quyền', '14 tài khoản', '12/10/2026', 'admin-user-management.html', 'Mở'], ['Hóa đơn điện tử', 'Đang kết nối', '12/10/2026', 'admin-invoice-settings.html', 'Cấu hình'], ['Nhật ký hoạt động', 'Đồng bộ', 'Hôm nay', 'admin-audit-log.html', 'Xem']],
      shortcuts: [['Quản lý khách hàng', 'Xem và cập nhật hồ sơ khách hàng.', 'admin-customer-management.html'], ['Người dùng & phân quyền', 'Quản lý tài khoản và phạm vi truy cập.', 'admin-user-management.html'], ['Danh mục hàng hóa', 'Quản lý hàng hóa, dịch vụ và đơn vị tính.', 'admin-product-catalog.html']]
    },
    'admin-product-catalog': {
      role: 'Quản trị viên', title: 'Danh mục hàng hóa',
      description: 'Danh sách hàng hóa và dịch vụ dùng khi lập hóa đơn.',
      metrics: [['Mặt hàng', '8', 'Đang hoạt động'], ['Dịch vụ', '3', 'Có thể lập hóa đơn'], ['Đơn vị tính', '6', 'Đã chuẩn hóa'], ['Cập nhật gần nhất', '12/10', 'Đồng bộ dữ liệu mẫu']],
      section: 'Hàng hóa & dịch vụ', columns: ['Mã hàng', 'Tên', 'Đơn vị', 'Đơn giá', 'Trạng thái'],
      rows: [['HH-001', 'Giấy A4 Double A', 'Ram', '82.000 ₫', 'Đang bán'], ['HH-002', 'Mực in laser đen', 'Hộp', '1.250.000 ₫', 'Đang bán'], ['HH-003', 'Dịch vụ giao hàng nội thành', 'Lần', '35.000 ₫', 'Đang bán'], ['HH-004', 'Bảo trì thiết bị văn phòng', 'Giờ', '250.000 ₫', 'Đang bán']],
      shortcuts: [['Lập hóa đơn', 'Chọn hàng hóa để thêm vào hóa đơn.', 'accountant-invoice-form.html'], ['Cấu hình hóa đơn', 'Kiểm tra thuế và quy tắc đánh số.', 'admin-invoice-settings.html']]
    },
    'admin-audit-log': {
      role: 'Quản trị viên', title: 'Nhật ký hoạt động',
      description: 'Theo dõi các thay đổi trên hồ sơ, hóa đơn và cấu hình hệ thống.',
      metrics: [['Sự kiện hôm nay', '128', 'Trên toàn hệ thống'], ['Người dùng hoạt động', '9', 'Trong 24 giờ qua'], ['Thay đổi cấu hình', '3', 'Trong tháng này'], ['Cảnh báo', '2', 'Cần rà soát']],
      section: 'Hoạt động gần đây', columns: ['Thời gian', 'Người thực hiện', 'Hoạt động', 'Đối tượng', 'Kết quả'],
      rows: [['12/10/2026 14:05', 'Trần Thị B', 'Duyệt kế hoạch xử lý nợ', 'KH-0007', 'Thành công'], ['12/10/2026 13:42', 'Phạm Thu Hà', 'Gửi nhắc nợ', 'KH-0012', 'Đã gửi'], ['12/10/2026 11:18', 'Nguyễn Văn A', 'Cập nhật hóa đơn', 'HD-2026-0753', 'Thành công'], ['12/10/2026 09:15', 'Phạm Quốc Hưng', 'Cập nhật hồ sơ khách hàng', 'KH-0024', 'Thành công']],
      shortcuts: [['Quản lý người dùng', 'Rà soát vai trò và trạng thái tài khoản.', 'admin-user-management.html'], ['Cấu hình hóa đơn', 'Xem lịch sử thay đổi cấu hình hóa đơn.', 'admin-invoice-settings.html']]
    },
    'admin-config-thresholds': {
      role: 'Quản trị viên', title: 'Ngưỡng cảnh báo',
      description: 'Theo dõi ngưỡng cảnh báo công nợ, hóa đơn và hoạt động bất thường.',
      metrics: [['Nhắc nợ từ', '7 ngày', 'Quá hạn'], ['Cảnh báo rủi ro', '30 ngày', 'Tuổi nợ'], ['Ngưỡng duyệt', '50 triệu ₫', 'Giá trị hóa đơn'], ['Cảnh báo đang bật', '6', 'Toàn hệ thống']],
      section: 'Quy tắc cảnh báo', columns: ['Quy tắc', 'Điều kiện', 'Mức độ', 'Trạng thái'],
      rows: [['Hóa đơn quá hạn', 'Quá hạn trên 7 ngày', 'Cao', 'Đang bật'], ['Khách hàng rủi ro', 'Tuổi nợ trên 30 ngày', 'Cao', 'Đang bật'], ['Duyệt hóa đơn', 'Giá trị từ 50.000.000 ₫', 'Trung bình', 'Đang bật'], ['Chữ ký số', 'Còn hạn dưới 30 ngày', 'Trung bình', 'Đang bật']],
      shortcuts: [['Cấu hình hóa đơn', 'Điều chỉnh quy tắc số hóa đơn và phát hành.', 'admin-invoice-settings.html'], ['Hóa đơn quá hạn', 'Xem danh sách đang vượt ngưỡng.', 'manager-overdue-invoices.html']]
    },
    'admin-data-permissions': {
      role: 'Quản trị viên', title: 'Phạm vi dữ liệu',
      description: 'Kiểm tra quyền xem dữ liệu theo vai trò và phạm vi phòng ban.',
      metrics: [['Vai trò', '4', 'Đã cấu hình'], ['Nhóm quyền', '12', 'Đang sử dụng'], ['Tài khoản ngoại lệ', '1', 'Cần rà soát'], ['Lần rà soát gần nhất', '12/10', 'Không có xung đột']],
      section: 'Ma trận quyền truy cập', columns: ['Vai trò', 'Hóa đơn', 'Khách hàng', 'Báo cáo', 'Cấu hình'],
      rows: [['Kế toán', 'Tạo & cập nhật', 'Xem', 'Xem', 'Không truy cập'], ['Kinh doanh', 'Xem', 'Theo phụ trách', 'Giới hạn', 'Không truy cập'], ['Quản lý', 'Xem toàn hệ thống', 'Xem toàn hệ thống', 'Xem & xuất', 'Duyệt'], ['Quản trị viên', 'Toàn quyền', 'Toàn quyền', 'Toàn quyền', 'Toàn quyền']],
      shortcuts: [['Quản lý người dùng', 'Kiểm tra tài khoản và vai trò.', 'admin-user-management.html'], ['Tổng quan hệ thống', 'Quay lại bảng điều khiển quản trị.', 'admin-dashboard.html']]
    },
    'admin-settings': {
      role: 'Quản trị viên', title: 'Cài đặt hệ thống',
      description: 'Cấu hình môi trường làm việc và tùy chọn chung của InvoicePilot.',
      metrics: [['Múi giờ', 'GMT+7', 'Asia/Ho_Chi_Minh'], ['Ngôn ngữ', 'Tiếng Việt', 'Ngôn ngữ hiển thị'], ['Định dạng tiền', 'VND', 'Đồng Việt Nam'], ['Phiên bản dữ liệu', 'Demo', 'Môi trường mẫu']],
      section: 'Thiết lập chung', columns: ['Thiết lập', 'Giá trị hiện tại', 'Ghi chú'],
      rows: [['Ngôn ngữ giao diện', 'Tiếng Việt', 'Áp dụng cho toàn bộ người dùng'], ['Múi giờ', 'GMT+7', 'Ngày tham chiếu dữ liệu mẫu: 12/10/2026'], ['Định dạng tiền tệ', 'VND · ₫', 'Không quy đổi ngoại tệ'], ['Thông báo hệ thống', 'Đang bật', 'Hiển thị cảnh báo trong ứng dụng']],
      shortcuts: [['Cấu hình hóa đơn', 'Cài đặt mẫu, thuế và cấp số hóa đơn.', 'admin-invoice-settings.html'], ['Trang chủ', 'Về trang vào InvoicePilot.', 'index.html']]
    },
    'accountant-dashboard': {
      role: 'Kế toán', title: 'Tổng quan kế toán',
      description: 'Tổng hợp hóa đơn, khoản thu và các việc kế toán cần xử lý.',
      metrics: [['Hóa đơn tháng này', '85', 'Đã phát hành và đang xử lý'], ['Đã thu', '1,42 tỷ ₫', 'Trong kỳ 10/2026'], ['Còn phải thu', '2,86 tỷ ₫', 'Toàn bộ hóa đơn mở'], ['Chờ xử lý', '6', 'Hóa đơn và đối soát']],
      section: 'Công việc kế toán', columns: ['Công việc', 'Số lượng', 'Ưu tiên'],
      rows: [['Hóa đơn cần theo dõi', '18', 'Cao', 'manager-overdue-invoices.html', 'Xem'], ['Kế hoạch xử lý nợ', '6', 'Trung bình', 'accountant-debt-plan.html', 'Mở'], ['Đối soát công nợ', '3 lệch', 'Cao', 'accountant-reconciliation.html', 'Mở'], ['Hồ sơ khách hàng', '14', 'Bình thường', 'accountant-customer-list.html', 'Xem']],
      shortcuts: [['Danh sách hóa đơn', 'Lọc, tìm kiếm và quản lý hóa đơn.', 'accountant-invoice-list.html'], ['Tạo hóa đơn', 'Bắt đầu lập hóa đơn mới.', 'accountant-invoice-form.html'], ['Thu tiền', 'Ghi nhận và đối chiếu khoản thu.', 'accountant-payment-list.html']]
    },
    'accountant-ai-dashboard': {
      role: 'Kế toán', title: 'Trợ lý AI kế toán',
      description: 'Các gợi ý chỉ mang tính hỗ trợ; hãy kiểm tra dữ liệu và xác nhận trước khi thực hiện.',
      metrics: [['Hóa đơn được rà soát', '85', 'Trong kỳ dữ liệu'], ['Điểm cần kiểm tra', '6', 'Trước khi phát hành'], ['Bản nháp nhắc nợ', '11', 'Chờ người dùng xem lại'], ['Độ tin cậy dự báo', '74%', 'Kịch bản cơ sở']],
      section: 'Gợi ý cần xem lại', columns: ['Tính năng', 'Gợi ý', 'Căn cứ'],
      rows: [['AI-1 · Kiểm tra hóa đơn', '6 hóa đơn có thông tin cần xác nhận', 'Ngày hạn và thông tin người mua', 'accountant-invoice-list.html', 'Rà soát'], ['AI-2 · Soạn nhắc nợ', '11 khách hàng có khoản quá hạn', 'Dư nợ và số ngày trễ', 'sales-payment-reminders.html', 'Xem nhắc nợ'], ['AI-3 · Tóm tắt dòng tiền', 'Tuần 1 có khoản chi lớn', 'Dự báo thu chi 7 tuần', 'manager-cashflow-forecast.html', 'Xem dự báo']],
      shortcuts: [['Hóa đơn', 'Kiểm tra nội dung trước khi phát hành.', 'accountant-invoice-list.html'], ['Nhắc nợ', 'Kiểm duyệt bản nháp trước khi gửi.', 'sales-payment-reminders.html']]
    },
    'accountant-customer-list': {
      role: 'Kế toán', title: 'Danh sách khách hàng',
      description: 'Tra cứu hồ sơ dùng cho lập hóa đơn, kiểm tra thông tin xuất hóa đơn và theo dõi công nợ.',
      customerList: true, section: 'Khách hàng trong hệ thống'
    },
    'accountant-customer-detail': {
      role: 'Kế toán', title: 'Chi tiết khách hàng',
      description: 'Thông tin xuất hóa đơn, liên hệ và số dư công nợ theo hồ sơ khách hàng.',
      customerDetail: true, section: 'Thông tin hồ sơ',
      shortcuts: [['Danh sách khách hàng', 'Quay lại danh bạ khách hàng.', 'accountant-customer-list.html'], ['Lập hóa đơn', 'Tạo hóa đơn cho khách hàng.', 'accountant-invoice-form.html']]
    },
    'accountant-alerts': {
      role: 'Kế toán', title: 'Cảnh báo kế toán',
      description: 'Những hóa đơn, khoản thu và đối soát đang cần kế toán kiểm tra.',
      metrics: [['Cảnh báo chưa xem', '3', 'Cần xử lý'], ['Hóa đơn quá hạn', '18', 'Trên toàn hệ thống'], ['Đối soát lệch', '3', 'Kỳ 10/2026'], ['Chờ duyệt', '4', 'Kế hoạch xử lý nợ']],
      section: 'Cảnh báo gần đây', columns: ['Mức độ', 'Nội dung', 'Đối tượng', 'Thời hạn'],
      rows: [['Cao', 'Hóa đơn đã quá hạn trên 30 ngày', '11 khách hàng', 'Hôm nay', 'manager-overdue-invoices.html', 'Xem'], ['Cao', 'Có dòng chưa khớp sao kê', '3 giao dịch', '12/10/2026', 'accountant-reconciliation.html', 'Xử lý'], ['Trung bình', 'Kế hoạch xử lý nợ chờ duyệt', '4 kế hoạch', '12/10/2026', 'accountant-debt-plan.html', 'Mở']],
      shortcuts: [['Hóa đơn', 'Mở danh sách hóa đơn.', 'accountant-invoice-list.html'], ['Đối soát', 'Kiểm tra các dòng giao dịch lệch.', 'accountant-reconciliation.html']]
    },
    'accountant-payment-list': {
      role: 'Kế toán', title: 'Thu tiền',
      description: 'Theo dõi phiếu thu, khoản thanh toán và ghép giao dịch ngân hàng với hóa đơn.',
      metrics: [['Đã thu trong kỳ', '1,42 tỷ ₫', '12 giao dịch'], ['Chờ đối chiếu', '3', 'Cần xác nhận'], ['Đã ghép hóa đơn', '96', 'Trong kỳ'], ['Phiếu thu mới', '8', 'Từ đầu tuần']],
      section: 'Giao dịch thu gần đây', columns: ['Ngày thu', 'Khách hàng', 'Tham chiếu', 'Số tiền', 'Trạng thái'],
      rows: [['12/10/2026', 'Công ty TNHH Sản xuất Thiên Hà', 'PT-2026-0388', '75.000.000 ₫', 'Đã đối chiếu'], ['11/10/2026', 'Công ty CP Xây dựng Phú Thịnh', 'PT-2026-0381', '42.000.000 ₫', 'Đã đối chiếu'], ['10/10/2026', 'Công ty TNHH Thương mại Bình Minh', 'PT-2026-0374', '60.000.000 ₫', 'Chờ đối chiếu']],
      shortcuts: [['Đối soát công nợ', 'Ghép giao dịch với sao kê ngân hàng.', 'accountant-reconciliation.html'], ['Hóa đơn', 'Kiểm tra số dư còn phải thu.', 'accountant-invoice-list.html']]
    },
    'accountant-invoice-adjustment': {
      role: 'Kế toán', title: 'Điều chỉnh hóa đơn',
      description: 'Tạo yêu cầu điều chỉnh có liên kết tới hóa đơn gốc và lưu lý do nghiệp vụ.',
      metrics: [['Yêu cầu trong kỳ', '5', '2 yêu cầu đang chờ'], ['Đã phê duyệt', '3', 'Trong tháng 10/2026'], ['Cần bổ sung', '1', 'Thiếu lý do điều chỉnh'], ['Hóa đơn gốc', 'Bắt buộc', 'Không tạo điều chỉnh độc lập']],
      section: 'Yêu cầu điều chỉnh gần đây', columns: ['Mã yêu cầu', 'Hóa đơn gốc', 'Lý do', 'Trạng thái'],
      rows: [['DC-2026-005', 'HD-2026-0731', 'Sai thông tin người mua', 'Đang chờ', 'sales-invoice-detail.html', 'Chi tiết'], ['DC-2026-004', 'HD-2026-0722', 'Điều chỉnh số lượng', 'Đã duyệt', 'sales-invoice-detail.html', 'Chi tiết']],
      shortcuts: [['Mở hóa đơn', 'Chọn hóa đơn gốc cần điều chỉnh.', 'accountant-invoice-list.html'], ['Lập hóa đơn', 'Quay lại biểu mẫu hóa đơn.', 'accountant-invoice-form.html']]
    },
    'manager-dashboard': {
      role: 'Quản lý', title: 'Tổng quan quản lý',
      description: 'Bức tranh toàn doanh nghiệp về công nợ, thu hồi và hiệu suất kinh doanh.',
      metrics: [['Công nợ phải thu', '2,86 tỷ ₫', '85 hóa đơn'], ['Nợ quá hạn', '520 triệu ₫', '18 hóa đơn'], ['Tỷ lệ thu hồi', '72%', 'Trong kỳ 10/2026'], ['Việc cần duyệt', '4', 'Đang chờ quyết định']],
      section: 'Theo dõi quản lý', columns: ['Nội dung', 'Giá trị', 'Tình trạng'],
      rows: [['Công nợ phải thu', '2,86 tỷ ₫', 'Cập nhật lúc 14:05', 'manager-receivable-dashboard.html', 'Xem'], ['Hóa đơn quá hạn', '18 hóa đơn', '11 khách hàng', 'manager-overdue-invoices.html', 'Xử lý'], ['Dự báo dòng tiền', '7 tuần', 'Kịch bản cơ sở', 'manager-cashflow-forecast.html', 'Mở'], ['Hiệu quả kinh doanh', '5 nhân viên', 'Trong kỳ', 'manager-sales-performance.html', 'Xem']],
      shortcuts: [['Hồ sơ chờ duyệt', 'Duyệt kế hoạch và khoản cần phê duyệt.', 'manager-pending-approvals.html'], ['Báo cáo', 'Mở báo cáo quản trị.', 'manager-reports.html'], ['Cảnh báo', 'Rà soát cảnh báo rủi ro.', 'manager-alerts.html']]
    },
    'manager-alerts': {
      role: 'Quản lý', title: 'Cảnh báo quản lý',
      description: 'Ưu tiên các rủi ro công nợ, biến động dòng tiền và việc chờ phê duyệt.',
      metrics: [['Mức nghiêm trọng cao', '2', 'Cần xử lý hôm nay'], ['Rủi ro công nợ', '11', 'Khách hàng quá hạn'], ['Việc chờ duyệt', '4', 'Kế hoạch xử lý nợ'], ['Cảnh báo mới', '3', 'Trong 24 giờ']],
      section: 'Danh sách cảnh báo', columns: ['Mức độ', 'Cảnh báo', 'Tác động', 'Trạng thái'],
      rows: [['Cao', '11 khách hàng có hóa đơn quá hạn', '520.000.000 ₫', 'Chưa xử lý', 'manager-overdue-invoices.html', 'Xử lý'], ['Cao', 'Dòng tiền tuần 1 thấp hơn ngưỡng an toàn', '150.000.000 ₫', 'Cần xem', 'manager-cashflow-forecast.html', 'Phân tích'], ['Trung bình', 'Kế hoạch xử lý nợ đang chờ phê duyệt', '4 kế hoạch', 'Chờ duyệt', 'manager-pending-approvals.html', 'Mở']],
      shortcuts: [['Chính sách duyệt', 'Kiểm tra giới hạn và quy tắc phê duyệt.', 'manager-approval-policies.html'], ['Tổng quan công nợ', 'Theo dõi tình hình thu hồi.', 'manager-receivable-dashboard.html']]
    },
    'manager-approval-policies': {
      role: 'Quản lý', title: 'Chính sách duyệt',
      description: 'Tra cứu ngưỡng và luồng phê duyệt cho kế hoạch thu hồi, hóa đơn và ngoại lệ.',
      metrics: [['Luồng phê duyệt', '4', 'Đang bật'], ['Ngưỡng hóa đơn', '50 triệu ₫', 'Cần trưởng phòng duyệt'], ['SLA xử lý', '2 ngày', 'Ngày làm việc'], ['Chính sách cập nhật', '12/10', 'Hiệu lực hiện tại']],
      section: 'Quy tắc phê duyệt', columns: ['Loại yêu cầu', 'Điều kiện', 'Người duyệt', 'Thời hạn', 'Trạng thái'],
      rows: [['Hóa đơn giá trị cao', 'Từ 50.000.000 ₫', 'Trưởng phòng Tài chính', '2 ngày', 'Đang bật'], ['Kế hoạch xử lý nợ', 'Mọi kế hoạch mới', 'Quản lý công nợ', '2 ngày', 'Đang bật'], ['Điều chỉnh công nợ', 'Giảm trên 10%', 'Kế toán trưởng', '1 ngày', 'Đang bật'], ['Ngoại lệ hạn mức', 'Vượt hạn mức tín dụng', 'Quản lý', '2 ngày', 'Đang bật']],
      shortcuts: [['Hồ sơ chờ duyệt', 'Xử lý các yêu cầu đang nằm trong luồng.', 'manager-pending-approvals.html'], ['Quản lý hóa đơn', 'Rà soát các hóa đơn cần duyệt.', 'admin-invoice-settings.html']]
    },
    'manager-pending-approvals': {
      role: 'Quản lý', title: 'Hồ sơ chờ duyệt',
      description: 'Danh sách yêu cầu đang cần người quản lý xem xét và quyết định.',
      metrics: [['Đang chờ', '4', 'Từ 3 người đề xuất'], ['Quá SLA', '1', 'Cần ưu tiên'], ['Đã duyệt kỳ này', '12', 'Từ đầu tháng'], ['Từ chối kỳ này', '2', 'Có ghi rõ lý do']],
      section: 'Yêu cầu cần quyết định', columns: ['Mã', 'Loại', 'Người đề xuất', 'Giá trị', 'Trạng thái'],
      rows: [['KP-2026-014', 'Kế hoạch thu hồi', 'Nguyễn Văn A', '75.000.000 ₫', 'Chờ duyệt'], ['KP-2026-013', 'Gia hạn công nợ', 'Phạm Thu Hà', '42.000.000 ₫', 'Chờ duyệt'], ['KP-2026-012', 'Điều chỉnh lịch thu', 'Lê Minh Tuấn', '98.000.000 ₫', 'Quá SLA'], ['KP-2026-011', 'Kế hoạch thu hồi', 'Nguyễn Thị Lan', '25.000.000 ₫', 'Chờ duyệt']],
      shortcuts: [['Kế hoạch xử lý nợ', 'Xem và cập nhật kế hoạch thu hồi.', 'accountant-debt-plan.html'], ['Chính sách duyệt', 'Kiểm tra ngưỡng xử lý.', 'manager-approval-policies.html']]
    },
    'manager-reports': {
      role: 'Quản lý', title: 'Báo cáo quản trị',
      description: 'Chọn báo cáo tuổi nợ, hiệu quả thu hồi hoặc dự báo dòng tiền.',
      metrics: [['Báo cáo sẵn có', '4', 'Theo kỳ dữ liệu'], ['Kỳ hiện tại', '10/2026', 'Cập nhật 14:05'], ['Định dạng xuất', 'CSV', 'Tương thích Excel'], ['Dữ liệu', '85 hóa đơn', 'Đã đồng bộ']],
      section: 'Danh mục báo cáo', columns: ['Báo cáo', 'Nội dung', 'Kỳ'],
      rows: [['Tuổi nợ phải thu', 'Phân nhóm theo số ngày quá hạn', '10/2026', 'manager-reports-export.html', 'Xuất'], ['Hiệu suất thu hồi', 'So sánh nhân viên kinh doanh', '10/2026', 'manager-sales-performance.html', 'Xem'], ['Dự báo dòng tiền', 'Dự báo 7 tuần và kịch bản', '10/2026', 'manager-cashflow-forecast.html', 'Mở'], ['Tổng quan công nợ', 'KPI, lịch đến hạn và nhóm rủi ro', '10/2026', 'manager-receivable-dashboard.html', 'Xem']],
      shortcuts: [['Xuất báo cáo tuổi nợ', 'Chọn định dạng và tải dữ liệu.', 'manager-reports-export.html'], ['Dự báo dòng tiền', 'Phân tích kịch bản thu chi.', 'manager-cashflow-forecast.html']]
    },
    'manager-reports-export': {
      role: 'Quản lý', title: 'Xuất báo cáo tuổi nợ',
      description: 'Chuẩn bị bảng dữ liệu tuổi nợ có thể tải xuống và mở bằng Excel.',
      metrics: [['Hóa đơn trong báo cáo', '18', 'Đang quá hạn'], ['Khách hàng', '11', 'Có số dư quá hạn'], ['Tổng nợ quá hạn', '520 triệu ₫', 'Tính đến 12/10/2026'], ['Định dạng', 'CSV', 'UTF-8']],
      section: 'Tóm tắt báo cáo', columns: ['Nhóm tuổi nợ', 'Số hóa đơn', 'Số tiền', 'Mức độ'],
      rows: [['1 – 30 ngày', '8', '185.000.000 ₫', 'Theo dõi'], ['31 – 60 ngày', '5', '142.000.000 ₫', 'Cao'], ['61 – 90 ngày', '3', '106.000.000 ₫', 'Rất cao'], ['Trên 90 ngày', '2', '87.000.000 ₫', 'Nghiêm trọng']],
      shortcuts: [['Danh sách hóa đơn quá hạn', 'Xem các bản ghi trong báo cáo.', 'manager-overdue-invoices.html'], ['Báo cáo quản trị', 'Quay lại danh mục báo cáo.', 'manager-reports.html']]
    },
    'manager-sales-performance': {
      role: 'Quản lý', title: 'Hiệu quả kinh doanh',
      description: 'So sánh số dư quá hạn, số thu và tỷ lệ phản hồi theo nhân viên phụ trách.',
      metrics: [['Đã thu hồi', '1,42 tỷ ₫', 'Trong kỳ 10/2026'], ['Tỷ lệ phản hồi', '78%', 'Trên toàn đội'], ['Khách đang theo dõi', '31', 'Theo nhân viên'], ['Cam kết thu', '6', 'Còn hiệu lực']],
      section: 'Hiệu suất nhân viên', columns: ['Nhân viên', 'Khách hàng phụ trách', 'Nợ quá hạn', 'Đã thu', 'Phản hồi'],
      rows: [['Lê Minh Tuấn', '9', '120.000.000 ₫', '315.000.000 ₫', '84%'], ['Nguyễn Thị Lan', '7', '98.000.000 ₫', '286.000.000 ₫', '81%'], ['Trần Văn Hùng', '6', '142.000.000 ₫', '244.000.000 ₫', '73%'], ['Phạm Thu Hà', '5', '75.000.000 ₫', '312.000.000 ₫', '79%']],
      shortcuts: [['Tổng quan công nợ', 'Xem số liệu phải thu hợp nhất.', 'manager-receivable-dashboard.html'], ['Hóa đơn quá hạn', 'Mở danh sách cần thu hồi.', 'manager-overdue-invoices.html']]
    },
    'sales-dashboard': {
      role: 'Kinh doanh', title: 'Tổng quan kinh doanh',
      description: 'Theo dõi khách hàng, số dư công nợ và lịch nhắc thanh toán của nhóm phụ trách.',
      metrics: [['Khách hàng phụ trách', '14', 'Hồ sơ đang hoạt động'], ['Công nợ đang theo dõi', '1,76 tỷ ₫', 'Theo nhóm kinh doanh'], ['Khoản quá hạn', '11', 'Khách hàng cần liên hệ'], ['Lịch nhắc hôm nay', '5', 'Có thể gửi ngay']],
      section: 'Việc cần theo dõi', columns: ['Việc', 'Số lượng', 'Cập nhật'],
      rows: [['Khách hàng', '14 hồ sơ', '12/10/2026', 'sales-customer-list.html', 'Mở'], ['Số dư công nợ', '6 khách hàng', '09:15', 'sales-customer-balance.html', 'Xem'], ['Nhắc nợ', '11 khách hàng', '09:15', 'sales-payment-reminders.html', 'Xử lý'], ['Ghi chú thu hồi', '8 ghi chú', 'Hôm nay', 'sales-followup.html', 'Mở']],
      shortcuts: [['Danh sách khách hàng', 'Tra cứu hồ sơ trong phạm vi phụ trách.', 'sales-customer-list.html'], ['Số dư công nợ', 'Xem số tiền và tuổi nợ.', 'sales-customer-balance.html'], ['Nhắc nợ thanh toán', 'Soạn và theo dõi nhắc nợ.', 'sales-payment-reminders.html']]
    },
    'sales-customer-list': {
      role: 'Kinh doanh', title: 'Khách hàng của tôi',
      description: 'Tra cứu hồ sơ khách hàng, thông tin liên hệ và tình hình công nợ trong phạm vi phụ trách.',
      customerList: true, section: 'Danh sách khách hàng'
    },
    'sales-customer-detail': {
      role: 'Kinh doanh', title: 'Chi tiết khách hàng',
      description: 'Hồ sơ liên hệ, tình trạng công nợ và lịch sử chăm sóc khách hàng.',
      metrics: [['Công nợ hiện tại', '560.000.000 ₫', 'Tổng số dư mở'], ['Nợ quá hạn', '75.000.000 ₫', '2 hóa đơn'], ['Tuổi nợ bình quân', '27 ngày', 'Nhóm B'], ['Phụ trách', 'Lê Minh Tuấn', 'Kinh doanh']],
      section: 'Hồ sơ khách hàng · KH-0012', columns: ['Thông tin', 'Chi tiết'],
      rows: [['Tên khách hàng', 'Công ty TNHH Sản xuất Thiên Hà'], ['Người liên hệ', 'Nguyễn Văn Hải · Trưởng phòng Kế toán'], ['Điện thoại', '028 3712 4488'], ['Email', 'ketoan@thienha.com.vn'], ['Địa chỉ', '48 Nguyễn Văn Quá, TP.HCM'], ['Lịch sử gần nhất', 'Cam kết thu 75.000.000 ₫ trước 15/10/2026']],
      shortcuts: [['Số dư công nợ', 'Xem bảng kê và tuổi nợ chi tiết.', 'sales-customer-balance.html'], ['Nhắc nợ thanh toán', 'Gửi nhắc nợ và ghi nhận cam kết.', 'sales-payment-reminders.html'], ['Danh sách khách hàng', 'Quay lại danh sách khách.', 'sales-customer-list.html']]
    },
    'sales-followup': {
      role: 'Kinh doanh', title: 'Ghi chú thu hồi',
      description: 'Lưu lại cuộc gọi, cam kết thanh toán và bước chăm sóc tiếp theo.',
      metrics: [['Ghi chú trong kỳ', '18', 'Toàn nhóm'], ['Cam kết còn hiệu lực', '6', 'Cần theo dõi đúng hẹn'], ['Cuộc gọi hôm nay', '5', 'Đã lên lịch'], ['Quá hạn cần nhắc', '11', 'Khách hàng']],
      section: 'Hoạt động thu hồi gần đây', columns: ['Khách hàng', 'Ghi chú', 'Ngày hẹn', 'Người phụ trách'],
      rows: [['Công ty TNHH Sản xuất Thiên Hà', 'Xác nhận thanh toán 75 triệu sau khi đối chiếu chứng từ.', '15/10/2026', 'Lê Minh Tuấn'], ['Công ty CP Xây dựng Phú Thịnh', 'Đã gửi bảng kê, chờ xác nhận kế toán.', '22/10/2026', 'Nguyễn Thị Lan'], ['Công ty TNHH Thương mại Bình Minh', 'Khách đề nghị chia 2 đợt thanh toán.', '28/10/2026', 'Trần Văn Hùng']],
      shortcuts: [['Nhắc nợ', 'Gửi thông báo theo từng khách hàng.', 'sales-payment-reminders.html'], ['Khách hàng', 'Mở hồ sơ và thông tin liên hệ.', 'sales-customer-list.html']]
    },
    'sales-invoice-list': {
      role: 'Kinh doanh', title: 'Hóa đơn khách hàng',
      description: 'Tra cứu trạng thái phát hành và thanh toán hóa đơn gắn với khách hàng phụ trách.',
      metrics: [['Hóa đơn đang theo dõi', '85', 'Trong kỳ dữ liệu'], ['Đã thanh toán', '52', 'Đã tất toán'], ['Còn phải thu', '24', 'Hóa đơn mở'], ['Quá hạn', '18', 'Cần nhắc khách']],
      section: 'Hóa đơn gần đây', columns: ['Mã hóa đơn', 'Khách hàng', 'Ngày phát hành', 'Còn phải thu', 'Trạng thái'],
      rows: [['HD-2026-0753', 'Công ty TNHH Sản xuất Thiên Hà', '10/10/2026', '30.000.000 ₫', 'Đã phát hành'], ['HD-2026-0741', 'Công ty TNHH Sản xuất Thiên Hà', '02/10/2026', '45.000.000 ₫', 'Cam kết thu'], ['HD-2026-0731', 'Công ty TNHH Thương mại Bình Minh', '12/06/2026', '98.000.000 ₫', 'Quá hạn']],
      shortcuts: [['Danh sách kế toán', 'Mở danh sách hóa đơn đầy đủ.', 'accountant-invoice-list.html'], ['Nhắc nợ', 'Theo dõi và gửi nhắc cho khách hàng.', 'sales-payment-reminders.html']]
    },
    'sales-order-list': {
      role: 'Kinh doanh', title: 'Danh sách đơn hàng',
      description: 'Theo dõi trạng thái đơn hàng trước khi phát hành hóa đơn.',
      metrics: [['Đơn hàng trong kỳ', '32', 'Tháng 10/2026'], ['Đang xử lý', '7', 'Chờ giao hoặc xác nhận'], ['Đã hoàn tất', '21', 'Có thể lập hóa đơn'], ['Cần kiểm tra', '4', 'Thiếu thông tin']],
      section: 'Đơn hàng gần đây', columns: ['Mã đơn', 'Khách hàng', 'Ngày tạo', 'Giá trị', 'Trạng thái'],
      rows: [['DH-2026-0182', 'Công ty TNHH Sản xuất Thiên Hà', '12/10/2026', '75.000.000 ₫', 'Đang xử lý'], ['DH-2026-0179', 'Công ty CP Xây dựng Phú Thịnh', '11/10/2026', '42.000.000 ₫', 'Hoàn tất'], ['DH-2026-0174', 'Công ty TNHH Thương mại Bình Minh', '09/10/2026', '98.000.000 ₫', 'Chờ xác nhận']],
      shortcuts: [['Chi tiết đơn hàng', 'Xem mẫu chi tiết đơn hàng.', 'sales-order-detail.html'], ['Danh sách hóa đơn', 'Theo dõi hóa đơn đã phát hành.', 'sales-invoice-list.html']]
    },
    'sales-order-detail': {
      role: 'Kinh doanh', title: 'Chi tiết đơn hàng DH-2026-0182',
      description: 'Thông tin đơn hàng, khách hàng và tiến trình xử lý.',
      metrics: [['Giá trị đơn hàng', '75.000.000 ₫', 'Trước thuế'], ['Trạng thái', 'Đang xử lý', 'Cập nhật 12/10/2026'], ['Khách hàng', 'Thiên Hà', 'KH-0012'], ['Hóa đơn', 'Chưa phát hành', 'Chờ hoàn tất đơn']],
      section: 'Thông tin đơn hàng', columns: ['Hạng mục', 'Thông tin'],
      rows: [['Mã đơn hàng', 'DH-2026-0182'], ['Khách hàng', 'Công ty TNHH Sản xuất Thiên Hà'], ['Ngày đặt', '12/10/2026'], ['Người phụ trách', 'Lê Minh Tuấn'], ['Tiến trình', 'Đã xác nhận đơn · Đang chuẩn bị giao'], ['Bước tiếp theo', 'Hoàn tất giao hàng và lập hóa đơn']],
      shortcuts: [['Khách hàng', 'Mở danh sách hồ sơ khách hàng.', 'sales-customer-list.html'], ['Hóa đơn', 'Mở danh sách hóa đơn.', 'sales-invoice-list.html']]
    }
  };

  const ROLE_LINKS = {
    'Quản trị viên': [['Tổng quan', 'admin-dashboard.html'], ['Khách hàng', 'admin-customer-management.html'], ['Người dùng', 'admin-user-management.html'], ['Danh mục hàng hóa', 'admin-product-catalog.html'], ['Cấu hình hóa đơn', 'admin-invoice-settings.html'], ['Cài đặt hệ thống', 'admin-settings.html'], ['Nhật ký', 'admin-audit-log.html']],
    'Kế toán': [['Tổng quan', 'accountant-dashboard.html'], ['Hóa đơn', 'accountant-invoice-list.html'], ['Khách hàng', 'accountant-customer-list.html'], ['Thu tiền', 'accountant-payment-list.html'], ['Kế hoạch xử lý nợ', 'accountant-debt-plan.html'], ['Đối soát', 'accountant-reconciliation.html'], ['Trợ lý AI', 'accountant-ai-dashboard.html']],
    'Quản lý': [['Tổng quan', 'manager-dashboard.html'], ['Công nợ', 'manager-receivable-dashboard.html'], ['Quá hạn', 'manager-overdue-invoices.html'], ['Báo cáo', 'manager-reports.html'], ['Chờ duyệt', 'manager-pending-approvals.html'], ['Dự báo dòng tiền', 'manager-cashflow-forecast.html']],
    'Kinh doanh': [['Tổng quan', 'sales-dashboard.html'], ['Khách hàng', 'sales-customer-list.html'], ['Đơn hàng', 'sales-order-list.html'], ['Hóa đơn', 'sales-invoice-list.html'], ['Số dư công nợ', 'sales-customer-balance.html'], ['Nhắc nợ', 'sales-payment-reminders.html']]
  };

  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
    customer: '<circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3.1 2.7-5 6-5s6 1.9 6 5M16 8h5M16 12h5M16 16h5"/>',
    catalog: '<path d="m4 8 8-4 8 4-8 4-8-4Zm0 4 8 4 8-4M4 16l8 4 8-4"/>',
    invoice: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    payment: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14h4"/>',
    debt: '<path d="M4 19V5m0 14h16M8 15V9m4 6v-3m4 3V7"/>',
    reconcile: '<path d="M4 7h9m0 0-2.5-2.5M13 7l-2.5 2.5M20 17h-9m0 0 2.5-2.5M11 17l2.5 2.5"/>',
    report: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 16v-3m3 3v-6m3 6v-4"/>',
    approval: '<path d="m4 12.5 5 5L20 6.5"/>',
    alert: '<path d="M12 4 2.8 20h18.4L12 4Z"/><path d="M12 10v4m0 3h.01"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8m11-1.8-1.8 1.8M7.4 16.6l-1.8 1.8m11 0-1.8-1.8"/>',
    audit: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 1.8"/>',
    permissions: '<rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15" r="1.2"/>',
    forecast: '<path d="M4 19h16M7 19V9m5 10V5m5 14v-7"/>',
    order: '<path d="M4 7h16l-1.5 12.5h-13L4 7Z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/>',
    sparkle: '<path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Zm6 13 .9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z"/>'
  };

  const CUSTOMER_COLUMNS = ['Mã khách hàng', 'Khách hàng', 'Người liên hệ', 'Công nợ', 'Quá hạn', 'Phụ trách'];
  const CUSTOMERS = window.MOCK && window.MOCK.customers ? window.MOCK.customers : [];

  function money(n) {
    return Number(n || 0).toLocaleString('vi-VN') + ' ₫';
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function pageHref(target) {
    const source = new URL(target, location.href);
    const filename = decodeURIComponent(source.pathname.split('/').pop());
    let folder = 'Dùng chung';
    if (filename === 'login.html' || filename === 'register.html' || filename === 'forgot-password.html') folder = 'Đăng nhập';
    else if (filename === '403.html' || filename === '404.html') folder = 'Lỗi';
    else if (/^accountant-/.test(filename)) folder = 'Kế toán';
    else if (/^sales-/.test(filename)) folder = 'Kinh doanh';
    else if (/^manager-/.test(filename)) folder = 'Quản lý';
    else if (/^admin-/.test(filename)) folder = 'Quản trị';
    const root = new URL('../../', location.href);
    const resolved = new URL(encodeURIComponent(folder) + '/html/' + encodeURIComponent(filename), root);
    resolved.search = source.search;
    resolved.hash = source.hash;
    return resolved.href;
  }
  function link(label, href, active) {
    return '<a href="' + esc(pageHref(href)) + '"' + (active ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>';
  }
  function iconFor(label) {
    if (/tổng quan/i.test(label)) return ICONS.dashboard;
    if (/khách hàng/i.test(label)) return ICONS.customer;
    if (/người dùng/i.test(label)) return ICONS.users;
    if (/hàng hóa/i.test(label)) return ICONS.catalog;
    if (/cài đặt|cấu hình/i.test(label)) return ICONS.settings;
    if (/hóa đơn/i.test(label)) return ICONS.invoice;
    if (/thu tiền/i.test(label)) return ICONS.payment;
    if (/quá hạn|cảnh báo|nhắc nợ/i.test(label)) return ICONS.alert;
    if (/nợ|thu hồi/i.test(label)) return ICONS.debt;
    if (/đối soát/i.test(label)) return ICONS.reconcile;
    if (/báo cáo/i.test(label)) return ICONS.report;
    if (/duyệt/i.test(label)) return ICONS.approval;
    if (/nhật ký/i.test(label)) return ICONS.audit;
    if (/phạm vi/i.test(label)) return ICONS.permissions;
    if (/dự báo|hiệu quả/i.test(label)) return ICONS.forecast;
    if (/đơn hàng/i.test(label)) return ICONS.order;
    if (/ai/i.test(label)) return ICONS.sparkle;
    return ICONS.report;
  }
  function navLink(item, active) {
    return '<a href="' + esc(pageHref(item[1])) + '"' + (active ? ' aria-current="page"' : '') +
      '><span class="rp-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      iconFor(item[0]) + '</svg></span><span>' + esc(item[0]) + '</span></a>';
  }
  function actionLink(label, href) {
    return '<a class="rp-button rp-button--primary" href="' + esc(pageHref(href)) + '">' + esc(label) + '</a>';
  }
  function makeRows(page, id, customer) {
    if (page.customerDetail) {
      return [
        ['Mã khách hàng', customer.id],
        ['Mã số thuế', customer.taxId || 'Chưa cập nhật'],
        ['Người liên hệ', (customer.contact || '—') + ' · ' + (customer.role || '—')],
        ['Điện thoại', customer.phone || '—'],
        ['Email nhận hóa đơn', customer.email || '—'],
        ['Địa chỉ', customer.address || '—'],
        ['Phụ trách', customer.owner || '—'],
        ['Lịch sử chăm sóc', customer.note || 'Chưa có ghi chú']
      ];
    }
    if (page.customerList) {
      const detailPage = id === 'accountant-customer-list' ? 'accountant-customer-detail.html' : 'sales-customer-detail.html';
      return CUSTOMERS.map(function (c) {
        return [c.id, c.name, c.contact || '—', money(c.outstanding), money(c.overdue), c.owner || '—',
          detailPage + '?customer=' + encodeURIComponent(c.id), 'Chi tiết'];
      });
    }
    return page.rows || [];
  }

  function render() {
    const body = document.body;
    const id = body.dataset.rolePage;
    const root = document.getElementById('role-page-root');
    if (!root) return;

    const page = PAGES[id];
    if (!page) {
      root.innerHTML = '<main class="rp-content"><h1>Không tìm thấy trang</h1><a href="' + esc(pageHref('index.html')) + '">Về trang chủ</a></main>';
      return;
    }

    const selectedCustomer = page.customerDetail
      ? CUSTOMERS.find(function (customer) { return customer.id === new URLSearchParams(location.search).get('customer'); }) || CUSTOMERS[0]
      : null;
    const title = page.customerDetail && selectedCustomer ? selectedCustomer.name : page.title;
    document.title = page.title + ' · InvoicePilot';
    const nav = (ROLE_LINKS[page.role] || []).map(function (item) {
      const active = item[1] === id + '.html' ||
        (page.customerDetail && /-customer-list\.html$/.test(item[1]));
      return navLink(item, active);
    }).join('');
    const pageMetrics = page.customerDetail && selectedCustomer
      ? [['Công nợ hiện tại', money(selectedCustomer.outstanding), 'Tổng số dư mở'], ['Nợ quá hạn', money(selectedCustomer.overdue), selectedCustomer.overdueInvoices + ' hóa đơn'], ['Tuổi nợ bình quân', (selectedCustomer.avgDaysOverdue || 0) + ' ngày', 'Theo dữ liệu công nợ'], ['Nhóm công nợ', selectedCustomer.group || '—', 'Người phụ trách: ' + (selectedCustomer.owner || '—')]]
      : page.metrics || [];
    const metrics = pageMetrics.map(function (m) {
      const danger = /quá hạn|cảnh báo|quá SLA/i.test(m[0]);
      return '<article class="rp-card"><div class="rp-card-label">' + esc(m[0]) + '</div><div class="rp-card-value' +
        (danger ? ' is-danger' : '') + '">' +
        esc(m[1]) + '</div><div class="rp-card-note">' + esc(m[2]) + '</div></article>';
    }).join('');
    const columns = page.customerList ? CUSTOMER_COLUMNS : page.customerDetail ? ['Thông tin', 'Chi tiết'] : (page.columns || ['Nội dung', 'Chi tiết']);
    const rows = makeRows(page, id, selectedCustomer);
    const hasLinks = rows.some(function (row) { return row.length > columns.length; });
    const table = '<div class="rp-table-wrap"><table class="rp-table" id="rp-table"><thead><tr>' +
      columns.map(function (col) { return '<th>' + esc(col) + '</th>'; }).join('') +
      (hasLinks ? '<th>Thao tác</th>' : '') +
      '</tr></thead><tbody>' + rows.map(function (row) {
        return '<tr>' + row.slice(0, columns.length).map(function (cell) {
          return '<td>' + esc(cell) + '</td>';
        }).join('') + (hasLinks ? '<td>' + (row.length > columns.length
          ? link(row[columns.length + 1] || 'Mở', row[columns.length])
          : '') + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table><p class="rp-empty" id="rp-empty" hidden>Không tìm thấy dữ liệu phù hợp.</p></div>';
    const shortcuts = (page.shortcuts || []).map(function (s) {
      return '<a class="rp-shortcut" href="' + esc(pageHref(s[2])) + '"><strong>' + esc(s[0]) + '</strong><span>' + esc(s[1]) + '</span></a>';
    }).join('');
    const primaryAction = page.customerList
      ? actionLink(page.role === 'Kế toán' ? 'Lập hóa đơn' : 'Xem số dư', page.role === 'Kế toán' ? 'accountant-invoice-form.html' : 'sales-customer-balance.html')
      : actionLink('Mở danh sách', (page.shortcuts && page.shortcuts[0] && page.shortcuts[0][2]) || 'index.html');

    root.innerHTML =
      '<aside class="rp-sidebar"><a class="rp-brand" href="' + esc(pageHref('index.html')) + '"><span class="rp-brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></span>InvoicePilot</a>' +
      '<p class="rp-nav-label">' + esc(page.role) + '</p><nav class="rp-nav">' + nav + '</nav>' +
      '<div class="rp-sidebar-foot">Dữ liệu mẫu · cập nhật 12/10/2026</div></aside>' +
      '<div class="rp-main"><header class="rp-topbar"><div class="rp-breadcrumb">' + link('Trang chủ', 'index.html') + ' / ' + esc(page.role) + '</div><span>' + esc(page.role) + '</span></header>' +
      '<main class="rp-content"><section class="rp-heading"><div><span class="rp-eyebrow">' + esc(page.role) +
      '</span><h1>' + esc(page.customerDetail ? 'Chi tiết khách hàng' : page.title) + '</h1><p>' + esc(page.description) + '</p></div>' +
      '<div class="rp-actions">' + primaryAction + '<button class="rp-button" id="rp-export" type="button">Xuất CSV</button></div></section>' +
      '<section class="rp-metrics" aria-label="Chỉ số tổng quan">' + metrics + '</section>' +
      '<section class="rp-panel"><div class="rp-panel-head"><h2>' + esc(page.section || 'Danh sách') +
      '</h2><input class="rp-search" id="rp-search" type="search" placeholder="Tìm trong danh sách..." aria-label="Tìm kiếm"></div>' +
      table + '</section>' + (shortcuts ? '<section class="rp-shortcuts" aria-label="Điều hướng nhanh">' + shortcuts + '</section>' : '') +
      '<footer class="rp-footer">InvoicePilot · Màn hình ' + esc(page.title) + '</footer></main></div>';

    bindTable();
  }

  function bindTable() {
    const search = document.getElementById('rp-search');
    const table = document.getElementById('rp-table');
    const empty = document.getElementById('rp-empty');
    if (search && table) {
      search.addEventListener('input', function () {
        const q = search.value.trim().toLocaleLowerCase('vi');
        let visible = 0;
        Array.prototype.forEach.call(table.tBodies[0].rows, function (row) {
          row.hidden = q && !row.textContent.toLocaleLowerCase('vi').includes(q);
          if (!row.hidden) visible++;
        });
        if (empty) empty.hidden = visible > 0;
      });
    }
    const exportButton = document.getElementById('rp-export');
    if (exportButton && table) {
      exportButton.addEventListener('click', function () {
        const rows = Array.prototype.map.call(table.rows, function (row) {
          return Array.prototype.map.call(row.cells, function (cell) {
            return '"' + cell.innerText.replace(/"/g, '""') + '"';
          }).join(',');
        });
        const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = (document.title.split('·')[0].trim().replace(/\s+/g, '-').toLowerCase() || 'invoicepilot') + '.csv';
        anchor.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();
