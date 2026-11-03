// DỮ LIỆU SẢN PHẨM CENDELI

const products = [
    // DANH MỤC 1: ĐỒ ĂN LIỀN, NHẤM NHÁP
    {
        id: 1,
        name: "Ghẹ Sữa Rim Me / Rim Cay",
        category: "Đồ ăn liền",
        image: "ghesuarimme.png",
        description: "Ghẹ sữa mềm giòn nguyên con, chiên giòn rụm rồi rim cùng sốt me chua ngọt hoặc sốt ớt cay nhẹ, giàu canxi.",
        usage: "Mở hũ ăn liền, dùng làm món nhắm bia hoặc ăn vặt khi xem phim.",
        storage: "3 tháng ở nhiệt độ thường (tránh ánh nắng), 6 tháng ở ngăn mát tủ lạnh.",
        originalPrice: 180000,
        salePrice: 153000
    },
    {
        id: 2,
        name: "Cá Thiều Que Tẩm Gia Vị",
        category: "Đồ ăn liền",
        image: "cathieuque.png",
        description: "Thịt cá thiều cán mỏng dạng sợi que dài, tẩm đường, nước mắm và tiêu đen. Sợi cá dẻo dai, thơm mặn ngọt.",
        specification: "Hũ PET 180g hoặc túi zip 200g.",
        usage: "Ăn trực tiếp. Sợi cá dẻo dai, thơm mặn ngọt và cay đậm đà.",
        storage: "6 tháng ở nhiệt độ thường (đóng kín nắp sau khi mở).",
        originalPrice: 95000,
        salePrice: 80750
    },
    {
        id: 3,
        name: "Bánh Tráng Xoài Dẻo",
        category: "Đồ ăn liền",
        image: "banhtrangxoai.png",
        description: "Nước cốt xoài chín cô đặc tráng mỏng phơi nắng. Vị chua ngọt tự nhiên, dẻo quánh, không chất bảo quản.",
        specification: "Túi zip 200g - 500g (gói riêng từng cuộn hoặc cuộn lớn).",
        usage: "Xé dải ăn trực tiếp, là món ăn vặt văn phòng được ưa chuộng.",
        storage: "6 - 9 tháng ở nhiệt độ thường (bảo quản nơi khô ráo).",
        originalPrice: 30000,
        salePrice: 25000,
        note: "Giá áp dụng cho túi 200g. Túi 500g: 55.000đ, khuyến mãi 50.000đ."
    },
    {
        id: 4,
        name: "Bánh Tráng Dừa Nướng",
        category: "Đồ ăn liền",
        image: "banhtrangduanuong.jpg",
        description: "Bánh tráng bột gạo trộn nước cốt dừa, cơm dừa nạo và mè đen. Nướng trên than hồng cho giòn rụm, béo ngậy.",
        specification: "10 cái.",
        usage: "Ăn trực tiếp hoặc bán kèm tệp khách mua Tré Bó Rơm để bẻ vụn trộn chung hoặc xúc tré.",
        storage: "2 - 3 tháng ở nhiệt độ thường (cần túi zip kín để tránh bị thiu hoặc mềm bánh).",
        originalPrice: 60000,
        salePrice: 55000
    },
    {
        id: 5,
        name: "Mực Xé Sợi Hấp Bơ Tỏi",
        category: "Đồ ăn liền",
        image: "mucxesoi.png",
        description: "Mực khô xé sợi dẻo mềm được đảo qua bơ lạt và tỏi sấy. Vị mặn ngọt vừa phải, béo ngậy, cay nhẹ.",
        specification: "Hũ PET 180g (màng seal nhôm).",
        usage: "Mở nắp ăn trực tiếp.",
        storage: "3 - 4 tháng ở nhiệt độ thường (tránh ánh nắng), 6 tháng trong ngăn mát tủ lạnh.",
        originalPrice: 150000,
        salePrice: 127500
    },
    {
        id: 6,
        name: "Khô Cá Mai Chanh Tuyết",
        category: "Đồ ăn liền",
        image: "khocamai.jpg",
        description: "Cá mai biển ép miếng mỏng, tẩm đường, ớt và mè rang. Miếng cá giòn rụm, ngọt thịt, thơm béo vị mè.",
        specification: "Hũ PET 180g hoặc túi zip 200g.",
        usage: "Ăn trực tiếp như món snack hoặc làm đồ nhắm.",
        storage: "6 tháng ở nhiệt độ thường (đóng kín nắp hoặc túi sau khi mở).",
        originalPrice: 115000,
        salePrice: 97750
    },
    {
        id: 7,
        name: "Bánh Tráng Mắm Ruốc",
        category: "Đồ ăn liền",
        image: "banhtrangmamruoc.jpg",
        description: "Bánh tráng mè được quết mắm ruốc, kết hợp mỡ hành, trứng, hành phi và ruốc tép, nướng giòn trên bếp than.",
        specification: "Túi zip 5 - 10 cái (đã nướng chín sẵn, cuộn tròn hoặc gấp tam giác).",
        usage: "Mở bao bì ăn trực tiếp như món snack ăn vặt; hoặc quay nhanh trong lò vi sóng hoặc nồi chiên không dầu khoảng 15 - 30 giây để bánh nóng giòn.",
        storage: "1 - 2 tháng ở nhiệt độ thường (cần kéo kín túi zip sau khi mở để giữ độ giòn tan của bánh).",
        originalPrice: 70000,
        salePrice: 65000
    },

    // DANH MỤC 2: THỊT & ĐỒ LÊN MEN TRUYỀN THỐNG
    {
        id: 8,
        name: "Chả Cá Quy Nhơn",
        category: "Thịt và đồ lên men truyền thống",
        image: "chaca.jpg",
        description: "Làm từ thịt cá biển tươi như cá thu, cá mối, cá nhồng, quết dai tự nhiên. Sản phẩm có loại chiên và hấp.",
        specification: "Khay 500g (bánh tròn hoặc thanh), đóng túi hút chân không.",
        usage: "Đồ đã chín sẵn. Cần rã đông, chiên sơ lại 3 - 5 phút cho nóng giòn để ăn cơm, làm bún, bánh canh chả cá hoặc cắt lát làm món nhắm.",
        storage: "7 - 10 ngày trong ngăn mát; 6 tháng trong ngăn đông.",
        originalPrice: 120000,
        salePrice: 102000
    },
    {
        id: 9,
        name: "Nem Chua Huế Gói Lá Chuối",
        category: "Thịt và đồ lên men truyền thống",
        image: "nemchua.png",
        description: "Nem nạc heo kết hợp bì, tỏi lát, tiêu hạt và ớt tươi. Vị chua đậm, thơm nức mùi tỏi ớt.",
        specification: "Túi hút chân không 10 chiếc/túi (200g).",
        usage: "Bóc vỏ ăn trực tiếp khi nem đã đủ độ chua, dùng làm món nhắm hoặc nguyên liệu trộn tré.",
        storage: "7 ngày ở nhiệt độ thường (mùa mát); 20 - 30 ngày trong ngăn mát tủ lạnh.",    
        originalPrice: 90000,
        salePrice: 76500
    },
    {
        id: 10,
        name: "Bò Một Nắng Muối Kiến Vàng",
        category: "Thịt và đồ lên men truyền thống",
        image: "bomotnang.png",
        description: "Thịt bò thăn hoặc đùi tươi tẩm ướp gia vị, phơi một nắng cho bên ngoài săn nhưng bên trong vẫn mềm.",
        specification: "Túi 250g hút chân không (kèm hũ muối kiến vàng).",
        usage: "Bắt buộc chế biến nhiệt: áp chảo hoặc nướng trên than, nồi chiên không dầu khoảng 5 - 7 phút mỗi mặt, xé sợi chấm muối kiến vàng béo chua độc lạ.",
        storage: "1 tháng trong ngăn đá tủ lạnh.",
        originalPrice: 115000,
        salePrice: 97750
    },
    {
        id: 11,
        name: "Bắp Bò Ngâm Mắm Nhĩ",
        category: "Thịt và đồ lên men truyền thống",
        image: "bapbongam.jpg",
        description: "Bắp bò hoa luộc chín cùng thảo mộc, ngâm nước mắm nhĩ pha đường thốt nốt, tỏi, ớt và tiêu xanh.",
        specification: "Hũ thủy tinh hoặc hũ PET 500g (gồm bắp bò hoa và nước mắm ngâm).",
        usage: "Vớt bắp bò ra cắt lát mỏng ăn liền, cuốn bánh tráng rau sống hoặc làm đồ nhắm.",
        storage: "15 - 20 ngày trong ngăn mát tủ lạnh.",
        originalPrice: 125000,
        salePrice: 106250
    },
    {
        id: 12,
        name: "Chả Ốc Nướng Giấy Bạc",
        category: "Thịt và đồ lên men truyền thống",
        image: "chaocnuong.jpg",
        description: "Giò sống quết mịn trộn thịt ốc bươu, sả băm, tiêu hạt và lá lốt thơm lừng.",
        specification: "Đòn 500g bọc giấy bạc hút chân không (đông lạnh).",
        usage: "Cần chế biến nhiệt: rã đông, hấp hoặc nướng nguyên bọc giấy bạc (nồi chiên không dầu hoặc lò nướng) khoảng 10 - 15 phút cho thơm phức rồi cắt lát ăn nóng.",
        storage: "10 ngày trong ngăn mát, 3 tháng trong ngăn đông.",
        originalPrice: 130000,
        salePrice: 110500
    },

    // DANH MỤC 3: HẢI SẢN KHÔ & MẮM VÙNG MIỀN
    {
        id: 13,
        name: "Mắm Nêm Pha Sẵn Chuẩn Vị Xứ Quảng",
        category: "Hải sản khô và mắm vùng miền",
        image: "mamnem.png",
        description: "Mắm cá cơm nguyên chất lên men, pha cùng dứa băm nhỏ, tỏi, ớt và đường thốt nốt.",
        specification: "Chai nhựa hoặc thủy tinh 250ml.",
        usage: "Mở nắp dùng ngay (chấm thịt luộc, bánh tráng cuốn, bún mắm nêm).",
        storage: "6 tháng ở nhiệt độ thường (để ngăn mát sẽ giữ màu mắm tươi lâu hơn).",
        originalPrice: 30000,
        salePrice: 25000
    },
    {
        id: 14,
        name: "Cá Đéc / Cá Khoai Rim Cay Ngọt",
        category: "Hải sản khô và mắm vùng miền",
        image: "cakhoairim.jpg",
        description: "Cá đéc biển xẻ phơi khô, rim cùng nước mắm, ớt và tỏi. Thịt cá xốp ngọt, xương mềm.",
        specification: "Hũ PET 250g.",
        usage: "Ăn trực tiếp với cơm nóng, cháo trắng hoặc dùng làm món nhắm.",
        storage: "4 - 6 tháng ở nhiệt độ thường.",
        originalPrice: 90000,
        salePrice: 76500
    },
    {
        id: 15,
        name: "Mực Một Nắng / Mực Khô Câu",
        category: "Hải sản khô và mắm vùng miền",
        image: "mucmotnang.png",
        description: "Mực ống câu bãi biển phơi qua nắng, thân dày, thịt ngọt lịm, còn nguyên lớp phấn trắng.",
        specification: "Túi 500g (3 - 6 con/kg) hút chân không.",
        usage: "Chế biến trước khi ăn: nướng cồn, nướng than, làm mực chiên mắm hoặc mực xào cần tây.",
        storage: "Mực khô để được 6 tháng ở ngăn đông; mực một nắng bảo quản ngăn đông 3 - 6 tháng.",
        originalPrice: 110000,
        salePrice: 93500
    },
    {
        id: 16,
        name: "Mắm Dưa Cà Pháo Xứ Quảng",
        category: "Hải sản khô và mắm vùng miền",
        image: "mamduaca.jpg",
        description: "Dưa leo giòn, cà pháo và đu đủ tươi muối giòn rồi trộn cùng mắm nêm cá cơm, tỏi và ớt.",
        specification: "Hũ PET 500g.",
        usage: "Mở nắp gắp ra ăn trực tiếp với cơm nóng, thịt luộc hoặc bún tươi.",
        storage: "1 - 2 tháng trong ngăn mát tủ lạnh (giữ độ giòn của dưa cà).",
        originalPrice: 90000,
        salePrice: 76500
    },
    {
        id: 17,
        name: "Cá Nục Một Nắng Rim Tiêu Xanh",
        category: "Hải sản khô và mắm vùng miền",
        image: "canucmotnang.jpg",
        description: "Cá nục biển tươi phơi một nắng cho săn thịt, kho rim với nước mắm, ớt hiểm và tiêu xanh.",
        specification: "Khay 250g - 300g (chế biến sẵn).",
        usage: "Mở hũ ăn ngay với cơm nóng hoặc cháo trắng, hoặc quay nóng lại 1 phút bằng lò vi sóng.",
        storage: "3 tháng ở nhiệt độ thường, 6 tháng trong ngăn mát.",
        originalPrice: 60000,
        salePrice: 55000
    },
    {
        id: 18,
        name: "Khô Cá Đuối Đen Tẩm Gia Vị",
        category: "Hải sản khô và mắm vùng miền",
        image: "khocaduoiden.jpg",
        description: "Thịt cá đuối đen tươi xẻ mỏng, tẩm nước mắm, ớt và tỏi rồi phơi khô. Thịt cá dẻo, ngọt tự nhiên.",
        specification: "Túi zip 200g hút chân không.",
        usage: "Cần chế biến nhiệt: nướng than, nướng cồn hoặc chiên giòn, đập dập xé sợi chấm mắm me hoặc tương ớt.",
        storage: "6 tháng ở nhiệt độ thường (nơi khô ráo) hoặc bảo quản ngăn đông.",
        originalPrice: 200000,
        salePrice: 170000
    }
];

