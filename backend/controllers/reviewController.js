
const { sql, connectDB } = require("../config/db");

// Lấy danh sách đánh giá và thống kê của một sản phẩm
async function getProductReviews(req, res) {
    try {
        const productId = Number(req.params.productId);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Mã sản phẩm không hợp lệ."
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("productId", sql.Int, productId)
            .query(`
                SELECT
                    r.id,
                    r.product_id,
                    r.user_id,
                    r.parent_id,
                    r.rating,
                    r.content,
                    r.created_at,
                    u.full_name
                FROM reviews r
                INNER JOIN users u ON r.user_id = u.id
                WHERE r.product_id = @productId
                  AND r.status = 'approved'
                ORDER BY r.created_at DESC, r.id DESC;

                SELECT
                    COUNT(*) AS total_reviews,
                    CAST(AVG(CAST(rating AS DECIMAL(10,2))) AS DECIMAL(10,2))
                        AS average_rating
                FROM reviews
                WHERE product_id = @productId
                  AND parent_id IS NULL
                  AND status = 'approved'
                  AND rating IS NOT NULL;

                SELECT
                    rating,
                    COUNT(*) AS total
                FROM reviews
                WHERE product_id = @productId
                  AND parent_id IS NULL
                  AND status = 'approved'
                  AND rating IS NOT NULL
                GROUP BY rating;
            `);

        return res.json({
            success: true,
            reviews: result.recordsets[0],
            summary: result.recordsets[1][0],
            rating_counts: result.recordsets[2]
        });

    } catch (error) {
        console.error("Lỗi lấy đánh giá:", error.message);

        return res.status(500).json({
            success: false,
            message: "Không thể tải đánh giá sản phẩm."
        });
    }
}

// Khách hàng gửi đánh giá
async function createReview(req, res) {
    try {
        const productId = Number(req.params.productId);
        const rating = Number(req.body.rating);
        const content = String(req.body.content || "").trim();

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Mã sản phẩm không hợp lệ."
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn số sao từ 1 đến 5."
            });
        }

        if (!content || content.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Nội dung đánh giá không được để trống và tối đa 2000 ký tự."
            });
        }

        const pool = await connectDB();

        // Kiểm tra tài khoản vẫn đang hoạt động
        const userResult = await pool.request()
            .input("userId", sql.Int, req.user.id)
            .query(`
                SELECT id, role, status
                FROM users
                WHERE id = @userId
            `);

        if (
            userResult.recordset.length === 0 ||
            userResult.recordset[0].status !== "active" ||
            userResult.recordset[0].role !== "customer"
        ) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản không đủ điều kiện gửi đánh giá."
            });
        }

        // Kiểm tra sản phẩm tồn tại
        const productResult = await pool.request()
            .input("productId", sql.Int, productId)
            .query(`
                SELECT id FROM products WHERE id = @productId
            `);

        if (productResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm."
            });
        }

        const result = await pool.request()
            .input("productId", sql.Int, productId)
            .input("userId", sql.Int, req.user.id)
            .input("rating", sql.TinyInt, rating)
            .input("content", sql.NVarChar(sql.MAX), content)
            .query(`
                INSERT INTO reviews (
                    product_id,
                    user_id,
                    parent_id,
                    rating,
                    content,
                    status
                )
                OUTPUT INSERTED.id, INSERTED.created_at
                VALUES (
                    @productId,
                    @userId,
                    NULL,
                    @rating,
                    @content,
                    'approved'
                )
            `);

        return res.status(201).json({
            success: true,
            message: "Đánh giá của bạn đã được gửi thành công!",
            review: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi gửi đánh giá:", error.message);

        return res.status(500).json({
            success: false,
            message: "Không thể gửi đánh giá."
        });
    }
}

// Admin trả lời một đánh giá
async function replyReview(req, res) {
    try {
        const parentId = Number(req.params.reviewId);
        const content = String(req.body.content || "").trim();

        if (!Number.isInteger(parentId) || parentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Mã đánh giá không hợp lệ."
            });
        }

        if (!content || content.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Nội dung trả lời không được để trống và tối đa 2000 ký tự."
            });
        }

        const pool = await connectDB();

        const parent = await pool.request()
            .input("parentId", sql.Int, parentId)
            .query(`
                SELECT id, product_id
                FROM reviews
                WHERE id = @parentId
                  AND parent_id IS NULL
                  AND status = 'approved'
            `);

        if (parent.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đánh giá cần trả lời."
            });
        }

        await pool.request()
            .input("productId", sql.Int, parent.recordset[0].product_id)
            .input("userId", sql.Int, req.user.id)
            .input("parentId", sql.Int, parentId)
            .input("content", sql.NVarChar(sql.MAX), content)
            .query(`
                INSERT INTO reviews (
                    product_id,
                    user_id,
                    parent_id,
                    rating,
                    content,
                    status
                )
                VALUES (
                    @productId,
                    @userId,
                    @parentId,
                    NULL,
                    @content,
                    'approved'
                )
            `);

        return res.status(201).json({
            success: true,
            message: "Đã trả lời đánh giá."
        });

    } catch (error) {
        console.error("Lỗi trả lời đánh giá:", error.message);

        return res.status(500).json({
            success: false,
            message: "Không thể trả lời đánh giá."
        });
    }
}

// Admin ẩn hoặc hiện đánh giá
async function updateReviewStatus(req, res) {
    try {
        const reviewId = Number(req.params.reviewId);
        const status = req.body.status;

        if (!Number.isInteger(reviewId) || reviewId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Mã đánh giá không hợp lệ."
            });
        }

        if (!["approved", "hidden"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái không hợp lệ."
            });
        }

        const pool = await connectDB();

        const result = await pool.request()
            .input("reviewId", sql.Int, reviewId)
            .input("status", sql.NVarChar(40), status)
            .query(`
                UPDATE reviews
                SET status = @status
                WHERE id = @reviewId;

                SELECT @@ROWCOUNT AS affected;
            `);

        if (result.recordsets[0][0].affected === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đánh giá."
            });
        }

        return res.json({
            success: true,
            message: status === "hidden"
                ? "Đã ẩn đánh giá."
                : "Đã hiển thị đánh giá."
        });

    } catch (error) {
        console.error("Lỗi cập nhật đánh giá:", error.message);

        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật trạng thái đánh giá."
        });
    }
}

// Admin xem tất cả đánh giá, kể cả đánh giá đã ẩn
async function getAllReviews(req, res) {
    try {
        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT
                r.id,
                r.product_id,
                p.name AS product_name,
                r.user_id,
                u.full_name,
                r.parent_id,
                r.rating,
                r.content,
                r.status,
                r.created_at
            FROM reviews r
            INNER JOIN users u ON r.user_id = u.id
            INNER JOIN products p ON r.product_id = p.id
            ORDER BY r.created_at DESC, r.id DESC
        `);

        return res.json({
            success: true,
            reviews: result.recordset
        });

    } catch (error) {
        console.error("Lỗi quản lý đánh giá:", error.message);

        return res.status(500).json({
            success: false,
            message: "Không thể tải danh sách đánh giá."
        });
    }
}

module.exports = {
    getProductReviews,
    createReview,
    replyReview,
    updateReviewStatus,
    getAllReviews
};
