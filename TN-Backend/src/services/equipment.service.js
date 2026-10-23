'use strict';

/**
 * @file services/equipment.service.js
 * @description Service xử lý Business Logic cho quản lý Thiết bị.
 *
 * ========================================
 * CÁC KỸ THUẬT SEQUELIZE ĐƯỢC DÙNG:
 * ========================================
 *
 * 1. findAndCountAll({ where, limit, offset, include, order }):
 *    -> Lấy danh sách + đếm tổng số trong 1 query (dùng cho pagination)
 *
 * 2. Op (Operators): Toán tử của Sequelize ánh xạ sang SQL:
 *    Op.like    -> LIKE '%...%'   (tìm kiếm gần đúng, mssql case-insensitive)
 *    Op.or      -> OR             (tìm theo nhiều điều kiện)
 *    Op.and     -> AND
 *    Op.in      -> IN (...)
 *    Op.gte     -> >= (greater than or equal)
 *    Op.lte     -> <=
 *
 * 3. include (Eager Loading):
 *    -> JOIN với bảng liên quan, lấy data kèm theo
 *    -> Ví dụ: lấy equipment kèm thông tin category
 *
 * 4. order: [[column, direction]]:
 *    -> Sắp xếp kết quả
 *    -> Ví dụ: order: [['created_at', 'DESC']]
 *
 * 5. Pagination (Phân trang):
 *    -> limit: Số item mỗi trang
 *    -> offset: Số item bỏ qua = (page - 1) * limit
 *    -> totalPages: Math.ceil(total / limit)
 */

const { Op } = require('sequelize');
const { Equipment, EquipmentCategory } = require('../models');

/**
 * Lấy danh sách thiết bị với Tìm kiếm, Lọc và Phân trang
 *
 * @param {Object} query - Query parameters từ request
 * @param {string}  [query.search]   - Từ khóa tìm kiếm (tên/mã thiết bị)
 * @param {number}  [query.categoryId] - Lọc theo danh mục
 * @param {string}  [query.status]   - Lọc theo trạng thái (AVAILABLE/BORROWED/MAINTENANCE)
 * @param {number}  [query.page=1]   - Trang hiện tại
 * @param {number}  [query.limit=10] - Số item mỗi trang
 * @returns {Object} { items, total, page, limit, totalPages }
 */
const findAll = async (query) => {
  // ============================================================
  // BƯỚC 1: XỬ LÝ THAM SỐ PHÂN TRANG (PAGINATION)
  // ============================================================
  const page = parseInt(query.page) || 1;    // Mặc định trang 1
  const limit = parseInt(query.limit) || 10; // Mặc định 10 item/trang
  const offset = (page - 1) * limit;          // Bỏ qua bao nhiêu item

  // ============================================================
  // BƯỚC 2: XÂY DỰNG ĐIỀU KIỆN WHERE (DYNAMIC QUERY)
  // ============================================================
  // Điều kiện where được build động dựa trên query params
  // Nếu không có param thì where = {} (lấy tất cả)
  const where = {};

  // Tìm kiếm (Search): So khớp gần đúng theo tên HOẶC mã thiết bị
  // Op.like = SQL LIKE (case-insensitive trên MSSQL mặc định)
  if (query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { code: { [Op.like]: `%${query.search}%` } },
    ];
  }

  // Lọc theo danh mục (Filter by Category)
  if (query.categoryId) {
    where.categoryId = parseInt(query.categoryId);
  }

  // Lọc theo trạng thái (Filter by Status)
  if (query.status) {
    where.status = query.status; // Khớp chính xác (AVAILABLE/BORROWED/MAINTENANCE)
  }

  // ============================================================
  // BƯỚC 3: TRUY VẤN VỚI SEQUELIZE findAndCountAll
  // ============================================================
  /**
   * findAndCountAll trả về { count, rows }:
   * - count: Tổng số records khớp với điều kiện WHERE (dùng tính totalPages)
   * - rows: Mảng records của trang hiện tại (sau khi áp dụng limit, offset)
   *
   * Tương đương SQL:
   *   SELECT e.*, c.name as category_name
   *   FROM Equipments e
   *   LEFT JOIN EquipmentCategories c ON e.category_id = c.id
   *   WHERE e.name LIKE '%search%' AND e.status = 'AVAILABLE'
   *   ORDER BY e.created_at DESC
   *   OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;
   *   -- (và 1 query COUNT(*) riêng)
   */
  const { count, rows } = await Equipment.findAndCountAll({
    where,
    limit,   // FETCH NEXT {limit} ROWS
    offset,  // OFFSET {offset} ROWS
    order: [['created_at', 'DESC']], // Mới nhất lên đầu

    // Eager Loading: JOIN bảng EquipmentCategory để lấy thông tin danh mục
    include: [
      {
        model: EquipmentCategory,
        as: 'category',         // Alias định nghĩa trong associations
        attributes: ['id', 'name'], // Chỉ lấy id và name của category
      },
    ],
  });

  // ============================================================
  // BƯỚC 4: TRẢ VỀ KẾT QUẢ VỚI METADATA PHÂN TRANG
  // ============================================================
  return {
    items: rows,           // Danh sách thiết bị trang hiện tại
    total: count,          // Tổng số thiết bị (theo filter)
    page,                  // Trang hiện tại
    limit,                 // Số item mỗi trang
    totalPages: Math.ceil(count / limit), // Tổng số trang
  };
};

