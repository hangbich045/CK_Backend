'use strict';

/**
 * @file test/unit.test.js
 * @description Bộ Unit Test kiểm tra các logic nghiệp vụ quan trọng trong hệ thống:
 *   1. Hash và kiểm tra mật khẩu (bcryptjs)
 *   2. Tạo và xác minh JWT Token (jsonwebtoken)
 *   3. Phân quyền người dùng RBAC (Role-Based Access Control)
 *   4. Thuật toán kiểm tra trùng lịch đặt phòng Studio (Time overlap check)
 *   5. Tính toán phân trang và giới hạn bản ghi (Pagination logic)
 *   6. Logic kiểm tra số lượng thiết bị khả dụng khi mượn (Inventory availability)
 *
 * Chạy test bằng lệnh:
 *   node --test test/unit.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================================================
// TEST SUITE 1: BẢO MẬT MẬT KHẨU (BCRYPT)
// ============================================================
describe('Unit Test 1: Bảo mật và mã hóa mật khẩu (bcryptjs)', () => {
  const plainPassword = 'User@123456';

  it('1.1. Mật khẩu hash phải khác mật khẩu gốc và có tiền tố $2a$ hoặc $2b$', async () => {
    const saltRounds = 10;
    const hash = await bcrypt.hash(plainPassword, saltRounds);

    assert.notEqual(hash, plainPassword);
    assert.match(hash, /^\$2[ab]\$10\$/);
  });

  it('1.2. Xác thực thành công khi nhập đúng mật khẩu gốc', async () => {
    const hash = await bcrypt.hash(plainPassword, 10);
    const isMatch = await bcrypt.compare(plainPassword, hash);
    assert.equal(isMatch, true);
  });

  it('1.3. Từ chối xác thực khi nhập sai mật khẩu', async () => {
    const hash = await bcrypt.hash(plainPassword, 10);
    const isMatch = await bcrypt.compare('WrongPassword!@#', hash);
    assert.equal(isMatch, false);
  });
});

// ============================================================
// TEST SUITE 2: XÁC THỰC JSON WEB TOKEN (JWT)
// ============================================================
describe('Unit Test 2: Tạo và giải mã JWT Token (jsonwebtoken)', () => {
  const secretKey = 'super_secret_jwt_key_for_testing';
  const userPayload = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'sinhvien@lhu.edu.vn',
    role: 'USER',
  };

  it('2.1. Ký token thành công và trích xuất đúng payload { id, email, role }', () => {
    const token = jwt.sign(userPayload, secretKey, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secretKey);

    assert.equal(decoded.id, userPayload.id);
    assert.equal(decoded.email, userPayload.email);
    assert.equal(decoded.role, userPayload.role);
  });

  it('2.2. Từ chối token khi bị giả mạo secret key (JsonWebTokenError)', () => {
    const token = jwt.sign(userPayload, secretKey, { expiresIn: '1h' });
    assert.throws(
      () => {
        jwt.verify(token, 'wrong_tampered_secret_key');
      },
      (err) => err.name === 'JsonWebTokenError'
    );
  });

  it('2.3. Từ chối token đã hết hạn (TokenExpiredError)', () => {
    const expiredToken = jwt.sign(userPayload, secretKey, { expiresIn: '0s' });
    assert.throws(
      () => {
        jwt.verify(expiredToken, secretKey);
      },
      (err) => err.name === 'TokenExpiredError'
    );
  });
});

// ============================================================
// TEST SUITE 3: PHÂN QUYỀN RBAC (AUTHORIZE MIDDLEWARE)
// ============================================================
describe('Unit Test 3: Phân quyền RBAC (authorize middleware logic)', () => {
  // Giả lập authorize higher-order function
  const authorize = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Chưa đăng nhập' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Không đủ quyền' });
      }
      next();
    };
  };

  it('3.1. ADMIN truy cập endpoint yêu cầu quyền ADMIN -> Cho phép (next() được gọi)', () => {
    const req = { user: { id: 'admin-1', role: 'ADMIN' } };
    let calledNext = false;
    const res = { status: () => res, json: () => {} };

    authorize('ADMIN')(req, res, () => {
      calledNext = true;
    });

    assert.equal(calledNext, true);
  });

  it('3.2. USER truy cập endpoint yêu cầu quyền ADMIN -> Chặn 403 Forbidden', () => {
    const req = { user: { id: 'user-1', role: 'USER' } };
    let responseStatus = null;
    let responseBody = null;
    let calledNext = false;

    const res = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (data) => {
            responseBody = data;
          },
        };
      },
    };

    authorize('ADMIN')(req, res, () => {
      calledNext = true;
    });

    assert.equal(calledNext, false);
    assert.equal(responseStatus, 403);
    assert.match(responseBody.message, /Không đủ quyền/);
  });
});

// ============================================================
// TEST SUITE 4: THUẬT TOÁN XUNG ĐỘT THỜI GIAN ĐẶT PHÒNG STUDIO
// ============================================================
describe('Unit Test 4: Thuật toán kiểm tra trùng lịch Studio (Overlap Check)', () => {
  /**
   * Hai khoảng thời gian [A_start, A_end] và [B_start, B_end] trùng nhau khi:
   * (A_start < B_end) && (A_end > B_start)
   */
  const hasTimeConflict = (startA, endA, startB, endB) => {
    return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
  };

  it('4.1. Phát hiện trùng lịch khi ca mới nằm hoàn toàn bên trong ca đã đặt', () => {
    const existing = { start: '2026-10-25T08:00:00Z', end: '2026-10-25T11:00:00Z' };
    const newBooking = { start: '2026-10-25T09:00:00Z', end: '2026-10-25T10:00:00Z' };

    assert.equal(hasTimeConflict(existing.start, existing.end, newBooking.start, newBooking.end), true);
  });

  it('4.2. Phát hiện trùng lịch khi ca mới bắt đầu trước và kết thúc giữa ca đã đặt', () => {
    const existing = { start: '2026-10-25T09:00:00Z', end: '2026-10-25T12:00:00Z' };
    const newBooking = { start: '2026-10-25T08:00:00Z', end: '2026-10-25T10:00:00Z' };

    assert.equal(hasTimeConflict(existing.start, existing.end, newBooking.start, newBooking.end), true);
  });

  it('4.3. Không trùng lịch khi hai ca thời gian liền kề (ca sau bắt đầu ngay khi ca trước kết thúc)', () => {
    const existing = { start: '2026-10-25T08:00:00Z', end: '2026-10-25T10:00:00Z' };
    const newBooking = { start: '2026-10-25T10:00:00Z', end: '2026-10-25T12:00:00Z' };

    assert.equal(hasTimeConflict(existing.start, existing.end, newBooking.start, newBooking.end), false);
  });
});

