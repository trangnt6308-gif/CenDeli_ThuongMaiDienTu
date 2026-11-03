-- =====================================================================
--  CenDeli - CƠ SỞ DỮ LIỆU WEBSITE THƯƠNG MẠI ĐIỆN TỬ 
--  Nhóm 3 - Môn Thương mại điện tử
--  "CenDeli - Gói trọn vị miền Trung, gửi gắm vị quê nhà"
--

IF DB_ID(N'CenDeli') IS NULL CREATE DATABASE CenDeli COLLATE Vietnamese_CI_AI;
GO
USE CenDeli;
GO

-- ---------------------------------------------------------------------
-- 1. NGƯỜI DÙNG  (đăng ký / đăng nhập / đăng xuất / phân quyền)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    full_name     NVARCHAR(100) NOT NULL,
    email         NVARCHAR(150) NOT NULL UNIQUE,          -- dùng để đăng nhập, không trùng
    phone         NVARCHAR(15)  NULL,
    password_hash NVARCHAR(255) NOT NULL,                 -- KHÔNG lưu mật khẩu thô
    role          NVARCHAR(20)  NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),   -- phân quyền
    status        NVARCHAR(20)  NOT NULL DEFAULT 'active'   CHECK (status IN ('active','locked')),  -- admin có thể khóa tài khoản
    marketing_consent BIT       NOT NULL DEFAULT 0,       -- 1 = khách đồng ý nhận tin khuyến mãi (Nghị định 13/2023)
    consent_at    DATETIME2(0)  NULL,                     -- thời điểm khách đồng ý
    created_at    DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME(),
    updated_at    DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME()
);
CREATE INDEX idx_users_phone ON users(phone);

-- Sổ địa chỉ giao hàng (mỗi khách có thể lưu nhiều địa chỉ)
CREATE TABLE user_addresses (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    user_id       INT NOT NULL,
    receiver_name NVARCHAR(100) NOT NULL,
    phone         NVARCHAR(15)  NOT NULL,
    address_line  NVARCHAR(255) NOT NULL,                 -- số nhà, tên đường
    ward          NVARCHAR(100) NULL,                     -- phường / xã
    district      NVARCHAR(100) NULL,                     -- quận / huyện
    city          NVARCHAR(100) NOT NULL,                 -- tỉnh / thành phố
    is_default    BIT NOT NULL DEFAULT 0,                 -- 1 = địa chỉ mặc định
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. DANH MỤC, SẢN PHẨM, ẢNH  (lọc / tìm kiếm / sắp xếp / giá cũ - mới)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(100) NOT NULL,
    slug        NVARCHAR(120) NOT NULL UNIQUE,            -- vd /danh-muc/do-an-lien-nham-nhap
    description NVARCHAR(255) NULL,
    sort_order  INT NOT NULL DEFAULT 0,                   -- thứ tự hiển thị
    is_active   BIT NOT NULL DEFAULT 1
);

CREATE TABLE products (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    category_id   INT NOT NULL,
    name          NVARCHAR(150) NOT NULL,
    slug          NVARCHAR(170) NOT NULL UNIQUE,
    short_desc    NVARCHAR(255) NULL,                     -- mô tả ngắn hiển thị ở trang danh sách
    description   NVARCHAR(MAX) NULL,                     -- MÔ TẢ chi tiết
    packaging     NVARCHAR(200) NULL,                     -- QUY CÁCH đóng gói
    origin        NVARCHAR(150) NULL,                     -- nơi sản xuất / vùng đặc sản
    usage_guide   NVARCHAR(MAX) NULL,                     -- CÁCH CHẾ BIẾN / cách dùng
    shelf_life    NVARCHAR(255) NULL,                     -- THỜI GIAN SỬ DỤNG
    storage_type  NVARCHAR(20)  NOT NULL DEFAULT 'ambient'
                  CHECK (storage_type IN ('ambient','chilled','frozen')),  -- ambient = nhiệt độ thường, chilled = ngăn mát, frozen = ngăn đông
    ready_to_eat  BIT NOT NULL DEFAULT 1,                 -- 1 = ăn liền, 0 = cần chế biến nhiệt
    price         INT NOT NULL,                           -- GIÁ MỚI = giá đang bán (sau giảm)
    old_price     INT NULL,                               -- GIÁ CŨ = giá gốc, hiển thị gạch ngang; NULL = không giảm giá
    discount_percent AS (CASE WHEN old_price IS NULL OR old_price = 0 THEN 0
                              ELSE CAST(ROUND((old_price - price) * 100.0 / old_price, 0) AS INT) END),  -- % giảm, tự tính để hiện nhãn "-15%"
    stock         INT NOT NULL DEFAULT 0,                 -- tồn kho (cảnh báo khi dưới 10)
    sold_count    INT NOT NULL DEFAULT 0,                 -- dùng để sắp xếp "bán chạy"
    is_featured   BIT NOT NULL DEFAULT 0,                 -- 1 = hiện ở mục "Sản phẩm nổi bật" trang chủ
    status        NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden')),
    created_at    DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),   -- dùng để sắp xếp "mới nhất"
    updated_at    DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_old_price CHECK (old_price IS NULL OR old_price > price),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price    ON products(price);
CREATE INDEX idx_products_name     ON products(name);
CREATE INDEX idx_products_sold     ON products(sold_count);

