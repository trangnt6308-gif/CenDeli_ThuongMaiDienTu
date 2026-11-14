
const bcrypt = require("bcryptjs");
const { sql, connectDB } = require("../config/db");

async function hashExistingPasswords() {
    try {
        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT id, password_hash
            FROM users
        `);

        let updated = 0;
        let skipped = 0;

        for (const user of result.recordset) {
            const currentPassword = user.password_hash;

            // Bỏ qua nếu mật khẩu đã được băm bằng bcrypt
            if (/^\$2[aby]\$/.test(currentPassword)) {
                skipped++;
                continue;
            }

            const hashedPassword = await bcrypt.hash(currentPassword, 10);

            await pool.request()
                .input("id", sql.Int, user.id)
                .input("passwordHash", sql.NVarChar(255), hashedPassword)
                .query(`
                    UPDATE users
                    SET password_hash = @passwordHash,
                        updated_at = SYSDATETIME()
                    WHERE id = @id
                `);

            updated++;
        }

        console.log("Đã xử lý mật khẩu thành công!");
        console.log("Số tài khoản đã chuyển sang bcrypt:", updated);
        console.log("Số tài khoản đã có bcrypt, được giữ nguyên:", skipped);

        await pool.close();
    } catch (error) {
        console.error("Không thể xử lý mật khẩu:", error.message);
        process.exitCode = 1;
    }
}

hashExistingPasswords();
