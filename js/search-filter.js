(function () {
  "use strict";
  if (typeof products === "undefined" || !Array.isArray(products)) {
    console.warn(
      "search-filter.js: không thấy mảng `products`. Kiểm tra thứ tự thẻ <script>.",
    );
    return;
  }
  const PRICE_RANGES = {
    "under-50": { min: 0, max: 50000 },
    "50-100": { min: 50000, max: 100000 },
    "100-150": { min: 100000, max: 150000 },
    "over-150": { min: 150000, max: Infinity },
  };

  const CATEGORY_BY_URL = {
    1: "Đồ ăn liền",
    2: "Thịt và đồ lên men truyền thống",
    3: "Hải sản khô và mắm vùng miền",
  };
  const DEBOUNCE_MS = 200;
  const listEl = document.getElementById("product-list");
  const searchEl = document.getElementById("sf-search");
  const clearEl = document.getElementById("sf-search-clear");
  const searchBtnEl = document.getElementById("sf-search-btn");

  const categoryEl = document.getElementById("sf-category");
  const priceEl = document.getElementById("sf-price");
  const sortEl = document.getElementById("sf-sort");
  const resetEl = document.getElementById("sf-reset");
  const countEl = document.getElementById("sf-result-count");

  if (!listEl || !searchEl || !categoryEl || !priceEl || !sortEl) return;

  function normalize(text) {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .trim();
  }
  // Lấy giá trị của nút đang được chọn trong một nhóm
  function getValue(group) {
    const active = group.querySelector(".is-active");
    return active ? active.getAttribute("data-value") : "";
  }
  // Chọn nút có data-value tương ứng trong một nhóm
  function setValue(group, value) {
    group.querySelectorAll("[data-value]").forEach(function (btn) {
      const on = btn.getAttribute("data-value") === value;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }
  // Chữ thường và gộp dấu về dạng chuẩn để so sánh CÓ DẤU
  function lowerWithAccent(text) {
    return String(text).toLowerCase().normalize("NFC");
  }
  // Từ khóa có chứa dấu tiếng Việt không? ("cá" có, "ca" không)
  function hasAccent(text) {
    return /[\u0300-\u036f]|đ/.test(
      String(text).toLowerCase().normalize("NFD"),
    );
  }
  // Tách tên / từ khóa thành các từ (bỏ khoảng trắng, dấu / , . & ( ) -)
  function splitWords(text) {
    return text.split(/[\s\/,.&()\-]+/).filter(function (w) {
      return w !== "";
    });
  }

  function nameMatches(name, rawKeyword) {
    const tokens = splitWords(rawKeyword.trim());
    if (tokens.length === 0) return true;

    const wordsPlain = splitWords(normalize(name));
    const wordsAccent = splitWords(lowerWithAccent(name));

    return tokens.every(function (token) {
      if (hasAccent(token)) {
        const t = lowerWithAccent(token);
        return wordsAccent.some(function (w) {
          return w.indexOf(t) === 0;
        });
      }
      const t = normalize(token);
      return wordsPlain.some(function (w) {
        return w.indexOf(t) === 0;
      });
    });
  }

  // Dùng lại formatPrice của products
  function money(value) {
    if (typeof formatPrice === "function") return formatPrice(value);
    return value.toLocaleString("vi-VN") + "đ";
  }
  // LỌC VÀ SẮP XẾP
  function getFilteredProducts() {
    const keyword = searchEl.value;
    const category = getValue(categoryEl);
    const range = PRICE_RANGES[getValue(priceEl)];
    const sort = getValue(sortEl);

    const result = products.filter(function (product) {
      // 1. Tên khớp từ khóa
      if (keyword.trim() && !nameMatches(product.name, keyword)) {
        return false;
      }
      // 2. Đúng danh mục
      if (category && product.category !== category) {
        return false;
      }
      // 3. Nằm trong khoảng giá (min <= giá < max)
      if (
        range &&
        (product.salePrice < range.min || product.salePrice >= range.max)
      ) {
        return false;
      }
      return true;
    });

    // 4. Sắp xếp.
    if (sort === "price-asc") {
      result.sort(function (a, b) {
        return a.salePrice - b.salePrice;
      });
    } else if (sort === "price-desc") {
      result.sort(function (a, b) {
        return b.salePrice - a.salePrice;
      });
    }

    return result;
  }

  // VẼ DANH SÁCH
  function cardHTML(product) {
    const imageBlock = product.image
      ? `<img src="${product.image}"
                    alt="${product.name}"
                    class="product-image"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="image-placeholder" style="display:none">
                   <span>CenDeli</span>
               </div>`
      : `<div class="image-placeholder">
                   <span>CenDeli</span>
               </div>`;

    return `
        <div class="product-card">
            <a href="chi-tiet-san-pham.html?id=${product.id}" class="product-image-link">
                ${imageBlock}
                <span class="sale-label">Khuyến mãi</span>
            </a>

            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>

                <div class="product-prices">
                    <span class="original-price">${money(product.originalPrice)}</span>
                    <span class="sale-price">${money(product.salePrice)}</span>
                </div>

                <a href="chi-tiet-san-pham.html?id=${product.id}" class="detail-button">
                    Xem chi tiết
                </a>

                <button class="add-cart-button" onclick="addToCart(${product.id})">
                    🛒 Thêm vào giỏ hàng
                </button>
            </div>
        </div>`;
  }

  function emptyHTML() {
    return `
        <div class="sf-empty">
            <h3>Không tìm thấy sản phẩm phù hợp</h3>
            <p>Thử đổi từ khóa, khoảng giá hoặc danh mục khác nhé.</p>
            <button type="button" id="sf-empty-reset">Xóa bộ lọc</button>
        </div>`;
  }

  function update() {
    const list = getFilteredProducts();

    listEl.innerHTML = list.length ? list.map(cardHTML).join("") : emptyHTML();

    if (countEl) {
      countEl.innerHTML = list.length
        ? `Hiển thị <strong>${list.length}</strong> / ${products.length} sản phẩm`
        : "Không có sản phẩm nào";
    }

    if (clearEl) clearEl.classList.toggle("is-visible", searchEl.value !== "");

    if (resetEl) {
      resetEl.hidden = !(
        searchEl.value !== "" ||
        getValue(categoryEl) !== "" ||
        getValue(priceEl) !== "" ||
        getValue(sortEl) !== "default"
      );
    }
  }
  function resetAll() {
    searchEl.value = "";
    setValue(categoryEl, "");
    setValue(priceEl, "");
    setValue(sortEl, "default");
    update();
    searchEl.focus();
  }

  // CUỘN XUỐNG KẾT QUẢ SAU KHI BẤM "TÌM KIẾM" / ENTER
  function scrollToResults() {
    const listTop = listEl.getBoundingClientRect().top;
    if (listTop <= window.innerHeight * 0.55) return;

    const target = (countEl && countEl.closest(".sf-footer")) || listEl;
    const header = document.querySelector(".page-header");
    const headerHeight = header ? header.offsetHeight : 0;
    const top =
      target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }
  // NÚT MŨI TÊN LÊN ĐẦU TRANG
  function initBackToTop() {
    const SHOW_AFTER = 400;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sf-to-top";
    btn.setAttribute("aria-label", "Lên đầu trang");
    btn.title = "Lên đầu trang";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 19V5M12 5l-6 6M12 5l6 6"></path></svg>';
    document.body.appendChild(btn);

    let waiting = false;
    function toggle() {
      btn.classList.toggle("is-visible", window.scrollY > SHOW_AFTER);
      waiting = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!waiting) {
          waiting = true;
          window.requestAnimationFrame(toggle);
        }
      },
      { passive: true },
    );

    btn.addEventListener("click", function () {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    toggle();
  }

  // GẮN SỰ KIỆN
  function init() {
    const urlCategory = new URLSearchParams(window.location.search).get(
      "category",
    );
    if (urlCategory && CATEGORY_BY_URL[urlCategory]) {
      setValue(categoryEl, CATEGORY_BY_URL[urlCategory]);
    }

    let timer = null;
    searchEl.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(update, DEBOUNCE_MS);
    });
    searchEl.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        clearTimeout(timer);
        update();
        scrollToResults();
      }
    });

    [categoryEl, priceEl, sortEl].forEach(function (group) {
      group.addEventListener("click", function (event) {
        const btn = event.target.closest("[data-value]");
        if (!btn || !group.contains(btn)) return;
        setValue(group, btn.getAttribute("data-value"));
        update();
      });
    });

    if (searchBtnEl) {
      searchBtnEl.addEventListener("click", function () {
        clearTimeout(timer);
        update();
        scrollToResults();
      });
    }

    if (clearEl) {
      clearEl.addEventListener("click", function () {
        searchEl.value = "";
        update();
        searchEl.focus();
      });
    }
    if (resetEl) resetEl.addEventListener("click", resetAll);

    // Nút "Xóa bộ lọc" trong khung "không tìm thấy"
    listEl.addEventListener("click", function (event) {
      if (event.target.id === "sf-empty-reset") resetAll();
    });

    initBackToTop();

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