CREATE TABLE product_images (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    image_url  NVARCHAR(255) NOT NULL,
    is_primary BIT NOT NULL DEFAULT 0,                    -- 1 = ảnh đại diện
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. MÃ GIẢM GIÁ (voucher) 
-- ---------------------------------------------------------------------
CREATE TABLE coupons (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    code           NVARCHAR(30) NOT NULL UNIQUE,          -- mã khách nhập khi thanh toán
    description    NVARCHAR(255) NULL,
    discount_type  NVARCHAR(10) NOT NULL CHECK (discount_type IN ('percent','fixed')),  -- percent = giảm %, fixed = giảm số tiền cố định
    discount_value INT NOT NULL,                          -- 10000 (fixed) hoặc 10 (percent)
    max_discount   INT NULL,                              -- giảm tối đa (dùng cho loại percent)
    min_order      INT NOT NULL DEFAULT 0,                -- giá trị đơn tối thiểu để dùng mã
    first_order_only BIT NOT NULL DEFAULT 0,              -- 1 = chỉ áp dụng cho đơn hàng ĐẦU TIÊN của khách
    usage_limit    INT NULL,                              -- tổng số lượt dùng tối đa; NULL = không giới hạn
    used_count     INT NOT NULL DEFAULT 0,
    start_date     DATETIME2(0) NULL,
    end_date       DATETIME2(0) NULL,
    is_active      BIT NOT NULL DEFAULT 1
);

CREATE TABLE settings (                                   -- cấu hình dạng key - value, admin chỉnh được
    setting_key   NVARCHAR(50)  PRIMARY KEY,
    setting_value NVARCHAR(255) NOT NULL,
    description   NVARCHAR(255) NULL
);

-- ---------------------------------------------------------------------
-- 4. GIỎ HÀNG, ĐƠN HÀNG, THANH TOÁN
-- ---------------------------------------------------------------------
CREATE TABLE carts (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT NOT NULL UNIQUE,                       -- mỗi user một giỏ
    updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    cart_id    INT NOT NULL,
    product_id INT NOT NULL,
    quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id),   -- 1 sản phẩm chỉ 1 dòng trong giỏ, thêm nữa thì tăng quantity
    FOREIGN KEY (cart_id)    REFERENCES carts(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    order_code       NVARCHAR(20) NOT NULL UNIQUE,        -- mã đơn hiển thị cho khách, vd CD20261101001
    user_id          INT NULL,                            -- NULL nếu tài khoản bị xóa (vẫn giữ đơn để đối soát)
    receiver_name    NVARCHAR(100) NOT NULL,
    receiver_phone   NVARCHAR(15)  NOT NULL,
    receiver_email   NVARCHAR(150) NULL,
    shipping_address NVARCHAR(255) NOT NULL,
    note             NVARCHAR(255) NULL,
    subtotal         INT NOT NULL,                        -- tổng tiền hàng
    coupon_id        INT NULL,
    coupon_discount  INT NOT NULL DEFAULT 0,
    shipping_fee     INT NOT NULL DEFAULT 0,
    total            INT NOT NULL,                        -- = subtotal - coupon_discount + shipping_fee
    payment_method   NVARCHAR(20) NOT NULL DEFAULT 'cod'     CHECK (payment_method IN ('cod','bank_transfer')),            -- cod = thanh toán khi nhận hàng
    payment_status   NVARCHAR(20) NOT NULL DEFAULT 'unpaid'  CHECK (payment_status IN ('unpaid','paid','refunded')),
    order_status     NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','shipping','completed','cancelled')),
    shipping_carrier NVARCHAR(30) NULL,                   -- SPX Express / GHTK / GHN / Viettel Post
    tracking_code    NVARCHAR(50) NULL,                   -- mã vận đơn để khách tra cứu
    cancel_reason    NVARCHAR(255) NULL,                  -- lý do hủy / hoàn (để thống kê tỷ lệ hủy)
    created_at       DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    updated_at       DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);
CREATE INDEX idx_orders_user    ON orders(user_id);
CREATE INDEX idx_orders_status  ON orders(order_status);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE TABLE order_items (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    order_id     INT NOT NULL,
    product_id   INT NULL,
    product_name NVARCHAR(150) NOT NULL,                  -- SNAPSHOT tên + giá lúc mua, sau này đổi giá đơn cũ không bị sai
    unit_price   INT NOT NULL,
    quantity     INT NOT NULL CHECK (quantity > 0),
    line_total   INT NOT NULL,                            -- = unit_price * quantity
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE order_status_history (                       -- lịch sử trạng thái, để khách theo dõi đơn
    id         INT IDENTITY(1,1) PRIMARY KEY,
    order_id   INT NOT NULL,
    status     NVARCHAR(20) NOT NULL,
    note       NVARCHAR(255) NULL,
    changed_by INT NULL,                                  -- ai đổi trạng thái (khách hoặc admin)
    created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)  ON DELETE NO ACTION
);

-- ---------------------------------------------------------------------
-- 5. ĐÁNH GIÁ + BÌNH LUẬN, LIÊN HỆ / FEEDBACK, TRANG CHÍNH SÁCH
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    user_id    INT NOT NULL,
    parent_id  INT NULL,                                  -- NULL = đánh giá gốc; có giá trị = phản hồi của admin / khách khác
    rating     TINYINT NULL CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),   -- 1-5 sao (phản hồi thì để NULL)
    content    NVARCHAR(MAX) NOT NULL,
    status     NVARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','hidden')),
    created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (parent_id)  REFERENCES reviews(id)  ON DELETE NO ACTION
);
CREATE INDEX idx_reviews_product ON reviews(product_id, status);