// ============================================================
// TEST SUITE 5: PHÂN TRANG VÀ TOÁN TỬ OFFSET
// ============================================================
describe('Unit Test 5: Logic tính toán phân trang (Pagination Math)', () => {
  const paginate = (page = 1, limit = 10, total = 0) => {
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (currentPage - 1) * pageLimit;
    const totalPages = Math.ceil(total / pageLimit);

    return { page: currentPage, limit: pageLimit, offset, totalPages };
  };

  it('5.1. Trang 1 với limit 10: offset phải bằng 0', () => {
    const result = paginate(1, 10, 24);
    assert.equal(result.offset, 0);
    assert.equal(result.totalPages, 3);
  });

  it('5.2. Trang 3 với limit 10: offset phải bằng 20', () => {
    const result = paginate(3, 10, 24);
    assert.equal(result.offset, 20);
    assert.equal(result.totalPages, 3);
  });

  it('5.3. Xử lý an toàn khi truyền page âm hoặc chuỗi rác', () => {
    const result = paginate(-5, 10, 24);
    assert.equal(result.page, 1);
    assert.equal(result.offset, 0);
  });
});

// ============================================================
// TEST SUITE 6: LOGIC QUẢN LÝ TỒN KHO THIẾT BỊ KHI MƯỢN/TRẢ
// ============================================================
describe('Unit Test 6: Kiểm tra tính hợp lệ số lượng tồn kho thiết bị', () => {
  const canBorrow = (availableQuantity, requestedQuantity) => {
    if (requestedQuantity <= 0) return { ok: false, message: 'Số lượng phải lớn hơn 0' };
    if (availableQuantity < requestedQuantity) return { ok: false, message: 'Số lượng khả dụng không đủ' };
    return { ok: true, newAvailable: availableQuantity - requestedQuantity };
  };

  it('6.1. Cho phép mượn khi số lượng yêu cầu nhỏ hơn hoặc bằng số lượng khả dụng', () => {
    const res = canBorrow(5, 3);
    assert.equal(res.ok, true);
    assert.equal(res.newAvailable, 2);
  });

  it('6.2. Từ chối khi mượn vượt quá số lượng khả dụng trong kho', () => {
    const res = canBorrow(2, 5);
    assert.equal(res.ok, false);
    assert.match(res.message, /không đủ/);
  });

  it('6.3. Từ chối khi số lượng yêu cầu là số âm hoặc bằng 0', () => {
    const res = canBorrow(5, 0);
    assert.equal(res.ok, false);
    assert.match(res.message, /lớn hơn 0/);
  });
});
