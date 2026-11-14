
const { sql, connectDB } = require("../config/db");

// Khách hàng gửi liên hệ hoặc góp ý
async function createContact(req, res) {
    try {
        const {
            type,
            name,
            email,
            phone,
            subject,
            message
        } = req.body;

        // Kiểm tra loại yêu cầu
        if (!["contact", "feedback"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Loại yêu cầu không hợp lệ."
            });
        }

        // Kiểm tra thông tin bắt buộc
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập họ tên, email và nội dung."
            });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = phone ? String(phone).trim() : null;
        const cleanSubject = subject ? String(subject).trim() : null;
        const cleanMessage = String(message).trim();

        if (
            cleanName.length > 100 ||
            cleanEmail.length > 150 ||
            (cleanPhone && cleanPhone.length > 15) ||
            (cleanSubject && cleanSubject.length > 150) ||
            cleanMessage.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Thông tin vượt quá giới hạn cho phép."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Email không hợp lệ."
            });
        }

        const pool = await connectDB();

        const request = pool.request();

        // user_id lấy từ JWT nếu khách đã đăng nhập.
        // Khách chưa đăng nhập được phép gửi liên hệ.
        const userId = req.user ? Number(req.user.id) : null;

        request.input("user_id", sql.Int, userId);
        request.input("type", sql.NVarChar(20), type);
        request.input("name", sql.NVarChar(100), cleanName);
        request.input("email", sql.NVarChar(150), cleanEmail);
        request.input("phone", sql.NVarChar(15), cleanPhone);
        request.input("subject", sql.NVarChar(150), cleanSubject);
        request.input("message", sql.NVarChar(sql.MAX), cleanMessage);

        const result = await request.query(`
            INSERT INTO dbo.contacts
            (
                user_id,
                type,
                name,
                email,
                phone,
                subject,
                message,
                status,
                created_at
            )
            OUTPUT INSERTED.id, INSERTED.status, INSERTED.created_at
            VALUES
            (
                @user_id,
                @type,
                @name,
                @email,
                @phone,
                @subject,
                @message,
                N'new',
                SYSDATETIME()
            );
        `);

        return res.status(201).json({
            success: true,
            message: "CenDeli đã nhận được thông tin của bạn.",
            contact: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi gửi liên hệ:", error);

        return res.status(500).json({
            success: false,
            message: "Không thể gửi liên hệ lúc này."
        });
    }
}

// Admin xem danh sách liên hệ
async function getAllContacts(req, res) {
    try {
        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT
                id, user_id, type, name, email, phone,
                subject, message, status, admin_reply, created_at
            FROM dbo.contacts
            ORDER BY
                CASE WHEN status = N'new' THEN 0 ELSE 1 END,
                created_at DESC;
        `);

        res.json({
            success: true,
            contacts: result.recordset
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách liên hệ:", error);
        res.status(500).json({
            success: false,
            message: "Không thể tải danh sách liên hệ."
        });
    }
}

// Admin cập nhật trạng thái
async function updateContactStatus(req, res) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID liên hệ không hợp lệ."
            });
        }

        if (!["new", "read", "replied"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái không hợp lệ."
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("id", sql.Int, id)
            .input("status", sql.NVarChar(20), status)
            .query(`
                UPDATE dbo.contacts
                SET status = @status
                WHERE id = @id;

                SELECT @@ROWCOUNT AS affected;
            `);

        if (result.recordset[0].affected === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu liên hệ."
            });
        }

        res.json({
            success: true,
            message: "Đã cập nhật trạng thái."
        });
    } catch (error) {
        console.error("Lỗi cập nhật liên hệ:", error);
        res.status(500).json({
            success: false,
            message: "Không thể cập nhật trạng thái."
        });
    }
}

// Admin phản hồi khách hàng
async function replyContact(req, res) {
    try {
        const id = Number(req.params.id);
        const { admin_reply } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID liên hệ không hợp lệ."
            });
        }

        const reply = String(admin_reply || "").trim();

        if (!reply) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập nội dung phản hồi."
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("id", sql.Int, id)
            .input("reply", sql.NVarChar(sql.MAX), reply)
            .query(`
                UPDATE dbo.contacts
                SET
                    admin_reply = @reply,
                    status = N'replied'
                WHERE id = @id;

                SELECT @@ROWCOUNT AS affected;
            `);

        if (result.recordset[0].affected === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu liên hệ."
            });
        }

        res.json({
            success: true,
            message: "Đã gửi phản hồi và cập nhật trạng thái."
        });
    } catch (error) {
        console.error("Lỗi phản hồi liên hệ:", error);
        res.status(500).json({
            success: false,
            message: "Không thể gửi phản hồi."
        });
    }
}

module.exports = {
    createContact,
    getAllContacts,
    updateContactStatus,
    replyContact
};