CREATE TABLE contacts (                                   -- form Liên hệ + Góp ý
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT NULL,                                 -- NULL nếu khách chưa đăng nhập
    type        NVARCHAR(20) NOT NULL DEFAULT 'contact' CHECK (type IN ('contact','feedback')),
    name        NVARCHAR(100) NOT NULL,
    email       NVARCHAR(150) NOT NULL,
    phone       NVARCHAR(15)  NULL,
    subject     NVARCHAR(150) NULL,
    message     NVARCHAR(MAX) NOT NULL,
    status      NVARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied')),
    admin_reply NVARCHAR(MAX) NULL,
    created_at  DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE pages (                                      -- trang nội dung tĩnh: chính sách đổi trả / bảo hành / vận chuyển / bảo mật
    id         INT IDENTITY(1,1) PRIMARY KEY,
    slug       NVARCHAR(80)  NOT NULL UNIQUE,
    title      NVARCHAR(150) NOT NULL,
    content    NVARCHAR(MAX) NOT NULL,                    -- nội dung HTML
    updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
GO

-- ---------------------------------------------------------------------
-- 6. VIEW HỖ TRỢ (điểm sao, dashboard admin, cảnh báo kho, KPI)
-- ---------------------------------------------------------------------

-- Điểm sao trung bình + số lượt đánh giá của từng sản phẩm
CREATE VIEW v_product_rating AS
SELECT product_id,
       ROUND(AVG(CAST(rating AS FLOAT)), 1) AS avg_rating,
       COUNT(*)                              AS review_count
FROM reviews
WHERE parent_id IS NULL AND rating IS NOT NULL AND status = 'approved'
GROUP BY product_id;
GO

-- Số liệu tổng quan cho trang Dashboard của admin
CREATE VIEW v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM products WHERE status = 'active')                      AS total_products,
  (SELECT COUNT(*) FROM orders)                                                AS total_orders,
  (SELECT COUNT(*) FROM orders WHERE order_status = 'pending')                 AS pending_orders,
  (SELECT COALESCE(SUM(total),0) FROM orders WHERE order_status = 'completed') AS total_revenue,
  (SELECT COUNT(*) FROM users WHERE role = 'customer')                         AS total_customers,
  (SELECT COUNT(*) FROM contacts WHERE status = 'new')                         AS new_contacts;
GO

-- Doanh thu theo ngày (vẽ biểu đồ)
CREATE VIEW v_revenue_by_day AS
SELECT CAST(created_at AS DATE) AS order_day, COUNT(*) AS orders, SUM(total) AS revenue
FROM orders
WHERE order_status = 'completed'
GROUP BY CAST(created_at AS DATE);
GO

-- Sản phẩm sắp hết hàng: tồn kho DƯỚI ngưỡng trong settings (mặc định 10, theo quy định vận hành của kế hoạch)
CREATE VIEW v_low_stock AS
SELECT id, name, stock
FROM products
WHERE status = 'active'
  AND stock < CAST((SELECT setting_value FROM settings WHERE setting_key = N'low_stock_threshold') AS INT);
GO

-- KPI theo kế hoạch: số đơn hoàn tất, AOV, đơn hủy, khách mua lại
CREATE VIEW v_kpi_summary AS
SELECT
  (SELECT COUNT(*) FROM orders WHERE order_status = 'completed')                                    AS completed_orders,
  (SELECT COALESCE(AVG(CAST(total AS FLOAT)), 0) FROM orders WHERE order_status = 'completed')      AS aov,               -- giá trị đơn trung bình
  (SELECT COUNT(*) FROM orders WHERE order_status = 'cancelled')                                    AS cancelled_orders,  -- tỷ lệ hủy = cancelled_orders / total_orders
  (SELECT COUNT(*) FROM orders)                                                                     AS total_orders,
  (SELECT COUNT(DISTINCT user_id) FROM orders
     WHERE user_id IS NOT NULL AND order_status <> 'cancelled')                                     AS buying_customers,
  (SELECT COUNT(*) FROM (SELECT user_id FROM orders
                         WHERE user_id IS NOT NULL AND order_status <> 'cancelled'
                         GROUP BY user_id HAVING COUNT(*) >= 2) AS t)                               AS repeat_customers;  -- tỷ lệ mua lại = repeat_customers / buying_customers
GO

-- =====================================================================
--  DỮ LIỆU MẪU
-- =====================================================================

-- Người dùng (mật khẩu mẫu: Admin@123, băm bcrypt)
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, full_name, email, phone, password_hash, role, marketing_consent, consent_at) VALUES
(1, N'Quản trị CenDeli', N'admin@cendeli.vn',  N'0900000001', N'Admin1234', N'admin',    0, NULL),
(2, N'Nguyễn Hoàng Châu',    N'khach1@cendeli.vn', N'0900000002', N'Khach111@@', N'customer', 1, '2026-10-30 10:00:00'),
(3, N'Lê Nhật Nam',      N'khach2@cendeli.vn', N'0900000003', N'Khach222@@', N'customer', 0, NULL),
(4, N'Trần Minh Hoàng',   N'khach3@cendeli.vn', N'0900000004', N'Khach333@@', N'customer', 0, NULL);
SET IDENTITY_INSERT users OFF;

INSERT INTO user_addresses (user_id, receiver_name, phone, address_line, ward, district, city, is_default) VALUES
(2, N'Nguyễn Hoàng Châu', N'0900000002', N'12 Nguyễn Văn Linh', N'Tân Thuận Tây', N'Quận 7', N'TP. Hồ Chí Minh', 1),
(3, N'Lê Nhật Nam',   N'0900000003', N'45 Lê Lợi',           N'Bến Thành',      N'Quận 1', N'TP. Hồ Chí Minh', 1);

