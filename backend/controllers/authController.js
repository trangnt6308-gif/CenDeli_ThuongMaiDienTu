
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, connectDB } = require("../config/db");

// ==================== ĐĂNG NHẬP ====================
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập email và mật khẩu."
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("email", sql.NVarChar(150), email.trim().toLowerCase())
            .query(`
                SELECT id, full_name, email, password_hash, role, status
                FROM dbo.users
                WHERE email = @email
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không chính xác."
            });
        }

        const user = result.recordset[0];

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị khóa."
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không chính xác."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);

        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi đăng nhập."
        });
    }
}

// ==================== ĐĂNG KÝ ====================
async function register(req, res) {
    try {
        const { fullName, email, phone, password } = req.body;

        // 1. Kiểm tra dữ liệu bắt buộc
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu."
            });
        }

        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone ? phone.trim() : null;

        if (cleanName.length > 100 || cleanEmail.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Họ tên hoặc email vượt quá độ dài cho phép."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Email không đúng định dạng."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu phải có ít nhất 6 ký tự."
            });
        }

        // 2. Kết nối SQL Server và kiểm tra email
        const pool = await connectDB();

        const existingUser = await pool.request()
            .input("email", sql.NVarChar(150), cleanEmail)
            .query(`
                SELECT id
                FROM dbo.users
                WHERE email = @email
            `);

        if (existingUser.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email này đã được đăng ký."
            });
        }

        // 3. Mã hóa mật khẩu
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. Thêm tài khoản vào SQL Server
        const insertResult = await pool.request()
            .input("full_name", sql.NVarChar(100), cleanName)
            .input("email", sql.NVarChar(150), cleanEmail)
            .input("phone", sql.NVarChar(20), cleanPhone)
            .input("password_hash", sql.NVarChar(255), passwordHash)
            .query(`
                INSERT INTO dbo.users
                    (full_name, email, phone, password_hash, role, status)
                OUTPUT
                    INSERTED.id,
                    INSERTED.full_name,
                    INSERTED.email,
                    INSERTED.role
                VALUES
                    (@full_name, @email, @phone, @password_hash, 'customer', 'active')
            `);

        const user = insertResult.recordset[0];

        // 5. Tạo JWT sau khi đăng ký thành công
        if (!process.env.JWT_SECRET) {
            console.error("Chưa cấu hình JWT_SECRET trong file .env");
            return res.status(500).json({
                success: false,
                message: "Máy chủ chưa được cấu hình xác thực."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.status(201).json({
            success: true,
            message: "Đăng ký tài khoản thành công!",
            token,
            user
        });

    } catch (error) {
        console.error("Lỗi đăng ký:", error);

        // Email có thể bị trùng do hai yêu cầu đăng ký đồng thời
        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                success: false,
                message: "Email này đã được đăng ký."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi đăng ký tài khoản."
        });
    }
}

module.exports = { login, register };
