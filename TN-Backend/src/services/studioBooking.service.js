'use strict';

/**
 * @file services/studioBooking.service.js
 * @description Service xử lý Business Logic cho Đặt phòng Studio.
 */

const { Op } = require('sequelize');
const { StudioBooking, User } = require('../models');

/**
 * Lấy danh sách booking với Tìm kiếm, Lọc, Phân trang
 * @param {Object} query - { page, limit, status, studioName, startDate, endDate }
 * @param {Object} currentUser - { id, role }
 */
const findAll = async (query, currentUser) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;

  const where = {};

  // RBAC: USER chỉ xem booking của mình
  if (currentUser.role === 'USER') {
    where.userId = currentUser.id;
  }

  // Lọc theo trạng thái
  if (query.status) {
    where.status = query.status;
  }

  // Lọc theo tên phòng
  if (query.studioName) {
    where.studioName = { [Op.like]: `%${query.studioName}%` };
  }

  // Lọc theo khoảng thời gian
  if (query.startDate && query.endDate) {
    where.startTime = {
      [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
    };
  }

  const { count, rows } = await StudioBooking.findAndCountAll({
    where,
    limit,
    offset,
    order: [['start_time', 'ASC']],
    include: [
      {
        model: User,
        as: 'booker',
        attributes: ['id', 'fullName', 'email', 'employeeCode'],
      },
    ],
  });

  return {
    items: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

/**
 * Tạo booking mới (kiểm tra trùng lịch)
 * @param {Object} data
 * @param {string} userId
 */
const create = async (data, userId) => {
  // Map FE fields sang model fields
  const studioName = data.studioName || 'Studio LHU';
  const attendees = data.participants || data.attendees || 1;
  const fullName = data.fullName || null;

  // Kiểm tra trùng lịch
  const conflict = await StudioBooking.findOne({
    where: {
      studioName,
      status: 'CONFIRMED',
      [Op.or]: [
        { startTime: { [Op.between]: [new Date(data.startTime), new Date(data.endTime)] } },
        { endTime: { [Op.between]: [new Date(data.startTime), new Date(data.endTime)] } },
        {
          startTime: { [Op.lte]: new Date(data.startTime) },
          endTime: { [Op.gte]: new Date(data.endTime) },
        },
      ],
    },
  });

  if (conflict) {
    const error = new Error(
      `Phòng "${studioName}" đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.`
    );
    error.statusCode = 409;
    throw error;
  }

  const booking = await StudioBooking.create({
    studioName,
    fullName,
    purpose: data.purpose,
    startTime: data.startTime,
    endTime: data.endTime,
    attendees,
    notes: data.notes || null,
    userId,
    status: 'PENDING',
  });

  return StudioBooking.findByPk(booking.id, {
    include: [{ model: User, as: 'booker', attributes: ['id', 'fullName', 'email'] }],
  });
};

/**
 * [ADMIN] Xác nhận hoặc huỷ booking
 * @param {string} bookingId
 * @param {string} action - 'confirm' | 'cancel'
 * @param {string} [cancelReason]
 */
const processBooking = async (bookingId, action, cancelReason = null) => {
  const booking = await StudioBooking.findByPk(bookingId);

  if (!booking) {
    const error = new Error('Booking không tồn tại.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.status !== 'PENDING') {
    const error = new Error(`Booking đã ở trạng thái "${booking.status}", không thể xử lý lại.`);
    error.statusCode = 400;
    throw error;
  }

  if (action === 'confirm') {
    await booking.update({ status: 'CONFIRMED' });
  } else if (action === 'cancel') {
    await booking.update({ status: 'CANCELLED', cancelReason });
  } else {
    const error = new Error('Action không hợp lệ. Chỉ chấp nhận "confirm" hoặc "cancel".');
    error.statusCode = 400;
    throw error;
  }

  return booking;
};

/**
 * Người dùng tự huỷ booking của mình
 * @param {string} bookingId
 * @param {string} userId
 */
const cancelByUser = async (bookingId, userId) => {
  const booking = await StudioBooking.findByPk(bookingId);

  if (!booking) {
    const error = new Error('Booking không tồn tại.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.userId !== userId) {
    const error = new Error('Bạn không có quyền huỷ booking này.');
    error.statusCode = 403;
    throw error;
  }

  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    const error = new Error('Không thể huỷ booking đã hoàn thành hoặc đã huỷ.');
    error.statusCode = 400;
    throw error;
  }

  await booking.update({ status: 'CANCELLED', cancelReason: 'Người dùng tự huỷ' });
  return booking;
};

module.exports = { findAll, create, processBooking, cancelByUser };