-- 3 danh mục
SET IDENTITY_INSERT categories ON;
INSERT INTO categories (id, name, slug, description, sort_order) VALUES
(1, N'Đồ ăn liền, nhấm nháp',          N'do-an-lien-nham-nhap',
    N'Các món ăn vặt, mở nắp/bao bì ăn ngay, thu hút giới trẻ, dân nhậu', 1),
(2, N'Thịt & đồ lên men truyền thống', N'thit-do-len-men-truyen-thong',
    N'Món ngon gia truyền, yêu cầu bảo quản mát hoặc đông lạnh', 2),
(3, N'Hải sản khô & mắm vùng miền',    N'hai-san-kho-mam-vung-mien',
    N'Món mặn chuẩn vị quê, dùng ăn cơm hoặc chế biến món ăn gia đình', 3);
SET IDENTITY_INSERT categories OFF;

-- 18 sản phẩm ; bánh tráng xoài có 2 quy cách trong cùng một sản phẩm.
--   price = giá giảm (giá bán), old_price = giá gốc.
SET IDENTITY_INSERT products ON;
INSERT INTO products
(id, category_id, name, slug, short_desc, description, packaging, origin, usage_guide, shelf_life,
 storage_type, ready_to_eat, price, old_price, stock, is_featured) VALUES
-- ===== DANH MỤC 1: ĐỒ ĂN LIỀN, NHẤM NHÁP =====
(1, 1, N'Ghẹ Sữa Rim Me / Rim Cay', N'ghe-sua-rim-me-rim-cay',
 N'Ghẹ sữa chiên giòn rim sốt me chua ngọt hoặc sốt ớt cay nhẹ.',
 N'Ghẹ sữa mềm giòn nguyên con, chiên giòn rụm rồi rim cùng sốt me chua ngọt hoặc sốt ớt cay nhẹ, giàu canxi.',
 N'Hũ PET 180g (màng seal nhôm)', N'Nha Trang - Quy Nhơn',
 N'Mở hũ ăn liền, dùng làm món nhắm bia hoặc ăn vặt khi xem phim.',
 N'3 tháng ở nhiệt độ thường (tránh ánh nắng), 6 tháng ở ngăn mát tủ lạnh.',
 'ambient', 1, 153000, 180000, 50, 1),
(2, 1, N'Cá Thiều Que Tẩm Gia Vị', N'ca-thieu-que-tam-gia-vi',
 N'Sợi cá thiều dai dẻo, thơm tiêu đen, mặn ngọt cay đậm đà.',
 N'Thịt cá thiều tươi quết nhuyễn, cán mỏng cắt dạng sợi que dài, tẩm ướp đường, nước mắm ngon và rất nhiều tiêu đen nghiền.',
 N'Hũ PET 180g hoặc túi zip 200g', N'Phan Thiết - Đà Nẵng',
 N'Ăn trực tiếp (sợi cá dẻo dai, thơm mặn ngọt cay đậm đà).',
 N'6 tháng ở nhiệt độ thường (đóng kín nắp sau khi mở).',
 'ambient', 1, 80750, 95000, 50, 0),
(3, 1, N'Bánh Tráng Xoài Dẻo', N'banh-trang-xoai-deo',
 N'Bánh tráng xoài chua ngọt tự nhiên, dẻo quánh, món ăn vặt văn phòng.',
 N'Nước cốt xoài chín cô đặc tráng mỏng phơi nắng. Vị chua ngọt tự nhiên, dẻo quánh, không chất bảo quản.',
 N'Túi zip 200g hoặc 500g', N'Cam Ranh - Nha Trang',
 N'Xé dải ăn trực tiếp, là món ăn vặt văn phòng cực kỳ được ưa chuộng.',
 N'6 - 9 tháng ở nhiệt độ thường (bảo quản nơi khô ráo).',
 'ambient', 1, 25000, 30000, 80, 1),
(5, 1, N'Bánh Tráng Dừa Nướng (10 cái)', N'banh-trang-dua-nuong-10-cai',
 N'Bánh tráng dừa nướng than giòn rụm, béo ngậy.',
 N'Bánh tráng bột gạo trộn nước cốt dừa, cơm dừa nạo và mè đen. Nướng trên than hồng cho giòn rụm, béo ngậy.',
 N'Túi zip kín, 10 cái/túi', N'Bình Định',
 N'Ăn trực tiếp ăn trực tiếp hoặc dùng kèm các món ăn khác.',
 N'2 - 3 tháng ở nhiệt độ thường (cần túi zip kín để tránh bị thiu/mềm bánh).',
 'ambient', 1, 55000, 60000, 60, 0),
(6, 1, N'Mực Xé Sợi Hấp Bơ Tỏi', N'muc-xe-soi-hap-bo-toi',
 N'Mực xé sợi dẻo mềm, thơm bơ lạt và tỏi sấy giòn.',
 N'Mực khô xé sợi dẻo mềm được đảo qua bơ lạt thơm lừng và tỏi sấy giòn rụm. Vị mặn ngọt vừa phải, béo ngậy mùi bơ, cay nhẹ tỏi ớt.',
 N'Hũ PET 180g (màng seal nhôm)', N'Nha Trang - Khánh Hòa',
 N'Mở nắp ăn trực tiếp.',
 N'3 - 4 tháng ở nhiệt độ thường (tránh ánh nắng), 6 tháng trong ngăn mát tủ lạnh.',
 'ambient', 1, 127500, 150000, 50, 1),
