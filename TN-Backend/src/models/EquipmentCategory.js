'use strict';

/**
 * @file models/EquipmentCategory.js
 * @description Model cho bảng EquipmentCategories (Danh mục thiết bị).
 *
 * Quan hệ: EquipmentCategory (1) --- (N) Equipment
 * -> Một danh mục có nhiều thiết bị.
 * -> Một thiết bị chỉ thuộc một danh mục.
 *
 * Đây là ví dụ điển hình về quan hệ 1-N trong Sequelize:
 *   EquipmentCategory.hasMany(Equipment)     -> Phía "1"
 *   Equipment.belongsTo(EquipmentCategory)   -> Phía "N"
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EquipmentCategory = sequelize.define(
  'EquipmentCategory',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true, // SQL Server: IDENTITY(1,1)
      primaryKey: true,
    },

    // Tên danh mục (ví dụ: "Máy ảnh", "Đèn chiếu sáng", "Chân máy")
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: 'Tên danh mục đã tồn tại' },
      validate: {
        notEmpty: { msg: 'Tên danh mục không được để trống' },
        len: { args: [2, 100], msg: 'Tên danh mục phải từ 2 đến 100 ký tự' },
      },
    },

    // Mô tả danh mục
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'EquipmentCategories',
    timestamps: true,
    underscored: true,
  }
);

module.exports = EquipmentCategory;
