
const express = require("express");
const router = express.Router();

const {
    getProductReviews,
    createReview,
    replyReview,
    updateReviewStatus,
    getAllReviews
} = require("../controllers/reviewController");

const {
    verifyToken,
    requireCustomer,
    requireAdmin
} = require("../middleware/authMiddleware");

// Khách truy cập xem đánh giá sản phẩm
router.get("/product/:productId", getProductReviews);

// Khách hàng đã đăng nhập gửi đánh giá
router.post(
    "/product/:productId",
    verifyToken,
    requireCustomer,
    createReview
);

// Admin xem tất cả đánh giá
router.get(
    "/admin",
    verifyToken,
    requireAdmin,
    getAllReviews
);

// Admin trả lời đánh giá
router.post(
    "/:reviewId/reply",
    verifyToken,
    requireAdmin,
    replyReview
);

// Admin ẩn hoặc hiện đánh giá
router.patch(
    "/:reviewId/status",
    verifyToken,
    requireAdmin,
    updateReviewStatus
);

module.exports = router;