(7, 1, N'Khô Cá Mai Chanh Tuyết / Tẩm Gia Vị', N'kho-ca-mai-chanh-tuyet-tam-gia-vi',
 N'Cá mai ép mỏng giòn rụm, tẩm đường ớt và mè rang.',
 N'Cá mai biển ép miếng mỏng, tẩm đường, ớt và mè rang. Miếng cá giòn rụm, ngọt thịt, thơm béo vị mè.',
 N'Hũ PET 180g hoặc túi zip 200g', N'Phan Thiết',
 N'Ăn trực tiếp như món snack hoặc làm đồ nhắm.',
 N'6 tháng ở nhiệt độ thường (đóng kín nắp/túi sau khi mở).',
 'ambient', 1, 97750, 115000, 50, 0),
(8, 1, N'Bánh Tráng Mắm Ruốc (Túi 10 cái)', N'banh-trang-mam-ruoc-10-cai',
 N'Bánh tráng mè nướng cuộn nhân mắm ruốc, trứng, hành phi, giòn thơm.',
 N'Bánh tráng mè mỏng được quết một lớp mắm ruốc Phan Rang/Phan Thiết đậm đà, nhân bên trong gồm mỡ hành, trứng cút/trứng gà, hành phi, ruốc tép và nem chua/chả lụa xắt nhỏ, nướng cuộn giòn rụm trên bếp than hồng.',
 N'Túi zip 5 - 10 cái (đã nướng chín sẵn, cuộn tròn hoặc gấp tam giác)', N'Ninh Thuận - Bình Thuận',
 N'Mở bao bì ăn trực tiếp như món snack ăn vặt; hoặc quay nhanh trong lò vi sóng / nồi chiên không dầu (15 - 30 giây) để bánh nóng giòn thơm nức mùi mắm ruốc trước khi ăn.',
 N'1 - 2 tháng ở nhiệt độ thường (cần kéo kín túi zip sau khi mở để giữ độ giòn tan của bánh).',
 'ambient', 1, 65000, 70000, 50, 0),
-- ===== DANH MỤC 2: THỊT & ĐỒ LÊN MEN TRUYỀN THỐNG =====
(9, 2, N'Chả Cá Quy Nhơn / Nha Trang (Chiên & Hấp)', N'cha-ca-quy-nhon-nha-trang',
 N'Chả cá biển quết dai tự nhiên, không pha bột, đóng túi hút chân không.',
 N'Làm từ thịt cá biển tươi (cá thu, cá mối, cá nhồng) quết dai tự nhiên, không hàn the hay pha bột.',
 N'Khay 500g (bánh tròn hoặc thanh), đóng túi hút chân không', N'Quy Nhơn - Nha Trang',
 N'Đồ đã chín sẵn. Cần rã đông, chiên sơ lại 3 - 5 phút cho nóng giòn để ăn cơm, làm bún/bánh canh chả cá, hoặc cắt lát làm món nhắm.',
 N'7 - 10 ngày trong ngăn mát; 6 tháng trong ngăn đông.',
 'chilled', 0, 102000, 120000, 40, 0),
(10, 2, N'Nem Chua Huế Gói Lá Chuối', N'nem-chua-hue-goi-la-chuoi',
 N'Nem chua nạc heo, tỏi ớt, vị chua đậm thơm nức.',
 N'Nem nạc heo băm kết hợp bì, tỏi lát, tiêu hạt và ớt tươi. Vị chua đậm hơn nem Chợ Huyện, thơm nức mùi tỏi ớt.',
 N'Túi hút chân không 10 chiếc/túi (200g)', N'Thừa Thiên Huế',
 N'Bóc vỏ ăn trực tiếp khi nem đã đủ độ chua, dùng làm món nhắm hoặc nguyên liệu trộn tré.',
 N'7 ngày ở nhiệt độ thường (mùa mát); 20 - 30 ngày trong ngăn mát tủ lạnh.',
 'chilled', 1, 76500, 90000, 50, 1),
(11, 2, N'Bò Một Nắng Muối Kiến Vàng', N'bo-mot-nang-muoi-kien-vang',
 N'Bò một nắng sần ngoài mềm trong, chấm muối kiến vàng độc lạ.',
 N'Thịt bò thăn/đùi tươi tẩm ướp gia vị phơi đúng 1 nắng gắt cho sần bên ngoài nhưng bên trong vẫn mềm.',
 N'Túi 250g hút chân không (kèm hũ muối kiến vàng)', N'Phú Yên',
 N'Bắt buộc chế biến nhiệt: áp chảo hoặc nướng trên than/nồi chiên không dầu (5 - 7 phút mỗi mặt), xé sợi chấm muối kiến vàng béo chua độc lạ.',
 N'1 tháng trong ngăn đá tủ lạnh.',
 'frozen', 0, 97750, 115000, 40, 1),
(12, 2, N'Bắp Bò Ngâm Mắm Nhĩ', N'bap-bo-ngam-mam-nhi',
 N'Bắp bò hoa luộc chín ngâm nước mắm nhĩ, thịt săn chắc.',
 N'Bắp bò hoa tươi luộc chín cùng thảo mộc, ngâm trong nước mắm nhĩ thượng hạng pha đường thốt nốt, tỏi ớt và tiêu xanh. Thịt bò săn chắc, chua mặn ngọt hài hòa.',
 N'Hũ thủy tinh / hũ PET 500g (gồm bắp bò hoa và nước mắm ngâm)', N'Đà Nẵng - Huế',
 N'Vớt bắp bò ra cắt lát mỏng ăn liền, cuốn bánh tráng rau sống hoặc làm đồ nhắm.',
 N'15 - 20 ngày trong ngăn mát tủ lạnh.',
 'chilled', 1, 106250, 125000, 8, 0),      -- stock = 8 (< 10) để thử view v_low_stock