// HÀM ĐỊNH DẠNG GIÁ TIỀN

function formatPrice(price) {
    return price.toLocaleString("vi-VN") + "đ";
}

// HIỂN THỊ DANH SÁCH SẢN PHẨM


function renderProducts() {
    const container = document.getElementById("product-list");

    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");

    const categoryMap = {
    "1": "Đồ ăn liền",
    "2": "Thịt và đồ lên men truyền thống",
    "3": "Hải sản khô và mắm vùng miền"
};

const filteredProducts = category
    ? products.filter(product => product.category === categoryMap[category])
    : products;

    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <a href="chi-tiet-san-pham.html?id=${product.id}"
               class="product-image-link">

                ${
                    product.image
                    ? `<img src="${product.image}"
                           alt="${product.name}"
                           class="product-image"
                           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div class="image-placeholder" style="display:none">
                           <span>CenDeli</span>
                       </div>`
                    : `<div class="image-placeholder">
                           <span>CenDeli</span>
                       </div>`
                }

                <span class="sale-label">Khuyến mãi</span>
            </a>

            <div class="product-info">
                <span class="product-category">${product.category}</span>

                <h3 class="product-name">${product.name}</h3>

                <p class="product-description">${product.description}</p>

                <div class="product-prices">
                    <span class="original-price">
                        ${formatPrice(product.originalPrice)}
                    </span>

                    <span class="sale-price">
                        ${formatPrice(product.salePrice)}
                    </span>
                </div>

                <a href="chi-tiet-san-pham.html?id=${product.id}"
                   class="detail-button">
                    Xem chi tiết
                </a>

                <button class="add-cart-button"
                        onclick="addToCart(${product.id})">
                    🛒 Thêm vào giỏ hàng
                </button>
            </div>
        </div>
    `).join("");
}

// HIỂN THỊ CHI TIẾT SẢN PHẨM

function renderProductDetail() {
    const container = document.getElementById("product-detail");

    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get("id"));

    const product = products.find(item => item.id === productId);

    if (!product) {
        container.innerHTML = `
            <div class="not-found">
                <h2>Không tìm thấy sản phẩm!</h2>
                <a href="san-pham.html">Quay lại danh sách</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="detail-image">
            ${
                product.image
                ? `<img src="${product.image}" alt="${product.name}"
                    onerror="this.style.display='none';
                    this.nextElementSibling.style.display='flex';">
                   <div class="image-placeholder" style="display:none">
                       CenDeli
                   </div>`
                : `<div class="image-placeholder">CenDeli</div>`
            }
        </div>

        <div class="detail-info">

            <span class="product-category">
                ${product.category}
            </span>

            <h1>${product.name}</h1>

            <p class="detail-origin">
                Xuất xứ: ${product.origin || "Đặc sản Việt Nam"}
            </p>

            <div class="detail-prices">
                <span class="original-price">
                    ${formatPrice(product.originalPrice)}
                </span>

                <span class="sale-price">
                    ${formatPrice(product.salePrice)}
                </span>
            </div>

            <div class="detail-description">
                <h3>Mô tả sản phẩm</h3>
                <p>${product.description}</p>

                <h3>Thông tin sản phẩm</h3>

                <p>
                    <strong>Quy cách:</strong>
                    ${product.specification || "Đang cập nhật"}
                </p>

                <p>
                    <strong>Cách chế biến / sử dụng:</strong>
                    ${product.usage || "Đang cập nhật"}
                </p>

                <p>
                    <strong>Thời gian bảo quản:</strong>
                    ${product.storage || "Đang cập nhật"}
                </p>
            </div>

            <button
                class="add-cart-button detail-cart-button"
                onclick="addToCart(${product.id})">
                🛒 Thêm vào giỏ hàng
            </button>
            <a href="san-pham.html" class="detail-button">
                Quay lại danh sách sản phẩm
            </a>

        </div>
    `;
}

// ==========================================
// GIỎ HÀNG CENDELI
// ==========================================

// Lấy giỏ hàng từ localStorage
function getCart() {
    return JSON.parse(localStorage.getItem("cendeliCart")) || [];
}


// Lưu giỏ hàng
function saveCart(cart) {
    localStorage.setItem("cendeliCart", JSON.stringify(cart));
    updateCartCount();
}


// Cập nhật số lượng trên menu
function updateCartCount() {
    const cartCount = document.getElementById("cartCount");
    if (!cartCount) return;

    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);

    cartCount.textContent = total;
}

// Thêm sản phẩm vào giỏ hàng
function addToCart(productId) {

    const product = products.find(
        item => item.id === Number(productId)
    );

    if (!product) {
        alert("Không tìm thấy sản phẩm!");
        return;
    }

    const cart = getCart();

    const existingProduct = cart.find(
        item => item.id === product.id
    );

    if (existingProduct) {

        existingProduct.quantity++;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            image: product.image,
            price: product.salePrice,
            quantity: 1
        });

    }

    saveCart(cart);

    alert("Đã thêm " + product.name + " vào giỏ hàng!");
}


// KHỞI CHẠY
document.addEventListener("DOMContentLoaded", function () {
    renderProducts();
    renderProductDetail();
    updateCartCount();
});