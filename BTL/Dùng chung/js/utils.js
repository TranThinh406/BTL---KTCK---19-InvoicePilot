/**
 * utils.js — Định dạng hiển thị dùng chung cho mọi trang
 */
(function () {
  'use strict';

  const fmt = {
    /** 2450000 → "24.500.000 ₫" */
    vnd(n, withSymbol) {
      if (n == null || isNaN(n)) return '—';
      const s = Math.round(n).toLocaleString('vi-VN');
      return withSymbol === false ? s : s + ' ₫';
    },

    /** 2450000 → "24,5 triệu" (cho KPI/dashboard) */
    vndShort(n) {
      if (n == null || isNaN(n)) return '—';
      const abs = Math.abs(n);
      if (abs >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' tỷ';
      if (abs >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' tr';
      if (abs >= 1e3) return Math.round(n / 1e3) + ' nghìn';
      return String(n);
    },

    /** "2026-10-12" → "12/10/2026" */
    date(iso) {
      if (!iso) return '—';
      const d = iso.slice(0, 10).split('-');
      return d[2] + '/' + d[1] + '/' + d[0];
    },

    /** "2026-10-12 09:40" → "12/10/2026 09:40" */
    dateTime(v) {
      if (!v) return '—';
      return fmt.date(v) + (v.length > 10 ? ' ' + v.slice(11, 16) : '');
    },

    /** So sánh với hôm nay: "Còn 33 ngày" | "Đến hạn hôm nay" | "Quá hạn 12 ngày" */
    dueText(dueDate, today) {
      const t = today || window.MOCK.TODAY;
      const diff = Math.round((new Date(dueDate + 'T00:00:00') - new Date(t + 'T00:00:00')) / 86400000);
      if (diff > 0) return 'Còn ' + diff + ' ngày';
      if (diff === 0) return 'Đến hạn hôm nay';
      return 'Quá hạn ' + Math.abs(diff) + ' ngày';
    },

    /** Số ngày giữa 2 ngày ISO (b - a) */
    daysBetween(a, b) {
      return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
    },

    /** 0.1 → "10%" */
    percent(x) {
      return Math.round(x * 1000) / 10 + '%';
    },

    /** Trạng thái hóa đơn → màu badge */
    statusLabel(code) { return window.MOCK.STATUS_LABEL[code] || code; },
    statusTone(code) {
      return ({
        draft: 'neutral', issued: 'info', partial: 'warn',
        paid: 'success', overdue: 'danger', cancelled: 'neutral', archived: 'neutral'
      })[code] || 'neutral';
    },

    /** 3938000 → "Ba triệu chín trăm ba mươi tám nghìn đồng" */
    numberToWords(n) {
      if (!n || n < 0) return 'Không đồng';
      const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
      const units = ['', 'nghìn', 'triệu', 'tỷ'];

      function read3(num) { // đọc 3 chữ số
        let tr = Math.floor(num / 100), ch = Math.floor((num % 100) / 10), dv = num % 10, out = '';
        if (tr > 0) { out += ones[tr] + ' trăm'; if (ch === 0 && dv > 0) out += ' lẻ'; }
        if (ch > 1) { out += ' ' + ones[ch] + ' mươi'; if (dv === 1) out += ' mốt'; else if (dv === 5) out += ' lăm'; else if (dv > 0) out += ' ' + ones[dv]; }
        else if (ch === 1) { out += ' mười'; if (dv === 5) out += ' lăm'; else if (dv > 0) out += ' ' + ones[dv]; }
        else if (dv > 0 && (tr > 0 || num >= 10)) out += ' ' + ones[dv];
        else if (dv > 0) out += ones[dv];
        return out.trim();
      }

      let s = '', i = 0, parts = [];
      while (n > 0) { parts.push(n % 1000); n = Math.floor(n / 1000); }
      for (let k = parts.length - 1; k >= 0; k--) {
        if (parts[k] === 0) { i++; continue; }
        s += read3(parts[k]) + ' ' + units[k] + ' ';
        i++;
      }
      s = s.replace(/\s+/g, ' ').trim();
      return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng';
    },

    /** Escape HTML khi đổ dữ liệu ra DOM */
    esc(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
  };

  window.fmt = fmt;
})();