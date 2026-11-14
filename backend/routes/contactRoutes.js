
const express = require("express");
const router = express.Router();

const {
    createContact,
    getAllContacts,
    updateContactStatus,
    replyContact
} = require("../controllers/contactController");

const {
    verifyToken,
    requireAdmin
} = require("../middleware/authMiddleware");

// Khách gửi liên hệ hoặc góp ý
router.post("/", createContact);

// Admin xem danh sách liên hệ
router.get("/admin", verifyToken, requireAdmin, getAllContacts);

// Admin cập nhật trạng thái
router.patch(
    "/admin/:id/status",
    verifyToken,
    requireAdmin,
    updateContactStatus
);

// Admin phản hồi khách hàng
router.post(
    "/admin/:id/reply",
    verifyToken,
    requireAdmin,
    replyContact
);

module.exports = router;
