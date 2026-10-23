'use strict';

/**
 * @file models/BorrowRequest.js
 * @description Model cho bảng BorrowRequests (Đơn mượn thiết bị).
 *
 * Quan hệ N-N thông qua bảng trung gian BorrowRequestItems (nếu cần mượn nhiều loại)
 * Ở đây ta dùng quan hệ 1-N đơn giản: 1 đơn mượn -> 1 loại thiết bị.
 *
 * Quan hệ:
 *   User (1) --- (N) BorrowRequest    : Người dùng tạo đơn mượn
 *   Equipment (1) --- (N) BorrowRequest : Thiết bị được mượn
 *
 * Vòng đời (Workflow) của đơn mượn:
 *   PENDING -> APPROVED -> RETURNED
 *             -> REJECTED
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BorrowRequest = sequelize.define(
  'BorrowRequest',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // FOREIGN KEY: Người tạo đơn mượn
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE', // Xóa user -> xóa luôn đơn mượn
    },

    // FOREIGN KEY: Thiết bị được mượn
    equipmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'equipment_id',
      references: { model: 'Equipments', key: 'id' },
      onDelete: 'RESTRICT', // Không cho xóa equipment nếu có đơn mượn
    },

    // Số lượng muốn mượn
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Số lượng mượn phải ít nhất là 1' },
      },
    },

    // Mục đích mượn
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Mục đích mượn không được để trống' },
      },
    },

    // Ngày muốn bắt đầu mượn
    borrowDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'borrow_date',
      validate: {
        isDate: { msg: 'Ngày mượn không hợp lệ' },
      },
    },

    // Ngày dự kiến trả
    returnDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'return_date',
      validate: {
        isDate: { msg: 'Ngày trả không hợp lệ' },
        isAfterBorrowDate(value) {
          if (new Date(value) <= new Date(this.borrowDate)) {
            throw new Error('Ngày trả phải sau ngày mượn');
          }
        },
      },
    },

    // Ngày trả thực tế (null nếu chưa trả)
    actualReturnDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'actual_return_date',
    },

    /**
     * Trạng thái đơn mượn (Workflow) - STRING cho MSSQL
     */
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      allowNull: false,
      validate: {
        isIn: { args: [['PENDING', 'APPROVED', 'REJECTED', 'RETURNED']], msg: 'Trạng thái không hợp lệ' },
      },
    },

    // Lý do từ chối (chỉ điền khi status = REJECTED)
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },

    // Ghi chú của người mượn
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'BorrowRequests',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['equipment_id'] },
      { fields: ['status'] },
      { fields: ['borrow_date'] },
    ],
  }
);

module.exports = BorrowRequest;