(13, 2, N'Chả Ốc Nướng Giấy Bạc', N'cha-oc-nuong-giay-bac',
 N'Chả ốc bươu giòn sần sật, thơm sả và lá lốt, nướng nguyên giấy bạc.',
 N'Giò sống quết mịn trộn cùng thịt ốc bươu giòn sần sật, sả băm, tiêu hạt và lá lốt thơm lừng.',
 N'Đòn 500g bọc giấy bạc hút chân không (đông lạnh)', N'Huế',
 N'Cần chế biến nhiệt: rã đông, hấp hoặc nướng nguyên bọc giấy bạc (nồi chiên không dầu/lò nướng) khoảng 10 - 15 phút cho thơm phức rồi cắt lát ăn nóng.',
 N'10 ngày ngăn mát, 3 tháng ngăn đông.',
 'frozen', 0, 110500, 130000, 40, 0),
-- ===== DANH MỤC 3: HẢI SẢN KHÔ & MẮM VÙNG MIỀN =====
(14, 3, N'Mắm Nêm Pha Sẵn Chuẩn Vị Xứ Quảng', N'mam-nem-pha-san-xu-quang',
 N'Mắm nêm cá cơm pha sẵn với thơm, tỏi, ớt, đường thốt nốt.',
 N'Mắm cá cơm nguyên chất được muối lên men, pha sẵn cùng dứa (thơm) băm nhỏ, tỏi, ớt và đường thốt nốt.',
 N'Chai nhựa/thủy tinh 250ml', N'Quảng Nam - Đà Nẵng',
 N'Mở nắp dùng ngay (chấm thịt luộc, bánh tráng cuốn, bún mắm nêm).',
 N'6 tháng ở nhiệt độ thường (để ngăn mát sẽ giữ màu mắm tươi lâu hơn).',
 'ambient', 1, 25000, 30000, 100, 1),
(15, 3, N'Cá Đéc / Cá Khoai Rim Cay Ngọt', N'ca-dec-ca-khoai-rim-cay-ngot',
 N'Cá đéc phơi khô rim mắm ớt tỏi, xương mềm ăn được cả con.',
 N'Cá đéc biển xẻ phơi khô, rim cùng nước mắm ớt tỏi quánh dẻo. Thịt cá xốp ngọt, xương mềm ăn được cả con.',
 N'Hũ PET 250g', N'Quảng Ngãi - Bình Định',
 N'Ăn trực tiếp với cơm nóng, cháo trắng hoặc dùng làm món nhắm.',
 N'4 - 6 tháng ở nhiệt độ thường.',
 'ambient', 1, 76500, 90000, 50, 0),
(16, 3, N'Mực Một Nắng / Mực Khô Câu', N'muc-mot-nang-muc-kho-cau',
 N'Mực ống câu phơi một nắng, thân dày, thịt ngọt lịm.',
 N'Mực ống câu bãi biển phơi qua nắng, thân dày, thịt ngọt lịm, còn nguyên lớp phấn trắng.',
 N'Túi 500g (3 - 6 con/kg) hút chân không', N'Đà Nẵng - Phan Thiết',
 N'Chế biến trước khi ăn: nướng cồn/nướng than, làm mực chiên mắm, hoặc mực xào cần tây.',
 N'Mực khô để được 6 tháng ở ngăn đông; mực một nắng bảo quản ngăn đông 3 - 6 tháng.',
 'frozen', 0, 93500, 110000, 30, 1),
(17, 3, N'Mắm Dưa Cà Pháo Xứ Quảng', N'mam-dua-ca-phao-xu-quang',
 N'Dưa leo, cà pháo, đu đủ muối giòn trộn mắm nêm tỏi ớt.',
 N'Dưa leo giòn, cà pháo, đu đủ tươi được muối giòn rồi trộn ngập trong mắm nêm cá cơm đậm đà cùng tỏi ớt băm.',
 N'Hũ PET 500g', N'Quảng Nam - Quảng Ngãi',
 N'Mở nắp gắp ra ăn trực tiếp với cơm nóng, thịt luộc hoặc bún tươi.',
 N'1 - 2 tháng trong ngăn mát tủ lạnh (giữ độ giòn của dưa cà).',
 'chilled', 1, 76500, 90000, 40, 0),
(18, 3, N'Cá Nục Một Nắng Rim Tiêu Xanh', N'ca-nuc-mot-nang-rim-tieu-xanh',
 N'Cá nục phơi một nắng, kho rim nước mắm ớt hiểm và tiêu xanh.',
 N'Cá nục biển tươi phơi 1 nắng cho săn thịt, đem kho rim với nước mắm ngon, ớt hiểm và chùm tiêu xanh tươi cho đến khi quánh dẻo.',
 N'Khay 250g - 300g (chế biến sẵn)', N'Quy Nhơn - Bình Định',
 N'Mở hũ ăn ngay với cơm nóng / cháo trắng, hoặc quay nóng lại 1 phút bằng lò vi sóng.',
 N'3 tháng ở nhiệt độ thường, 6 tháng trong ngăn mát.',
 'ambient', 1, 55000, 60000, 50, 0),
