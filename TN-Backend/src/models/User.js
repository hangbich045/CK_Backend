'use strict';

/**
 * @file models/User.js
 * @description Model Sequelize cho bảng Users.
 *
 * Sequelize Model là lớp trung gian giữa code JS và bảng trong database.
 * Mỗi Model tương ứng 1 bảng, mỗi instance tương ứng 1 hàng (row).
 *
 * Cú pháp định nghĩa:
 *   sequelize.define('ModelName', { attributes }, { options })
 *
 * DataTypes: Kiểu dữ liệu Sequelize ánh xạ sang SQL Server:
 *   STRING(n) -> NVARCHAR(n)
 *   TEXT       -> NVARCHAR(MAX)
 *   BOOLEAN    -> BIT
 *   DATE       -> DATETIMEOFFSET
 *   ENUM       -> NVARCHAR + CHECK CONSTRAINT
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',       // Tên Model (Sequelize tự plural -> bảng 'Users')
  {
    // PRIMARY KEY - UUID tự sinh (không dùng int để tránh lộ số lượng user)
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Tự động tạo UUID v4
      primaryKey: true,
      comment: 'Khóa chính UUID tự sinh',
    },

    // Họ tên đầy đủ
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'full_name', // Tên cột trong DB (snake_case)
      validate: {
        notEmpty: { msg: 'Họ tên không được để trống' },
        len: { args: [2, 100], msg: 'Họ tên phải từ 2 đến 100 ký tự' },
      },
    },

    // Email - dùng làm username đăng nhập
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        isEmail: { msg: 'Email không hợp lệ' },
        notEmpty: { msg: 'Email không được để trống' },
      },
    },

    // Mật khẩu đã được hash bằng bcryptjs (KHÔNG lưu plaintext)
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Mật khẩu không được để trống' },
      },
    },

    // Mã nhân viên - định danh nội bộ
    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'employee_code',
    },

    // Số điện thoại
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: { args: /^[0-9+\-\s()]*$/, msg: 'Số điện thoại không hợp lệ' },
      },
    },

    // URL ảnh đại diện
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url',
    },

    /**
     * Phân quyền (Role-Based Access Control - RBAC)
     * ADMIN: Quản trị viên - toàn quyền
     * USER:  Người dùng thường - hạn chế
     *
     * Dùng STRING thay vì ENUM vì MSSQL xử lý ENUM khác MySQL/Postgres
     */
    role: {
      type: DataTypes.STRING(10),
      defaultValue: 'USER',
      allowNull: false,
      validate: {
        isIn: { args: [['ADMIN', 'USER']], msg: 'Role phải là ADMIN hoặc USER' },
      },
    },

    // Trạng thái tài khoản (true = đã kích hoạt)
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },

    // Xác thực email (true = đã xác thực OTP)
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_verified',
    },

    // OTP code (6 số) — dùng cho verify email và reset password
    otpCode: {
      type: DataTypes.STRING(6),
      allowNull: true,
      field: 'otp_code',
    },

    // Thời điểm hết hạn OTP
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'otp_expiry',
    },
  },
  {
    // ===== OPTIONS =====
    tableName: 'Users',      // Tên bảng trong database
    timestamps: true,        // Tự động thêm createdAt, updatedAt
    underscored: true,       // Chuyển camelCase -> snake_case cho timestamp cols
    paranoid: false,         // false = xóa thật (true = soft delete, thêm deletedAt)
  }
);

module.exports = User;
