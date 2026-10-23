'use strict';

/**
 * @file models/StudioBooking.js
 * @description Model cho bảng StudioBookings (Đặt phòng studio).
 *
 * Quan hệ:
 *   User (1) --- (N) StudioBooking : Một user có nhiều booking
 *   Đây là quan hệ 1-N thứ hai trong hệ thống.
 *
 * Vòng đời booking:
 *   PENDING -> CONFIRMED -> COMPLETED
 *           -> CANCELLED
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudioBooking = sequelize.define(
  'StudioBooking',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // FOREIGN KEY: Người đặt phòng
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    },

    // Tên phòng studio
    studioName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Studio LHU',
      field: 'studio_name',
      validate: {
        notEmpty: { msg: 'Tên phòng studio không được để trống' },
      },
    },

    // Tên người đặt (FE gửi, lưu để hiển thị không cần join)
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'full_name',
    },
    // Mục đích sử dụng
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Mục đích không được để trống' },
      },
    },

    // Thời gian bắt đầu
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
      validate: {
        isDate: { msg: 'Thời gian bắt đầu không hợp lệ' },
      },
    },

    // Thời gian kết thúc
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
      validate: {
        isDate: { msg: 'Thời gian kết thúc không hợp lệ' },
        isAfterStartTime(value) {
          if (new Date(value) <= new Date(this.startTime)) {
            throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
          }
        },
      },
    },

    // Số người sử dụng
    attendees: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Số người phải ít nhất là 1' },
      },
    },

    /**
     * Trạng thái đặt phòng - STRING cho MSSQL
     */
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      allowNull: false,
      validate: {
        isIn: { args: [['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']], msg: 'Trạng thái không hợp lệ' },
      },
    },

    // Lý do huỷ
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cancel_reason',
    },

    // Ghi chú thêm
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'StudioBookings',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['start_time'] },
      { fields: ['studio_name'] },
    ],
  }
);

module.exports = StudioBooking;
