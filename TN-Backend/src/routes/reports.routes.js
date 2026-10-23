'use strict';

/**
 * @file routes/reports.routes.js
 * @description Báo cáo & xuất Excel cho Admin.
 */

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Xuất báo cáo Excel (chỉ ADMIN)
 */

/**
 * @swagger
 * /api/reports/export-excel:
 *   get:
 *     summary: "[ADMIN] Xuất báo cáo tổng hợp ra file Excel (.xlsx)"
 *     description: |
 *       Tải về file Excel gồm 4 sheet:
 *       - **Tổng quan**: KPIs tổng hợp
 *       - **Đơn mượn thiết bị**: Chi tiết từng đơn
 *       - **Đặt phòng Studio**: Chi tiết từng booking
 *       - **Thiết bị**: Danh sách toàn bộ thiết bị
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [month, week, year, custom, month-year]
 *           default: month
 *         description: Khoảng thời gian báo cáo
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         description: Ngày bắt đầu (khi range=custom)
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         description: Ngày kết thúc (khi range=custom)
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *         description: Tháng (khi range=month-year)
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Năm (khi range=year hoặc month-year)
 *     responses:
 *       200:
 *         description: File Excel tải về thành công
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không đủ quyền (cần ADMIN)
 *       500:
 *         description: Lỗi xuất Excel
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { User, Equipment, BorrowRequest, StudioBooking, EquipmentCategory } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// ============================================================
// Helpers
// ============================================================
function getDateRange(query) {
  const now = new Date();
  const { range = 'month', startDate, endDate, month, year } = query;

  switch (range) {
    case 'week': {
      const day = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: 'Tuần này' };
    }
    case 'year': {
      const y = parseInt(year) || now.getFullYear();
      return {
        start: new Date(y, 0, 1),
        end: new Date(y, 11, 31, 23, 59, 59),
        label: `Năm ${y}`,
      };
    }
    case 'month-year': {
      const m = parseInt(month) - 1 || now.getMonth();
      const y = parseInt(year) || now.getFullYear();
      return {
        start: new Date(y, m, 1),
        end: new Date(y, m + 1, 0, 23, 59, 59),
        label: `Tháng ${m + 1}/${y}`,
      };
    }
    case 'custom': {
      if (startDate && endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return { start: new Date(startDate), end, label: `${startDate} → ${endDate}` };
      }
      // fallthrough to month default
    }
    // eslint-disable-next-line no-fallthrough
    case 'month':
    default: {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        label: `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`,
      };
    }
  }
}

// Style helpers
function applyHeaderStyle(row, bgColor = '1F3864') {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  row.height = 28;
}

function applyDataStyle(row, isEven = false) {
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: isEven ? 'FFF2F2F2' : 'FFFFFFFF' },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'hair' }, left: { style: 'hair' },
      bottom: { style: 'hair' }, right: { style: 'hair' },
    };
  });
  row.height = 22;
}

function statusVN(status) {
  const map = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    CONFIRMED: 'Đã xác nhận',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
    RETURNED: 'Đã trả',
    COMPLETED: 'Hoàn thành',
    AVAILABLE: 'Còn hàng',
    BORROWED: 'Đang mượn',
    MAINTENANCE: 'Bảo trì',
  };
  return map[status] || status;
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

// ============================================================
// GET /api/reports/export-excel
// ============================================================
router.get('/export-excel', async (req, res) => {
  try {
    const { start, end, label } = getDateRange(req.query);
    const dateWhere = { created_at: { [Op.between]: [start, end] } };

    // Fetch data song song
    const [borrows, bookings, users, equipments] = await Promise.all([
      BorrowRequest.findAll({
        where: dateWhere,
        include: [
          { model: User, as: 'requester', attributes: ['fullName', 'email', 'employeeCode'] },
          { model: Equipment, as: 'equipment', attributes: ['name', 'code', 'imageUrl'],
            include: [{ model: EquipmentCategory, as: 'category', attributes: ['name'] }] },
        ],
        order: [['created_at', 'DESC']],
      }),
      StudioBooking.findAll({
        where: dateWhere,
        include: [
          { model: User, as: 'booker', attributes: ['fullName', 'email', 'employeeCode'] },
        ],
        order: [['created_at', 'DESC']],
      }),
      User.findAll({ order: [['created_at', 'DESC']] }),
      Equipment.findAll({
        include: [{ model: EquipmentCategory, as: 'category', attributes: ['name'] }],
        order: [['created_at', 'DESC']],
      }),
    ]);

    // Tạo Workbook
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LHU Media Studio';
    wb.created = new Date();
    wb.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];

    const TITLE_FONT = { name: 'Arial', bold: true, size: 14, color: { argb: 'FF1F3864' } };

    // ===========================
    // Sheet 1: Tổng quan
    // ===========================
    const sheetOverview = wb.addWorksheet('Tổng quan', { properties: { tabColor: { argb: 'FF1F3864' } } });
    sheetOverview.columns = [
      { key: 'metric', width: 35 },
      { key: 'value', width: 20 },
    ];

    sheetOverview.mergeCells('A1:B1');
    const titleCell = sheetOverview.getCell('A1');
    titleCell.value = `BÁO CÁO TỔNG HỢP - ${label.toUpperCase()}`;
    titleCell.font = TITLE_FONT;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    sheetOverview.getRow(1).height = 35;

    sheetOverview.mergeCells('A2:B2');
    sheetOverview.getCell('A2').value = `Xuất ngày: ${fmtDate(new Date())} | Khoảng: ${label}`;
    sheetOverview.getCell('A2').alignment = { horizontal: 'center' };
    sheetOverview.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF666666' } };
    sheetOverview.getRow(2).height = 18;

    sheetOverview.addRow([]);

    const headerRow = sheetOverview.addRow(['Chỉ số', 'Giá trị']);
    applyHeaderStyle(headerRow);

    const overviewData = [
      ['Tổng số đơn mượn thiết bị', borrows.length],
      ['Đơn mượn đang chờ duyệt', borrows.filter(b => b.status === 'PENDING').length],
      ['Đơn mượn đã duyệt', borrows.filter(b => b.status === 'APPROVED').length],
      ['Đơn mượn đã trả', borrows.filter(b => b.status === 'RETURNED').length],
      ['Đơn mượn bị từ chối', borrows.filter(b => b.status === 'REJECTED').length],
      [],
      ['Tổng số đặt phòng Studio', bookings.length],
      ['Đặt phòng chờ duyệt', bookings.filter(b => b.status === 'PENDING').length],
      ['Đặt phòng đã xác nhận', bookings.filter(b => ['CONFIRMED', 'APPROVED'].includes(b.status)).length],
      ['Đặt phòng đã hủy', bookings.filter(b => b.status === 'CANCELLED').length],
      [],
      ['Tổng số người dùng', users.length],
      ['Người dùng Admin', users.filter(u => u.role === 'ADMIN').length],
      ['Người dùng thường', users.filter(u => u.role === 'USER').length],
      [],
      ['Tổng thiết bị', equipments.length],
      ['Thiết bị còn hàng', equipments.filter(e => e.status === 'AVAILABLE').length],
      ['Thiết bị đang mượn', equipments.filter(e => e.status === 'BORROWED').length],
      ['Thiết bị bảo trì', equipments.filter(e => e.status === 'MAINTENANCE').length],
    ];

    overviewData.forEach((row, idx) => {
      if (row.length === 0) {
        sheetOverview.addRow([]);
        return;
      }
      const r = sheetOverview.addRow(row);
      applyDataStyle(r, idx % 2 === 0);
      r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).font = { bold: true, color: { argb: 'FF1F3864' } };
    });

    // ===========================
    // Sheet 2: Đơn mượn
    // ===========================
    const sheetBorrows = wb.addWorksheet('Đơn mượn thiết bị', { properties: { tabColor: { argb: 'FF2E75B6' } } });
    sheetBorrows.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Người mượn', key: 'user', width: 22 },
      { header: 'Mã NV', key: 'code', width: 12 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Thiết bị', key: 'eq', width: 25 },
      { header: 'Mã TB', key: 'eqCode', width: 12 },
      { header: 'Danh mục', key: 'cat', width: 18 },
      { header: 'SL', key: 'qty', width: 6 },
      { header: 'Ngày mượn', key: 'bDate', width: 18 },
      { header: 'Ngày trả', key: 'rDate', width: 18 },
      { header: 'Mục đích', key: 'purpose', width: 30 },
      { header: 'Trạng thái', key: 'status', width: 14 },
      { header: 'Ngày tạo', key: 'createdAt', width: 18 },
    ];

    applyHeaderStyle(sheetBorrows.getRow(1), '2E75B6');

    borrows.forEach((b, idx) => {
      const raw = b.toJSON();
      const r = sheetBorrows.addRow({
        stt: idx + 1,
        user: raw.requester?.fullName || '',
        code: raw.requester?.employeeCode || '',
        email: raw.requester?.email || '',
        eq: raw.equipment?.name || '',
        eqCode: raw.equipment?.code || '',
        cat: raw.equipment?.category?.name || '',
        qty: raw.quantity || 1,
        bDate: fmtDate(raw.borrowDate),
        rDate: fmtDate(raw.returnDate),
        purpose: raw.purpose || '',
        status: statusVN(raw.status),
        createdAt: fmtDate(raw.created_at || raw.createdAt),
      });
      applyDataStyle(r, idx % 2 !== 0);

      // Color status
      const statusCell = r.getCell('status');
      const colors = {
        'Chờ duyệt': 'FFFFC000', 'Đã duyệt': 'FF92D050',
        'Đã trả': 'FF00B0F0', 'Từ chối': 'FFFF0000', 'Đã hủy': 'FFBFBFBF',
      };
      if (colors[statusVN(raw.status)]) {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[statusVN(raw.status)] } };
        statusCell.font = { bold: true, color: { argb: 'FF000000' } };
      }
    });

    sheetBorrows.autoFilter = { from: 'A1', to: 'M1' };

    // ===========================
    // Sheet 3: Đặt phòng studio
    // ===========================
    const sheetBookings = wb.addWorksheet('Đặt phòng Studio', { properties: { tabColor: { argb: 'FF70AD47' } } });
    sheetBookings.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Người đặt', key: 'user', width: 22 },
      { header: 'Mã NV', key: 'code', width: 12 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Tên phòng', key: 'studio', width: 18 },
      { header: 'Bắt đầu', key: 'start', width: 20 },
      { header: 'Kết thúc', key: 'end', width: 20 },
      { header: 'Mục đích', key: 'purpose', width: 30 },
      { header: 'Số người', key: 'att', width: 10 },
      { header: 'Hỗ trợ KT', key: 'tech', width: 10 },
      { header: 'Trạng thái', key: 'status', width: 14 },
      { header: 'Ngày tạo', key: 'createdAt', width: 18 },
    ];

    applyHeaderStyle(sheetBookings.getRow(1), '70AD47');

    bookings.forEach((b, idx) => {
      const raw = b.toJSON();
      const r = sheetBookings.addRow({
        stt: idx + 1,
        user: raw.booker?.fullName || raw.fullName || '',
        code: raw.booker?.employeeCode || '',
        email: raw.booker?.email || '',
        studio: raw.studioName || 'Studio LHU',
        start: fmtDate(raw.startTime),
        end: fmtDate(raw.endTime),
        purpose: raw.purpose || '',
        att: raw.attendees || '',
        tech: raw.technicalSupport ? 'Có' : 'Không',
        status: statusVN(raw.status),
        createdAt: fmtDate(raw.created_at || raw.createdAt),
      });
      applyDataStyle(r, idx % 2 !== 0);
    });

    sheetBookings.autoFilter = { from: 'A1', to: 'L1' };

    // ===========================
    // Sheet 4: Danh sách thiết bị
    // ===========================
    const sheetEquip = wb.addWorksheet('Thiết bị', { properties: { tabColor: { argb: 'FFED7D31' } } });
    sheetEquip.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Tên thiết bị', key: 'name', width: 28 },
      { header: 'Mã thiết bị', key: 'code', width: 15 },
      { header: 'Danh mục', key: 'cat', width: 18 },
      { header: 'Mô tả', key: 'desc', width: 35 },
      { header: 'Số lượng', key: 'qty', width: 10 },
      { header: 'Trạng thái', key: 'status', width: 14 },
      { header: 'Ngày thêm', key: 'createdAt', width: 18 },
    ];

    applyHeaderStyle(sheetEquip.getRow(1), 'ED7D31');

    equipments.forEach((eq, idx) => {
      const raw = eq.toJSON();
      const r = sheetEquip.addRow({
        stt: idx + 1,
        name: raw.name || '',
        code: raw.code || '',
        cat: raw.category?.name || '',
        desc: raw.description || '',
        qty: raw.quantity || 1,
        status: statusVN(raw.status),
        createdAt: fmtDate(raw.created_at || raw.createdAt),
      });
      applyDataStyle(r, idx % 2 !== 0);
    });

    sheetEquip.autoFilter = { from: 'A1', to: 'H1' };

    // ===========================
    // Ghi file và trả về
    // ===========================
    const filename = `bao-cao-${label.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error.message);
    return res.status(500).json({ message: `Lỗi xuất Excel: ${error.message}` });
  }
});

module.exports = router;
