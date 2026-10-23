require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const queries = [
      // Users: thêm OTP + isVerified fields
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'is_verified')
       BEGIN ALTER TABLE Users ADD is_verified BIT NOT NULL DEFAULT 0 PRINT 'Added is_verified' END`,

      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'otp_code')
       BEGIN ALTER TABLE Users ADD otp_code NVARCHAR(6) NULL PRINT 'Added otp_code' END`,

      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'otp_expiry')
       BEGIN ALTER TABLE Users ADD otp_expiry DATETIME2 NULL PRINT 'Added otp_expiry' END`,

      // StudioBookings: full_name (từ lần trước)
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'StudioBookings') AND name = 'full_name')
       BEGIN ALTER TABLE StudioBookings ADD full_name NVARCHAR(150) NULL PRINT 'Added full_name' END`,
    ];

    for (const q of queries) {
      await sequelize.query(q);
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

migrate();
