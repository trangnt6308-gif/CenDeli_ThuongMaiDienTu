
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Vui lòng đăng nhập để tiếp tục."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
        });
    }
}

function requireCustomer(req, res, next) {
    if (req.user.role !== "customer") {
        return res.status(403).json({
            success: false,
            message: "Chỉ khách hàng mới được gửi đánh giá."
        });
    }

    next();
}

function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Bạn không có quyền thực hiện thao tác này."
        });
    }

    next();
}

module.exports = {
    verifyToken,
    requireCustomer,
    requireAdmin
};
