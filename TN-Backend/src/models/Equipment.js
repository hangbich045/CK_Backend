'use strict';

/**
 * @file models/Equipment.js
 * @description Model cho bảng Equipments (Thiết bị).
 *
 * Quan hệ với EquipmentCategory: N-1 (N thiết bị thuộc 1 danh mục)
 * Quan hệ với BorrowRequest: 1-N (1 thiết bị có nhiều đơn mượn)
 *
 * Trạng thái thiết bị (status):
 *   AVAILABLE   -> Sẵn sàng cho mượn
 *   BORROWED    -> Đang được mượn (tự động đổi khi duyệt đơn)
 *   MAINTENANCE -> Đang bảo trì
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define(
  'Equipment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Mã thiết bị - mã nội bộ duy nhất (ví dụ: "CAM-001", "LIGHT-005")
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: { msg: 'Mã thiết bị đã tồn tại' },
      validate: {
        notEmpty: { msg: 'Mã thiết bị không được để trống' },
      },
    },

    // Tên thiết bị
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Tên thiết bị không được để trống' },
        len: { args: [2, 200], msg: 'Tên thiết bị phải từ 2 đến 200 ký tự' },
      },
    },

    // Mô tả chi tiết
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // FOREIGN KEY: Khóa ngoại tham chiếu đến EquipmentCategory
    // Sequelize sẽ tự tạo constraint FOREIGN KEY trong DB
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
      references: {
        model: 'EquipmentCategories',
        key: 'id',
      },
      onDelete: 'RESTRICT', // Không cho xóa category nếu có equipment
      onUpdate: 'CASCADE',
    },

    // Tổng số lượng thiết bị
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Số lượng phải ít nhất là 1' },
        isInt: { msg: 'Số lượng phải là số nguyên' },
      },
    },

    // Số lượng còn có thể mượn (= quantity - đang_mượn)
    availableQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'available_quantity',
      validate: {
        min: { args: [0], msg: 'Số lượng khả dụng không thể âm' },
      },
    },

    /**
     * Trạng thái thiết bị
     * Dùng STRING thay vì ENUM cho MSSQL compatibility
     */
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'AVAILABLE',
      allowNull: false,
      validate: {
        isIn: { args: [['AVAILABLE', 'BORROWED', 'MAINTENANCE']], msg: 'Trạng thái không hợp lệ' },
      },
    },

    // URL hình ảnh thiết bị
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url',
    },

    // Vị trí lưu trữ thiết bị
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    tableName: 'Equipments',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['category_id'] },
      { fields: ['status'] },
      { fields: ['name'] }, // Index để tìm kiếm theo tên nhanh hơn
    ],
  }
);

module.exports = Equipment;