/**
 * Lấy chi tiết một thiết bị theo ID
 * @param {string} id - UUID của thiết bị
 * @throws {Error} 404 nếu không tìm thấy
 */
const findById = async (id) => {
  const equipment = await Equipment.findByPk(id, {
    include: [{ model: EquipmentCategory, as: 'category', attributes: ['id', 'name'] }],
  });

  if (!equipment) {
    const error = new Error('Không tìm thấy thiết bị.');
    error.statusCode = 404;
    throw error;
  }

  return equipment;
};

/**
 * Tạo thiết bị mới
 * @param {Object} data - Dữ liệu thiết bị từ request body
 */
const create = async (data) => {
  // Kiểm tra danh mục tồn tại
  const category = await EquipmentCategory.findByPk(data.categoryId);
  if (!category) {
    const error = new Error(`Danh mục ID ${data.categoryId} không tồn tại.`);
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra mã thiết bị trùng lặp
  const existing = await Equipment.findOne({ where: { code: data.code } });
  if (existing) {
    const error = new Error(`Mã thiết bị '${data.code}' đã tồn tại.`);
    error.statusCode = 409;
    throw error;
  }

  // Không cho phép tạo với status BORROWED (chỉ tự động khi duyệt đơn)
  if (data.status === 'BORROWED') {
    const error = new Error('Không thể tạo thiết bị với trạng thái "Đang mượn".');
    error.statusCode = 400;
    throw error;
  }

  // Tạo mới: availableQuantity ban đầu = quantity
  const equipment = await Equipment.create({
    ...data,
    availableQuantity: data.quantity, // Ban đầu tất cả đều khả dụng
    status: data.status || 'AVAILABLE',
  });

  return findById(equipment.id); // Trả về kèm thông tin category
};

/**
 * Cập nhật thiết bị
 * @param {string} id
 * @param {Object} data
 */
const update = async (id, data) => {
  const equipment = await findById(id);

  // Không cho phép đổi status thành BORROWED thủ công
  if (data.status === 'BORROWED' && equipment.status !== 'BORROWED') {
    const error = new Error('Trạng thái "Đang mượn" chỉ được cập nhật tự động qua luồng duyệt đơn.');
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra mã trùng nếu thay đổi code
  if (data.code && data.code !== equipment.code) {
    const existing = await Equipment.findOne({ where: { code: data.code } });
    if (existing) {
      const error = new Error(`Mã thiết bị '${data.code}' đã tồn tại.`);
      error.statusCode = 409;
      throw error;
    }
  }

  // Cập nhật availableQuantity khi thay đổi quantity
  const updateData = { ...data };
  if (data.quantity !== undefined) {
    const diff = data.quantity - equipment.quantity;
    const newAvailable = equipment.availableQuantity + diff;
    if (newAvailable < 0) {
      const error = new Error('Số lượng mới không thể nhỏ hơn số lượng đang cho mượn.');
      error.statusCode = 400;
      throw error;
    }
    updateData.availableQuantity = newAvailable;
  }

  await equipment.update(updateData);
  return findById(id);
};

/**
 * Xóa thiết bị
 * @param {string} id
 */
const remove = async (id) => {
  const equipment = await findById(id);

  if (equipment.availableQuantity < equipment.quantity) {
    const error = new Error('Không thể xóa thiết bị đang được cho mượn.');
    error.statusCode = 400;
    throw error;
  }

  await equipment.destroy();
  return { message: 'Xóa thiết bị thành công.' };
};

module.exports = { findAll, findById, create, update, remove };
