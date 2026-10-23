'use strict';

/**
 * @file models/index.js
 * @description File trung tâm: Import tất cả models, định nghĩa ASSOCIATIONS (quan hệ),
 *              và đồng bộ với database (sync).
 *
 * ========================================
 * TẠI SAO CẦN FILE NÀY?
 * ========================================
 * 1. Tập trung định nghĩa quan hệ (associations) ở một chỗ.
 * 2. Tránh circular dependency (model A import model B và ngược lại).
 * 3. Là nơi duy nhất gọi sequelize.sync() để tạo/cập nhật bảng.
 *
 * ========================================
 * CÁC LOẠI ASSOCIATIONS (QUAN HỆ) TRONG SEQUELIZE
 * ========================================
 *
 * Quan hệ 1-N (hasMany / belongsTo):
 *   A.hasMany(B)      -> A là phía "1", thêm cột foreign key vào bảng B
 *   B.belongsTo(A)    -> B là phía "N", khai báo B sở hữu khóa ngoại của A
 *   => Khai báo CẢ HAI để có đầy đủ chức năng include/join
 *
 * Quan hệ N-N (belongsToMany):
 *   A.belongsToMany(B, { through: 'JunctionTable' })
 *   B.belongsToMany(A, { through: 'JunctionTable' })
 *
 * Quan hệ 1-1 (hasOne / belongsTo):
 *   A.hasOne(B)
 *   B.belongsTo(A)
 *
 * ========================================
 * FOREIGN KEY NAMING CONVENTION:
 * ========================================
 *   foreignKey: 'user_id'       -> Tên cột FK trong bảng con
 *   as: 'creator'               -> Alias khi dùng include (eager loading)
 */

const { sequelize } = require('../config/database');
const User = require('./User');
const EquipmentCategory = require('./EquipmentCategory');
const Equipment = require('./Equipment');
const BorrowRequest = require('./BorrowRequest');
const StudioBooking = require('./StudioBooking');

// ============================================================
// ĐỊNH NGHĨA ASSOCIATIONS (QUAN HỆ GIỮA CÁC BẢNG)
// ============================================================

/**
 * QUAN HỆ 1: EquipmentCategory (1) --- (N) Equipment
 * Một danh mục có nhiều thiết bị.
 * Một thiết bị chỉ thuộc một danh mục.
 */
EquipmentCategory.hasMany(Equipment, {
  foreignKey: 'category_id', // Tên cột FK trong bảng Equipments
  as: 'equipments',           // Alias cho eager loading: include: [{ model: Equipment, as: 'equipments' }]
  onDelete: 'RESTRICT',       // Không cho xóa category nếu còn equipment
});

Equipment.belongsTo(EquipmentCategory, {
  foreignKey: 'category_id',
  as: 'category',  // Alias: Equipment.findOne({ include: [{ model: Category, as: 'category' }] })
});

/**
 * QUAN HỆ 2: User (1) --- (N) BorrowRequest
 * Một user có thể tạo nhiều đơn mượn.
 * Một đơn mượn chỉ thuộc về một user.
 */
User.hasMany(BorrowRequest, {
  foreignKey: 'user_id',
  as: 'borrowRequests',
  onDelete: 'CASCADE', // Xóa user -> xóa luôn toàn bộ đơn mượn của họ
});

BorrowRequest.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'requester', // Alias: BorrowRequest.findAll({ include: [{ model: User, as: 'requester' }] })
});

/**
 * QUAN HỆ 3: Equipment (1) --- (N) BorrowRequest
 * Một thiết bị có thể xuất hiện trong nhiều đơn mượn (qua các thời điểm khác nhau).
 * Một đơn mượn chỉ mượn một loại thiết bị.
 */
Equipment.hasMany(BorrowRequest, {
  foreignKey: 'equipment_id',
  as: 'borrowRequests',
  onDelete: 'RESTRICT',
});

BorrowRequest.belongsTo(Equipment, {
  foreignKey: 'equipment_id',
  as: 'equipment', // Alias khi join để lấy thông tin thiết bị
});

/**
 * QUAN HỆ 4: User (1) --- (N) StudioBooking
 * Một user có thể đặt phòng nhiều lần.
 * Một booking chỉ thuộc về một user.
 */
User.hasMany(StudioBooking, {
  foreignKey: 'user_id',
  as: 'studioBookings',
  onDelete: 'CASCADE',
});

StudioBooking.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'booker',
});

// ============================================================
// ĐỒNG BỘ DATABASE (DATABASE SYNC)
// ============================================================
/**
 * sequelize.sync(options):
 *   { force: false }  -> Chỉ tạo bảng nếu chưa có (KHÔNG XÓA DỮ LIỆU CŨ) - dùng khi production
 *   { alter: true }   -> Tự động ALTER TABLE để khớp với Model - dùng khi development
 *   { force: true }   -> DROP rồi CREATE lại - NGUY HIỂM, chỉ dùng khi seed data
 *
 * !!! CẢNH BÁO: Không dùng force:true trên production vì sẽ mất toàn bộ dữ liệu !!!
 */
const syncDatabase = async () => {
  try {
    /**
     * MSSQL sử dụng { alter: false } — chỉ CREATE bảng nếu chưa có.
     * alter:true trên MSSQL sinh cú pháp ALTER TABLE không hợp lệ.
     * Khi thêm cột mới: tự DROP bảng trong SSMS rồi restart server.
     */
    await sequelize.sync({ force: false });
    console.log('✅ Database đã được đồng bộ thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ database:', error.message);
    throw error;
  }
};

// Export tất cả để dùng ở nơi khác
module.exports = {
  sequelize,
  syncDatabase,
  User,
  EquipmentCategory,
  Equipment,
  BorrowRequest,
  StudioBooking,
};
