'use strict';

/**
 * @file config/mailer.js
 * @description Cấu hình Nodemailer để gửi email OTP qua Gmail SMTP.
 *
 * Biến môi trường cần có:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Lưu ý: Gmail cần bật "App Password" thay vì mật khẩu thường.
 * Hướng dẫn: https://support.google.com/accounts/answer/185833
 */

const nodemailer = require('nodemailer');

// Tạo transporter một lần, tái sử dụng
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // false = STARTTLS (port 587), true = SSL (port 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Cho phép self-signed cert (dev)
  },
});

/**
 * Gửi email OTP xác thực
 * @param {string} to - Email người nhận
 * @param {string} otp - Mã OTP 6 số
 * @param {string} type - 'verify' | 'reset'
 */
async function sendOTPEmail(to, otp, type = 'verify') {
  const isVerify = type === 'verify';
  const subject = isVerify
    ? '🔐 Xác thực tài khoản LHU Media Studio'
    : '🔑 Đặt lại mật khẩu LHU Media Studio';

  const title = isVerify ? 'Xác thực tài khoản' : 'Đặt lại mật khẩu';
  const desc = isVerify
    ? 'Cảm ơn bạn đã đăng ký. Nhập mã OTP bên dưới để xác thực tài khoản:'
    : 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu. Nhập mã OTP bên dưới:';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#13131a;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2540,#284F9E);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                🎬 LHU Media Studio
              </h1>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;">${title}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="color:#c8cad0;font-size:15px;margin:0 0 24px;line-height:1.6;">${desc}</p>
              
              <!-- OTP Box -->
              <div style="background:rgba(40,79,158,0.12);border:1px solid rgba(40,79,158,0.3);border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
                <p style="color:#8a8d9a;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Mã xác thực OTP</p>
                <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#ffffff;font-family:monospace;">${otp}</div>
                <p style="color:#8a8d9a;font-size:12px;margin:12px 0 0;">⏱ Mã có hiệu lực trong <strong style="color:#ECC354;">10 phút</strong></p>
              </div>

              <p style="color:#8a8d9a;font-size:13px;margin:0;line-height:1.6;">
                Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(255,255,255,0.03);padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#555;font-size:12px;margin:0;text-align:center;">
                © 2026 LHU Media Studio · Trường Đại học Lạc Hồng
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"LHU Media Studio" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

/**
 * Kiểm tra kết nối SMTP khi khởi động
 */
async function verifyMailer() {
  try {
    await transporter.verify();
    console.log('✅ SMTP Mailer đã kết nối thành công!');
  } catch (err) {
    console.warn('⚠️  SMTP Mailer không thể kết nối:', err.message);
  }
}

module.exports = { transporter, sendOTPEmail, verifyMailer };