(19, 3, N'Khô Cá Đuối Đen Tẩm Gia Vị', N'kho-ca-duoi-den-tam-gia-vi',
 N'Cá đuối đen xẻ mỏng tẩm nước mắm ớt tỏi, dẻo và ngọt tự nhiên.',
 N'Thịt cá đuối đen tươi xẻ mỏng, tẩm ướp nước mắm ớt tỏi rồi phơi khô. Thịt cá dẻo, ngọt tự nhiên, không bị khai.',
 N'Túi zip 200g hút chân không', N'Phan Thiết - Bình Thuận',
 N'Cần chế biến nhiệt: nướng than/cồn hoặc chiên giòn, đập dập xé sợi chấm mắm me hoặc tương ớt.',
 N'6 tháng ở nhiệt độ thường (nơi khô ráo) hoặc bảo quản ngăn đông.',
 'ambient', 0, 170000, 200000, 40, 0);
SET IDENTITY_INSERT products OFF;

-- Ảnh sản phẩm: mỗi sản phẩm 3 ảnh. Đặt file vào /images/products/<slug>-1.jpg, -2.jpg, -3.jpg
-- (file Word chưa có ảnh nên đường dẫn là chỗ giữ sẵn, bỏ ảnh thật vào đúng tên là hiện)
INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
SELECT id, CONCAT(N'/images/products/', slug, N'-1.jpg'), 1, 1 FROM products;
INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
SELECT id, CONCAT(N'/images/products/', slug, N'-2.jpg'), 0, 2 FROM products;
INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
SELECT id, CONCAT(N'/images/products/', slug, N'-3.jpg'), 0, 3 FROM products;

-- Bảng coupons được giữ để có thể bổ sung mã giảm giá sau này nếu shop triển khai.

-- Cấu hình chung
INSERT INTO settings (setting_key, setting_value, description) VALUES
(N'shipping_fee',         N'25000',  N'Phí vận chuyển mặc định (VNĐ)'),
(N'free_ship_threshold',  N'300000', N'Miễn phí vận chuyển khi tiền hàng từ mức này (VNĐ)'),
(N'low_stock_threshold',  N'10',     N'Cảnh báo sắp hết hàng khi tồn kho DƯỚI số này (theo quy định vận hành của kế hoạch)'),
(N'return_hours',         N'48',     N'Thời hạn hỗ trợ đổi 1 đổi 1 trong vòng 48 giờ kể từ khi nhận hàng'),
(N'order_discount_threshold', N'200000', N'Đơn hàng trên 200.000đ được giảm 15.000đ'),
(N'order_discount_amount', N'15000', N'Số tiền giảm trực tiếp cho đơn hàng đủ điều kiện'),
(N'shipping_carriers',    N'SPX Express, GHTK, GHN, Viettel Post', N'Các đơn vị vận chuyển đối tác'),
(N'store_name',           N'CenDeli - Gói trọn vị miền Trung', N'Tên cửa hàng'),
(N'store_address',        N'TP. Hồ Chí Minh (cập nhật địa chỉ kho mini thực tế)', N'Địa chỉ hiển thị ở trang liên hệ'),
(N'store_phone',          N'0900000001', N'Hotline'),
(N'store_email',          N'cendeli@gmail.com', N'Email liên hệ (đổi thành email thật của nhóm)'),
(N'map_lat',              N'10.7769',  N'Vĩ độ Google Maps (cập nhật theo kho thật)'),
(N'map_lng',              N'106.7009', N'Kinh độ Google Maps (cập nhật theo kho thật)');

-- Đơn hàng mẫu (để dashboard có số liệu). Công thức: total = subtotal - coupon_discount + shipping_fee
SET IDENTITY_INSERT orders ON;
INSERT INTO orders
(id, order_code, user_id, receiver_name, receiver_phone, shipping_address, subtotal, coupon_id, coupon_discount, shipping_fee, total,
 payment_method, payment_status, order_status, shipping_carrier, tracking_code, created_at) VALUES
-- Đơn 1: 140.000 + ship 25.000 (dưới 300k nên tính ship) = 165.000
(1, N'CD20261030001', 2, N'Nguyễn Văn An', N'0900000002', N'12 Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, TP.HCM',
 140000, NULL, 0,     25000, 165000, N'cod',           N'paid',   N'completed', N'GHTK',        N'GHTK000111', '2026-10-30 10:15:00'),
-- Đơn 2: 361.250 (từ 300k nên miễn ship) - voucher CenDeli10K 10.000 = 351.250
(2, N'CD20261101001', 3, N'Lê Thị Bình',   N'0900000003', N'45 Lê Lợi, Bến Thành, Quận 1, TP.HCM',
 361250, NULL, 0, 0, 361250, N'bank_transfer', N'paid',   N'completed', N'SPX Express', N'SPX000222',  '2026-11-01 14:30:00'),
-- Đơn 3: 204.000 + ship 25.000 = 229.000 (đang chờ xử lý)
(3, N'CD20261102001', 2, N'Nguyễn Văn An', N'0900000002', N'12 Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, TP.HCM',
 204000, NULL, 0,     25000, 229000, N'cod',           N'unpaid', N'pending',   NULL,           NULL,          '2026-11-02 09:00:00');
SET IDENTITY_INSERT orders OFF;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total) VALUES
(1, 3,  N'Bánh Tráng Xoài Dẻo',        25000,  2, 50000),
(1, 14, N'Mắm Nêm Pha Sẵn Chuẩn Vị Xứ Quảng',     25000,  1, 25000),
(1, 8,  N'Bánh Tráng Mắm Ruốc (Túi 10 cái)',      65000,  1, 65000),
(2, 11, N'Bò Một Nắng Muối Kiến Vàng',            97750,  1, 97750),
(2, 16, N'Mực Một Nắng / Mực Khô Câu',            93500,  1, 93500),
(2, 19, N'Khô Cá Đuối Đen Tẩm Gia Vị',           170000,  1, 170000),
(3, 6,  N'Mực Xé Sợi Hấp Bơ Tỏi',                127500,  1, 127500),
(3, 15, N'Cá Đéc / Cá Khoai Rim Cay Ngọt',        76500,  1, 76500);

INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES
(1, N'pending',   N'Khách đặt hàng', 2), (1, N'completed', N'Giao thành công', 1),
(2, N'pending',   N'Khách đặt hàng', 3), (2, N'completed', N'Giao thành công', 1),
(3, N'pending',   N'Khách đặt hàng', 2);

-- Cập nhật số lượng đã bán từ các đơn HOÀN TẤT (để sắp xếp "bán chạy" khớp với đơn hàng)
UPDATE p
SET p.sold_count = s.qty
FROM products p
JOIN (SELECT oi.product_id, SUM(oi.quantity) AS qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.order_status = 'completed'
      GROUP BY oi.product_id) s ON s.product_id = p.id;

-- Đánh giá + bình luận mẫu (người mua đã có đơn hoàn tất)
SET IDENTITY_INSERT reviews ON;
INSERT INTO reviews (id, product_id, user_id, parent_id, rating, content) VALUES
(1, 3,  2, NULL, 5, N'Bánh tráng xoài dẻo, chua ngọt tự nhiên, ăn vặt rất ghiền.'),
(2, 14, 2, NULL, 4, N'Mắm nêm đậm vị xứ Quảng, chấm thịt luộc rất hợp.'),
(3, 11, 3, NULL, 5, N'Bò một nắng mềm, chấm muối kiến vàng rất lạ miệng.');
SET IDENTITY_INSERT reviews OFF;
INSERT INTO reviews (product_id, user_id, parent_id, rating, content) VALUES
(3, 1, 1, NULL, N'CenDeli cảm ơn bạn đã ủng hộ! Hẹn gặp lại bạn ở đơn hàng sau.');

-- Liên hệ / feedback mẫu
INSERT INTO contacts (user_id, type, name, email, phone, subject, message) VALUES
(3, N'feedback', N'Lê Nhật Nam', N'khach2@cendeli.vn', N'0900000003', N'Góp ý giao diện',
 N'Website dễ dùng và tiện ích , mong shop bổ sung thêm nhiều món đặc sản miền Trung hơnn.');

-- Trang chính sách (nội dung theo Kế hoạch kinh doanh, nhóm chỉnh lại nếu cần)
INSERT INTO pages (slug, title, content) VALUES
(N'chinh-sach-doi-tra', N'Chính sách đổi trả',
 N'<h2>Chính sách đổi trả</h2><ul><li>Hỗ trợ <b>1 đổi 1 trong vòng 48 giờ</b> kể từ khi nhận hàng nếu sản phẩm lỗi bao bì, móp vỡ, giao sai/thiếu sản phẩm hoặc chất lượng không đạt yêu cầu.</li><li>Khi phát sinh lỗi, vui lòng cung cấp hình ảnh hoặc video mở hộp làm bằng chứng, gửi qua mục Liên hệ.</li><li>Với hàng cần bảo quản mát/đông lạnh, vui lòng kiểm tra tình trạng sản phẩm ngay khi nhận hàng.</li><li>Không áp dụng đổi trả với sản phẩm đã mở và sử dụng do thay đổi sở thích cá nhân.</li></ul>'),
(N'chinh-sach-bao-hanh', N'Chính sách bảo hành',
 N'<h2>Cam kết chất lượng</h2><ul><li>Sản phẩm có nguồn gốc rõ ràng, nhãn mác và hạn sử dụng in trên bao bì.</li><li>Cam kết chất lượng đến hết hạn sử dụng khi bảo quản đúng hướng dẫn trên từng sản phẩm.</li><li>Hỗ trợ giải quyết khiếu nại về chất lượng sản phẩm qua hotline và email của cửa hàng.</li></ul>'),
(N'chinh-sach-van-chuyen', N'Chính sách vận chuyển',
 N'<h2>Chính sách vận chuyển</h2><ul><li>Giao hàng toàn quốc qua các đơn vị vận chuyển đối tác: SPX Express, GHTK, GHN, Viettel Post.</li><li>Nội thành TP.HCM và Hà Nội: 1-2 ngày; các tỉnh thành khác: 2-5 ngày.</li><li>Phí vận chuyển 25.000đ, miễn phí cho đơn từ 300.000đ.</li><li>Sản phẩm được đóng gói hút chân không, bọc xốp nổ chống sốc trong thùng carton; hàng cần bảo quản mát/đông lạnh được đóng kèm đá gel để giữ lạnh trong quá trình vận chuyển.</li><li></li></ul>'),
(N'chinh-sach-bao-mat', N'Chính sách bảo mật thông tin',
 N'<h2>Chính sách bảo mật thông tin</h2><ul><li>CenDeli chỉ thu thập thông tin cần thiết để xử lý đơn hàng và chăm sóc khách hàng (họ tên, số điện thoại, địa chỉ, email).</li><li>Thông tin được bảo vệ theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và không chia sẻ cho bên thứ ba ngoài đơn vị vận chuyển.</li><li>CenDeli chỉ gửi tin khuyến mãi khi khách hàng đồng ý, và khách có thể từ chối nhận bất cứ lúc nào.</li></ul>');
GO

-- Kiểm tra nhanh sau khi chạy xong
USE CenDeli;
SELECT id, name, price, old_price, discount_percent, storage_type, stock, sold_count FROM products;
SELECT * FROM v_low_stock;
SELECT * FROM v_kpi_summary;
