document.addEventListener("DOMContentLoaded", function () {
  // ================= MENU ĐIỆN THOẠI =================
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function () {
      const isOpen = mainNav.classList.toggle("show");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Bấm một mục menu thì đóng menu trên điện thoại
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("show");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ================= BANNER CHUYỂN ẢNH =================
  // Tự đổi ảnh mỗi 5 giây. Ảnh nào chưa có file thì bị bỏ qua.
  const dots = document.querySelectorAll("#heroDots .dot");
  let currentSlide = 0;

  function goToSlide(index) {
    const slides = document.querySelectorAll(".hero-slide");
    if (slides.length === 0) {
      return;
    }

    currentSlide = (index + slides.length) % slides.length;

    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === currentSlide);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("active", i === currentSlide);
    });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      goToSlide(i);
    });
  });

  setInterval(function () {
    if (document.querySelectorAll(".hero-slide").length > 1) {
      goToSlide(currentSlide + 1);
    }
  }, 5000);

  // ================= DỮ LIỆU SẢN PHẨM NỔI BẬT =================
  // Dữ liệu lấy từ file CenDeli_sqlserver.sql (các sản phẩm có is_featured = 1).
  // price = giá bán (đã giảm), oldPrice = giá gốc.
  // Khi làm backend: thay mảng này bằng dữ liệu gọi từ API / database.
  //
  // ẢNH SẢN PHẨM: trường image là đường dẫn tới file trong thư mục image/
  //   (từ index.html đi lên 1 cấp: ../image/tenfile.png).
  //   Sản phẩm nào chưa có file ảnh thì tự hiện khung màu "ẢNH SẢN PHẨM".
  //   Muốn hiện ảnh: bỏ file vào thư mục image/ với ĐÚNG tên đã ghi ở trường image.

  const featuredProducts = [
    {
      id: 1,
      image: "ghesuarimme.png",
      name: "Ghẹ Sữa Rim Me / Rim Cay",
      category: "Đồ ăn liền, nhấm nháp",
      price: 153000,
      oldPrice: 180000,
    },
    {
      id: 2,
      image: "cathieuque.png",
      name: "Cá Thiều Que Tẩm Gia Vị",
      category: "Đồ ăn liền, nhấm nháp",
      price: 80750,
      oldPrice: 95000,
    },
    {
      id: 3,
      image: "banhtrangxoai.png",
      name: "Bánh Tráng Xoài Dẻo (Túi 200g)",
      category: "Đồ ăn liền, nhấm nháp",
      price: 25000,
      oldPrice: 30000,
    },
    {
      id: 6,
      image: "mucxesoi.png",
      name: "Mực Xé Sợi Hấp Bơ Tỏi",
      category: "Đồ ăn liền, nhấm nháp",
      price: 127500,
      oldPrice: 150000,
    },
    // 4 sản phẩm dưới chưa có ảnh: thêm file vào thư mục image/ đúng tên bên dưới là tự hiện
    {
      id: 10,
      image: "nemchua.png",
      name: "Nem Chua Huế Gói Lá Chuối",
      category: "Thịt & đồ lên men truyền thống",
      price: 76500,
      oldPrice: 90000,
    },
    {
      id: 11,
      image: "bomotnang.png",
      name: "Bò Một Nắng Muối Kiến Vàng",
      category: "Thịt & đồ lên men truyền thống",
      price: 97750,
      oldPrice: 115000,
    },
    {
      id: 14,
      image: "mamnem.png",
      name: "Mắm Nêm Pha Sẵn Chuẩn Vị Xứ Quảng",
      category: "Hải sản khô & mắm vùng miền",
      price: 25000,
      oldPrice: 30000,
    },
    {
      id: 16,
      image: "mucmotnang.png",
      name: "Mực Một Nắng / Mực Khô Câu",
      category: "Hải sản khô & mắm vùng miền",
      price: 93500,
      oldPrice: 110000,
    },
  ];

  function formatPrice(value) {
    return value.toLocaleString("vi-VN") + "đ";
  }

  // ================= HIỂN THỊ SẢN PHẨM =================
  const productContainer = document.getElementById("featuredProducts");

  if (productContainer) {
    productContainer.innerHTML = featuredProducts
      .map(function (product) {
        const percent = Math.round(
          ((product.oldPrice - product.price) * 100) / product.oldPrice,
        );

        return `
                <a class="product-card" href="chi-tiet-san-pham.html?id=${product.id}">
                    <div class="image-box product-image">
                        <span>ẢNH SẢN PHẨM</span>
 
                        <!-- ẢNH THẬT: ${product.image}
                             Chưa có file thì ảnh tự ẩn, hiện khung màu "ẢNH SẢN PHẨM" -->
                        <img src="${product.image}"
                             alt="${product.name}"
                             onerror="this.remove()">
 
                        <span class="discount-badge">-${percent}%</span>
                    </div>
 
                    <div class="product-info">
                        <span class="product-category">${product.category}</span>
                        <h3>${product.name}</h3>
                        <p class="product-price">
                            <span class="price-new">${formatPrice(product.price)}</span>
                            <span class="price-old">${formatPrice(product.oldPrice)}</span>
                        </p>
                    </div>
                </a>
            `;
      })
      .join("");
  }

  // ================= GIỎ HÀNG DEMO =================
  // Chỉ lưu số lượng trên trình duyệt (localStorage), chưa phải giỏ hàng thật.
  const cartCountElement = document.getElementById("cartCount");

  function getCartCount() {
    try {
      const count = Number(localStorage.getItem("cendeli_cart_count"));
      return Number.isFinite(count) && count >= 0 ? count : 0;
    } catch (error) {
      return 0;
    }
  }

  if (cartCountElement) {
    cartCountElement.textContent = getCartCount();
  }

  // ================= CHÍNH SÁCH: TỰ MỞ ĐÚNG MỤC =================
  // Bấm "Chính sách đổi trả", "Vận chuyển & đóng gói"... ở footer
  // thì cuộn tới và tự mở đúng mục trong khu vực Chính sách.
  function openPolicyItem(id) {
    const target = document.getElementById(id);
    if (target && target.classList.contains("policy-item")) {
      target.setAttribute("open", "");
    }
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (link) {
      openPolicyItem(link.getAttribute("href").slice(1));
    }
  });

  // Mở trang với đường dẫn dạng index.html#doi-tra thì cũng tự mở
  openPolicyItem(window.location.hash.slice(1));

  // ================= MENU ĐANG ĐƯỢC CHỌN =================
  // Bấm vào mục menu dạng #neo trong trang thì mục đó sáng lên.
  const navLinks = document.querySelectorAll(
    ".main-nav > .nav-link, .main-nav > .nav-item > .nav-link",
  );

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      const href = link.getAttribute("href") || "";
      if (href.charAt(0) !== "#" && href !== "index.html") {
        return;
      }

      navLinks.forEach(function (item) {
        item.classList.remove("active");
      });
      link.classList.add("active");
    });
  });
});
