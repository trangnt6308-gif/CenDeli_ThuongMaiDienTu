(function () {
  /* ---------- Khóa localStorage ---------- */
  const CART_KEY = "cendeliCart"; // trùng với js/products.js (nút "Thêm vào giỏ hàng")
  const ORDERS_KEY = "cendeli_orders"; // trùng với js/auth.js
  const ADDR_KEY = "cendeli_addresses"; // trùng với js/auth.js

  /* ---------- Quy tắc tính tiền (khớp bảng settings trong DB_CenDeli.sql) ---------- */
  const RULES = {
    shipFee: 25000, // shipping_fee
    freeShip: 300000, // free_ship_threshold: tiền hàng TỪ mức này thì miễn phí ship
    discountOver: 300000, // order_discount_threshold: đơn TRÊN mức này được giảm
    discountAmount: 15000, // order_discount_amount
    maxQty: 99, // tối đa mỗi sản phẩm / đơn
  };

  /* TODO: đổi thành tài khoản ngân hàng thật của nhóm trước khi nộp bài */
  const BANK = {
    name: "Vietcombank — Chi nhánh TP.HCM",
    account: "0123456789",
    holder: "CENDELI",
  };
  const QR_IMAGE = "qr-momo.png"; // ảnh mã QR MoMo/ZaloPay của shop, đặt ở thư mục gốc (cạnh index.html)

  const PAY = {
    cod: "Thanh toán khi nhận hàng (COD)",
    bank_transfer: "Chuyển khoản ngân hàng",
    ewallet: "Ví điện tử MoMo / ZaloPay",
  };
  const PHONE = /^(0|\+84)\d{9,10}$/,
    EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- Hàm tiện ích ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const get = (k, d) => {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  };
  const set = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      return false;
    }
  };
  const money = (n) => Number(n).toLocaleString("vi-VN") + "đ";
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const user = () =>
    window.CenDeliAuth ? window.CenDeliAuth.currentUser() : null;

  let toastTimer;
  function toast(text) {
    let t = $(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* =====================================================================
     1. DỮ LIỆU GIỎ HÀNG
     ===================================================================== */
  function readCart() {
    let raw = get(CART_KEY, []);
    if (!Array.isArray(raw)) raw = [];
    const catalog = typeof products !== "undefined" ? products : null;
    const out = [];
    raw.forEach((it) => {
      const id = Number(it && it.id);
      let qty = Math.floor(Number(it && it.quantity));
      if (!id || !(qty > 0)) return;
      qty = Math.min(qty, RULES.maxQty);
      const p = catalog ? catalog.find((x) => x.id === id) : null;
      if (catalog && !p) return; // sản phẩm đã bị gỡ
      const name = p ? p.name : String(it.name || "");
      const price = p ? p.salePrice : Number(it.price);
      if (!name || !(price >= 0)) return;
      const same = out.find((x) => x.id === id);
      if (same) {
        same.quantity = Math.min(same.quantity + qty, RULES.maxQty);
        return;
      }
      out.push({
        id,
        name,
        image: p ? p.image : it.image,
        price,
        quantity: qty,
      });
    });
    if (JSON.stringify(out) !== JSON.stringify(raw)) set(CART_KEY, out);
    return out;
  }

  function writeCart(cart) {
    set(CART_KEY, cart);
    updateBadge();
  }

  function updateBadge() {
    const el = $("#cartCount");
    if (el)
      el.textContent = get(CART_KEY, []).reduce(
        (t, i) => t + (Number(i.quantity) || 0),
        0,
      );
  }

  function setQty(id, qty) {
    const cart = readCart(),
      it = cart.find((x) => x.id === id);
    if (!it) return;
    if (qty > RULES.maxQty) {
      qty = RULES.maxQty;
      toast("Mỗi sản phẩm tối đa " + RULES.maxQty + " cái");
    }
    if (!(qty >= 1)) qty = 1;
    it.quantity = qty;
    writeCart(cart);
  }
  function removeItem(id) {
    writeCart(readCart().filter((x) => x.id !== id));
  }
  function clearCart() {
    writeCart([]);
  }

  const subtotalOf = (cart) =>
    cart.reduce((t, i) => t + i.price * i.quantity, 0);

  /* Tính tiền: total = subtotal - discount + shipping (giống fn_CalcTotals trong SQL) */
  function totals(subtotal) {
    const discount = subtotal >= RULES.discountOver ? RULES.discountAmount : 0;
    const shipping =
      subtotal === 0 || subtotal >= RULES.freeShip ? 0 : RULES.shipFee;
    return {
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
    };
  }

  /* ---------- HTML dùng chung ---------- */
  const thumb = (name, image) =>
    `<span class="ci-img"><b>${esc(String(name).trim().charAt(0))}</b>${image ? `<img src="${esc(image)}" alt="" onerror="this.remove()">` : ""}</span>`;

  const sumRows = (t) => `
    <div class="sum-row"><span>Tạm tính</span><b>${money(t.subtotal)}</b></div>
    ${t.discount ? `<div class="sum-row disc"><span>Giảm giá đơn trên ${money(RULES.discountOver)}</span><b>-${money(t.discount)}</b></div>` : ""}
    <div class="sum-row"><span>Phí vận chuyển</span><b>${t.shipping ? money(t.shipping) : "Miễn phí"}</b></div>
    <div class="sum-row grand"><span>Tổng cộng</span><b>${money(t.total)}</b></div>`;

  function hint(t) {
    if (t.subtotal <= RULES.discountOver)
      return `<div class="sum-hint">Mua thêm ít nhất <b>${money(RULES.discountOver - t.subtotal + 1)}</b> để được giảm <b>${money(RULES.discountAmount)}</b>.</div>`;
    if (t.subtotal < RULES.freeShip)
      return `<div class="sum-hint">Mua thêm <b>${money(RULES.freeShip - t.subtotal)}</b> để được <b>miễn phí vận chuyển</b>.</div>`;
    return `<div class="sum-hint">Bạn đã được <b>giảm giá</b> và <b>miễn phí vận chuyển</b> 🎉</div>`;
  }
  /* Khung thông tin chuyển khoản (dùng ở trang đặt hàng và trang thành công) */
  const bankBox = (code, amount) => `
      <div class="bank-box">
        <p><span>Ngân hàng</span><b>${esc(BANK.name)}</b></p>
        <p><span>Số tài khoản</span><b>${esc(BANK.account)}</b></p>
        <p><span>Chủ tài khoản</span><b>${esc(BANK.holder)}</b></p>
        ${amount ? `<p><span>Số tiền</span><b>${money(amount)}</b></p>` : ""}
        <p><span>Nội dung CK</span><b>${code ? esc(code) : "Mã đơn hàng (hiện sau khi bạn nhấn “Đặt hàng”)"}</b></p>
      </div>`;

  /* =====================================================================
     2. TRANG GIỎ HÀNG  (gio-hang.html)
     ===================================================================== */
  function cartPage() {
    const root = $("#cartRoot");

    const draw = () => {
      const cart = readCart();
      if (!cart.length) {
        root.innerHTML = `<div class="cart-card cart-empty"><div class="big">🛒</div><h2>Giỏ hàng của bạn đang trống</h2><p>Hãy chọn vài món đặc sản miền Trung nhé!</p><a class="btn btn-primary" href="san-pham.html">Xem sản phẩm</a></div>`;
        return;
      }
      const t = totals(subtotalOf(cart));
      const count = cart.reduce((n, i) => n + i.quantity, 0);
      const loggedIn = !!user();

      root.innerHTML = `<div class="cart-layout">
        <section class="cart-card">
          <div class="cart-head"><h2>Sản phẩm (${count})</h2><button type="button" class="link-danger" data-clear>Xóa tất cả</button></div>
          ${cart
            .map(
              (i) => `
          <article class="cart-item" data-id="${i.id}">
            <a href="chi-tiet-san-pham.html?id=${i.id}">${thumb(i.name, i.image)}</a>
            <div class="ci-info">
              <a class="ci-name" href="chi-tiet-san-pham.html?id=${i.id}">${esc(i.name)}</a>
              <p class="ci-price">Đơn giá: <b>${money(i.price)}</b></p>
              <div class="ci-tools">
                <div class="qty">
                  <button type="button" data-dec aria-label="Giảm số lượng" ${i.quantity <= 1 ? "disabled" : ""}>−</button>
                  <input type="number" min="1" max="${RULES.maxQty}" value="${i.quantity}" aria-label="Số lượng" data-qty>
                  <button type="button" data-inc aria-label="Tăng số lượng" ${i.quantity >= RULES.maxQty ? "disabled" : ""}>+</button>
                </div>
                <button type="button" class="link-danger" data-remove>Xóa</button>
              </div>
            </div>
            <div class="ci-line">${money(i.price * i.quantity)}</div>
          </article>`,
            )
            .join("")}
        </section>

        <aside class="cart-card summary">
          <h2>Tóm tắt đơn hàng</h2>
          ${sumRows(t)}
          ${hint(t)}
          <a class="btn btn-primary btn-large" href="${loggedIn ? "thanh-toan.html" : "dang-nhap.html?next=thanh-toan.html"}">${loggedIn ? "Tiến hành đặt hàng" : "Đăng nhập để đặt hàng"}</a>
          <a class="btn btn-outline" href="san-pham.html">Tiếp tục mua sắm</a>
        </aside>
      </div>`;
    };

    /* Một chỗ lắng nghe cho cả trang (event delegation) */
    root.addEventListener("click", (e) => {
      const row = e.target.closest(".cart-item"),
        id = row ? Number(row.dataset.id) : 0;
      if (e.target.closest("[data-inc]")) {
        setQty(id, readCart().find((x) => x.id === id).quantity + 1);
        draw();
      } else if (e.target.closest("[data-dec]")) {
        setQty(id, readCart().find((x) => x.id === id).quantity - 1);
        draw();
      } else if (e.target.closest("[data-remove]")) {
        const it = readCart().find((x) => x.id === id);
        if (it && confirm(`Xóa "${it.name}" khỏi giỏ hàng?`)) {
          removeItem(id);
          draw();
          toast("Đã xóa sản phẩm khỏi giỏ hàng");
        }
      } else if (e.target.closest("[data-clear]")) {
        if (confirm("Xóa tất cả sản phẩm trong giỏ hàng?")) {
          clearCart();
          draw();
        }
      }
    });
    root.addEventListener("change", (e) => {
      if (!e.target.matches("[data-qty]")) return;
      const id = Number(e.target.closest(".cart-item").dataset.id);
      setQty(id, Math.floor(Number(e.target.value)));
      draw();
    });

    draw();
  }

  /* =====================================================================
     3. TRANG ĐẶT HÀNG  (thanh-toan.html)
     ===================================================================== */
  function checkoutPage() {
    const me = user();
    if (!me) return location.replace("dang-nhap.html?next=thanh-toan.html"); // phải đăng nhập mới đặt hàng
    if (!readCart().length) return location.replace("gio-hang.html");

    const f = $("#checkoutForm"),
      sel = $("#addrSelect"),
      saveBox = $("#saveAddrRow");
    const addrs = get(ADDR_KEY, []).filter((a) => a.userId === me.id);
    const addrText = (a) =>
      [a.line, a.ward, a.district, a.city].filter(Boolean).join(", ");

    /* --- Sổ địa chỉ: chọn địa chỉ đã lưu hoặc nhập mới --- */
    sel.innerHTML =
      addrs
        .map(
          (a) =>
            `<option value="${a.id}">${esc(a.receiver)} · ${esc(addrText(a))}${a.isDefault ? " (Mặc định)" : ""}</option>`,
        )
        .join("") + `<option value="new">+ Nhập địa chỉ khác</option>`;
    $("#addrPick").hidden = !addrs.length;

    function fill(a) {
      f.receiver.value = a ? a.receiver : me.fullName || "";
      f.phone.value = a ? a.phone : me.phone || "";
      f.line.value = a ? a.line : "";
      f.ward.value = a ? a.ward || "" : "";
      f.district.value = a ? a.district || "" : "";
      f.city.value = a ? a.city : "";
      saveBox.hidden = !!a;
    }
    function pick() {
      const a = addrs.find((x) => String(x.id) === sel.value);
      fill(a || null);
      if (!a) f.saveAddr.checked = !addrs.length; // chưa có địa chỉ nào thì mặc định gợi ý lưu
    }
    sel.onchange = pick;
    sel.value = (
      addrs.find((a) => a.isDefault) ||
      addrs[0] || { id: "new" }
    ).id;
    pick();
    f.email.value = me.email || "";

    /* --- Khung thông tin theo phương thức thanh toán --- */
    const payInfo = $("#payInfo");
    function showPayInfo() {
      const v = f.payment.value;
      payInfo.hidden = v === "cod";
      payInfo.innerHTML =
        v === "bank_transfer"
          ? bankBox()
          : v === "ewallet"
            ? `<p class="pay-note">Mã QR thanh toán sẽ được hiển thị ở bước xác nhận tiếp theo sau khi bạn nhấn “Đặt hàng”.</p>`
            : "";
    }
    f.querySelectorAll('input[name="payment"]').forEach(
      (r) => (r.onchange = showPayInfo),
    );
    showPayInfo();

    /* --- Tóm tắt bên phải (đọc lại giỏ mỗi lần vẽ) --- */
    const cart = readCart(),
      t = totals(subtotalOf(cart));
    $("#coSummary").innerHTML = `
      <h2>Đơn hàng của bạn</h2>
      <div class="mini-list">${cart.map((i) => `<div class="mini-item">${thumb(i.name, i.image)}<div class="nm">${esc(i.name)}<small>${money(i.price)} × ${i.quantity}</small></div><b>${money(i.price * i.quantity)}</b></div>`).join("")}</div>
      ${sumRows(t)}
      <button class="btn btn-primary btn-large" type="submit" form="checkoutForm" id="placeBtn">Đặt hàng</button>
      <a class="btn btn-outline" href="gio-hang.html">← Quay lại giỏ hàng</a>`;

    /* --- Kiểm tra dữ liệu nhập --- */
    const showErr = (input, text) => {
      input.classList.add("invalid");
      input.closest(".field").querySelector(".field-error").textContent = text;
    };
    const clear = () => {
      f.querySelectorAll(".field-error").forEach((s) => (s.textContent = ""));
      f.querySelectorAll(".invalid").forEach((i) =>
        i.classList.remove("invalid"),
      );
      const m = $(".form-msg", f);
      m.textContent = "";
    };
    function validate() {
      const rules = [
        [
          "receiver",
          (v) =>
            !v
              ? "Vui lòng nhập họ tên người nhận"
              : v.length > 100
                ? "Tối đa 100 ký tự"
                : "",
        ],
        [
          "phone",
          (v) =>
            !v
              ? "Vui lòng nhập số điện thoại"
              : !PHONE.test(v)
                ? "Số điện thoại không hợp lệ (vd: 0901234567)"
                : "",
        ],
        [
          "email",
          (v) =>
            v && !EMAIL.test(v)
              ? "Email không đúng định dạng"
              : v.length > 150
                ? "Tối đa 150 ký tự"
                : "",
        ],
        [
          "line",
          (v) =>
            !v
              ? "Vui lòng nhập số nhà, tên đường"
              : v.length > 255
                ? "Tối đa 255 ký tự"
                : "",
        ],
        ["ward", (v) => (v.length > 100 ? "Tối đa 100 ký tự" : "")],
        ["district", (v) => (v.length > 100 ? "Tối đa 100 ký tự" : "")],
        [
          "city",
          (v) =>
            !v
              ? "Vui lòng nhập tỉnh / thành phố"
              : v.length > 100
                ? "Tối đa 100 ký tự"
                : "",
        ],
        ["note", (v) => (v.length > 255 ? "Ghi chú tối đa 255 ký tự" : "")],
      ];
      let ok = true,
        first = null;
      rules.forEach(([name, test]) => {
        const e = test(f[name].value.trim());
        if (e) {
          showErr(f[name], e);
          ok = false;
          first = first || f[name];
        }
      });
      if (
        ok &&
        addrText({
          line: f.line.value.trim(),
          ward: f.ward.value.trim(),
          district: f.district.value.trim(),
          city: f.city.value.trim(),
        }).length > 255
      ) {
        showErr(f.line, "Địa chỉ quá dài (tối đa 255 ký tự)");
        ok = false;
        first = f.line;
      }
      if (first) first.focus();
      return ok;
    }

    /* --- Bấm "Đặt hàng" --- */
    f.onsubmit = (e) => {
      e.preventDefault();
      clear();
      if (!validate()) return;

      const items = readCart(); // đọc lại: giá lấy từ danh sách sản phẩm, không tin giao diện
      if (!items.length) return location.replace("gio-hang.html");
      const tt = totals(subtotalOf(items));

      const orders = get(ORDERS_KEY, []);
      const d = new Date(),
        p2 = (n) => String(n).padStart(2, "0");
      const day = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;
      const stamp = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
      let seq =
          orders.filter((o) => String(o.code).indexOf("CD" + day) === 0)
            .length + 1,
        code;
      do {
        code = "CD" + day + String(seq++).padStart(3, "0");
      } while (orders.some((o) => o.code === code)); // vd CD20261107001

      const order = {
        id: Math.max(0, ...orders.map((o) => o.id)) + 1,
        code,
        userId: me.id,
        subtotal: tt.subtotal,
        discount: tt.discount,
        shipping: tt.shipping,
        total: tt.total,
        payment: f.payment.value,
        paid: "unpaid",
        status: "pending",
        carrier: "",
        tracking: "",
        createdAt: stamp,
        receiver: f.receiver.value.trim(),
        rphone: f.phone.value.trim(),
        remail: f.email.value.trim(),
        note: f.note.value.trim(),
        address: addrText({
          line: f.line.value.trim(),
          ward: f.ward.value.trim(),
          district: f.district.value.trim(),
          city: f.city.value.trim(),
        }),
        history: [["pending", "Khách đặt hàng", stamp]],
        items: items.map((i) => [i.name, i.price, i.quantity]), // [tên, đơn giá lúc mua, số lượng]
      };

      if (!set(ORDERS_KEY, [...orders, order])) {
        $(".form-msg", f).textContent =
          "Không lưu được đơn hàng (bộ nhớ trình duyệt đầy hoặc bị chặn). Vui lòng thử lại.";
        return;
      }
      $("#placeBtn").disabled = true;

      /* Lưu địa chỉ mới vào sổ địa chỉ nếu khách tick chọn */
      if (sel.value === "new" && f.saveAddr.checked) {
        const all = get(ADDR_KEY, []);
        all.push({
          id: Math.max(0, ...all.map((a) => a.id)) + 1,
          userId: me.id,
          receiver: order.receiver,
          phone: order.rphone,
          line: f.line.value.trim(),
          ward: f.ward.value.trim(),
          district: f.district.value.trim(),
          city: f.city.value.trim(),
          isDefault: !addrs.length,
        });
        set(ADDR_KEY, all);
      }

      clearCart();
      location.href =
        "dat-hang-thanh-cong.html?code=" + encodeURIComponent(code);
    };
  }

  /* =====================================================================
     4. TRANG ĐẶT HÀNG THÀNH CÔNG  (dat-hang-thanh-cong.html)
     ===================================================================== */
  function successPage() {
    const me = user(),
      root = $("#successRoot");
    if (!me) return location.replace("dang-nhap.html");
    const code = new URLSearchParams(location.search).get("code");
    const o = get(ORDERS_KEY, []).find(
      (x) => x.code === code && x.userId === me.id,
    ); // chỉ xem được đơn của chính mình

    if (!o) {
      root.innerHTML = `<div class="cart-card cart-empty"><div class="big">🔍</div><h2>Không tìm thấy đơn hàng</h2><p>Bạn có thể xem các đơn đã đặt trong lịch sử đơn hàng.</p><a class="btn btn-primary" href="lich-su-don-hang.html">Lịch sử đơn hàng</a></div>`;
      return;
    }

    const wait = `<p class="cart-sub" style="margin:10px 0 0">CenDeli sẽ xác nhận đơn ngay khi nhận được tiền.</p>`;
    const payBody =
      o.payment === "bank_transfer"
        ? bankBox(o.code, o.total) + wait
        : o.payment === "ewallet"
          ? `<div class="qr-box"><img src="${QR_IMAGE}" alt="Mã QR thanh toán"><p>Quét mã bằng MoMo hoặc ZaloPay để thanh toán <b>${money(o.total)}</b></p><p class="cart-sub" style="margin:4px 0 0">Nội dung: <b>${esc(o.code)}</b></p></div>` +
            wait
          : `<p class="cart-sub" style="margin:0">Bạn thanh toán <b>${money(o.total)}</b> cho nhân viên giao hàng khi nhận hàng.</p>`;

    root.innerHTML = `<div class="done">
      <div class="tick" aria-hidden="true">✓</div>
      <h1>Đặt hàng thành công!</h1>
      <p class="cart-sub" style="margin-bottom:0">Cảm ơn ${esc(me.fullName)} đã mua đặc sản miền Trung tại CenDeli.</p>
      <span class="code">${esc(o.code)}</span>

      <section class="cart-card"><h2>Thanh toán</h2>
        <p style="margin-bottom:6px"><b>${PAY[o.payment] || ""}</b></p>${payBody}</section>

      <section class="cart-card"><h2>Chi tiết đơn hàng</h2>
        <div class="mini-list">${o.items.map(([nm, pr, q]) => `<div class="mini-item">${thumb(nm)}<div class="nm">${esc(nm)}<small>${money(pr)} × ${q}</small></div><b>${money(pr * q)}</b></div>`).join("")}</div>
        ${sumRows({ subtotal: o.subtotal, discount: o.discount, shipping: o.shipping, total: o.total })}
        <p class="cart-sub" style="margin:14px 0 0"><b>Giao đến:</b> ${esc(o.receiver)} · ${esc(o.rphone)}<br>${esc(o.address)}${o.note ? `<br><b>Ghi chú:</b> ${esc(o.note)}` : ""}</p>
      </section>

      <div class="btns"><a class="btn btn-primary" href="lich-su-don-hang.html">Xem lịch sử đơn hàng</a><a class="btn btn-outline" href="san-pham.html">Tiếp tục mua sắm</a></div>
    </div>`;

    /* Chưa có ảnh QR thì hiện thông báo thay vì ảnh hỏng */
    const qr = $(".qr-box img", root);
    if (qr) {
      const missing = () => {
        const d = document.createElement("div");
        d.className = "qr-missing";
        d.textContent =
          "Mã QR đang được cập nhật. Vui lòng liên hệ CenDeli: 0357 668 998 để được hướng dẫn thanh toán.";
        qr.replaceWith(d);
      };
      qr.onerror = missing;
      if (qr.complete && qr.naturalWidth === 0) missing();
    }
  }

  /* ---------- Khởi động ---------- */
  updateBadge();
  (
    ({ cart: cartPage, checkout: checkoutPage, success: successPage })[
      document.body.dataset.page
    ] || (() => {})
  )();
  window.CenDeliCart = { read: readCart, totals, updateBadge };
})();
