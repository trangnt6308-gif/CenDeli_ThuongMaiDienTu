/* CenDeli - Tài khoản người dùng (feature/auth): đăng ký, đăng nhập, đăng xuất, hồ sơ, lịch sử đơn hàng.
   Dữ liệu lưu trong localStorage, tên trường theo DB_CenDeli.sql.
   Thêm file này vào MỌI trang (sau js/script.js) để header hiện trạng thái đăng nhập. */
(function () {
  const K = { users: "cendeli_users", cur: "cendeli_currentUser", orders: "cendeli_orders", addr: "cendeli_addresses" };
  const $ = (s, r = document) => r.querySelector(s);
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bộ nhớ đầy / bị chặn */ } };
  const money = (n) => Number(n).toLocaleString("vi-VN") + "đ";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* Trang quản trị. Nếu file này chưa có thì admin tự vào trang chủ (không bị lỗi 404). */
  const ADMIN_PAGE = "admin.html";
  const now = () => new Date().toISOString();
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, PHONE = /^(0|\+84)\d{9,10}$/;

  /* ---------- Biểu tượng ---------- */
  const SV = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    user: SV('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>'),
    mail: SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    phone: SV('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    lock: SV('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    pin: SV('<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    bag: SV('<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    eye: SV('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    off: SV('<path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    clock: SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    ok: SV('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    out: SV('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
    coin: SV('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>'),
  };

  /* ---------- Dữ liệu mẫu (lấy từ DB_CenDeli.sql) ---------- */
  function seed() {
    if (!get(K.users)) set(K.users, [
      { id: 1, fullName: "Quản trị CenDeli", email: "admin@cendeli.vn", phone: "0900000001", password: "Admin1234", role: "admin", status: "active", marketingConsent: false },
      { id: 2, fullName: "Nguyễn Hoàng Châu", email: "khach1@cendeli.vn", phone: "0900000002", password: "Khach111@@", role: "customer", status: "active", marketingConsent: true, consentAt: "2026-10-30 10:00" },
      { id: 3, fullName: "Lê Nhật Nam", email: "khach2@cendeli.vn", phone: "0900000003", password: "Khach222@@", role: "customer", status: "active", marketingConsent: false },
      { id: 4, fullName: "Trần Minh Hoàng", email: "khach3@cendeli.vn", phone: "0900000004", password: "Khach333@@", role: "customer", status: "active", marketingConsent: false },
    ]);
    const SEED_ADDR = [
      { id: 1, userId: 2, receiver: "Nguyễn Hoàng Châu", phone: "0900000002", line: "12 Nguyễn Văn Linh", ward: "Tân Thuận Tây", district: "Quận 7", city: "TP. Hồ Chí Minh", isDefault: true },
      { id: 2, userId: 3, receiver: "Lê Nhật Nam", phone: "0900000003", line: "45 Lê Lợi", ward: "Bến Thành", district: "Quận 1", city: "TP. Hồ Chí Minh", isDefault: true },
    ];
    /* Tên người nhận đã đổi cho KHỚP tên tài khoản (trước đây là "Nguyễn Văn An", "Lê Thị Bình") */
    const SEED_ORDERS = [
      { id: 1, code: "CD20261030001", userId: 2, subtotal: 140000, discount: 0, shipping: 25000, total: 165000, payment: "cod", paid: "paid", status: "completed", carrier: "GHTK", tracking: "GHTK000111", createdAt: "2026-10-30 10:15",
        receiver: "Nguyễn Hoàng Châu", rphone: "0900000002", address: "12 Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, TP.HCM",
        history: [["pending", "Khách đặt hàng", "2026-10-30 10:15"], ["completed", "Giao thành công", ""]],
        items: [["Bánh Tráng Xoài Dẻo", 25000, 2], ["Mắm Nêm Pha Sẵn Chuẩn Vị Xứ Quảng", 25000, 1], ["Bánh Tráng Mắm Ruốc (Túi 10 cái)", 65000, 1]] },
      { id: 2, code: "CD20261101001", userId: 3, subtotal: 361250, discount: 0, shipping: 0, total: 361250, payment: "bank_transfer", paid: "paid", status: "completed", carrier: "SPX Express", tracking: "SPX000222", createdAt: "2026-11-01 14:30",
        receiver: "Lê Nhật Nam", rphone: "0900000003", address: "45 Lê Lợi, Bến Thành, Quận 1, TP.HCM",
        history: [["pending", "Khách đặt hàng", "2026-11-01 14:30"], ["completed", "Giao thành công", ""]],
        items: [["Bò Một Nắng Muối Kiến Vàng", 97750, 1], ["Mực Một Nắng / Mực Khô Câu", 93500, 1], ["Khô Cá Đuối Đen Tẩm Gia Vị", 170000, 1]] },
      { id: 3, code: "CD20261102001", userId: 2, subtotal: 204000, discount: 0, shipping: 25000, total: 229000, payment: "cod", paid: "unpaid", status: "pending", carrier: "", tracking: "", createdAt: "2026-11-02 09:00",
        receiver: "Nguyễn Hoàng Châu", rphone: "0900000002", address: "12 Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, TP.HCM",
        history: [["pending", "Khách đặt hàng", "2026-11-02 09:00"]],
        items: [["Mực Xé Sợi Hấp Bơ Tỏi", 127500, 1], ["Cá Đéc / Cá Khoai Rim Cay Ngọt", 76500, 1]] },
    ];
    /* Đồng bộ đơn mẫu: nếu máy đã lưu bản cũ thì thay 3 đơn mẫu, giữ nguyên các đơn khác */
    const DBV = 4;
    /* Địa chỉ mẫu (id 1, 2) được nạp lại khi đổi phiên bản; địa chỉ khách tự thêm (id > 2) được giữ nguyên */
    if (!get(K.addr)) set(K.addr, SEED_ADDR);
    else if (Number(localStorage.getItem("cendeli_dbver")) < DBV) set(K.addr, [...SEED_ADDR, ...get(K.addr, []).filter((a) => a.id > 2)]);
    if (!get(K.orders)) set(K.orders, SEED_ORDERS);
    else if (Number(localStorage.getItem("cendeli_dbver")) < DBV) set(K.orders, [...SEED_ORDERS, ...get(K.orders, []).filter((o) => o.id > 3)]);
    try { localStorage.setItem("cendeli_dbver", DBV); } catch (e) { /* bỏ qua */ }
  }

  /* ---------- Phiên đăng nhập ---------- */
  const cur = () => { const id = Number(localStorage.getItem(K.cur)); return get(K.users, []).find((u) => u.id === id && u.status === "active") || null; };
  const logout = () => { localStorage.removeItem(K.cur); location.href = "index.html"; };
  const requireLogin = () => { const u = cur(); if (!u) location.href = "dang-nhap.html?next=" + location.pathname.split("/").pop(); return u; };

  function headerAuth() {
    const u = cur(), box = $(".header-actions");
    if (!box || !u) return;
    box.querySelectorAll('a[href="dang-nhap.html"],a[href="dang-ky.html"]').forEach((a) => a.remove());
    box.querySelectorAll(".user-box").forEach((x) => x.remove());
    const w = document.createElement("span"); w.className = "user-box";
    w.innerHTML = `<a class="btn btn-outline btn-small" href="ho-so.html">Xin chào, ${esc(u.fullName.trim().split(" ").pop())}</a>`;
    box.prepend(w);
  }

  /* Nút đăng xuất ở sidebar (và bất kỳ nút nào có data-logout) */
  document.addEventListener("click", (e) => { if (e.target.closest("[data-logout]")) { e.preventDefault(); logout(); } });

  /* ---------- Biểu tượng trong ô nhập + nút hiện/ẩn mật khẩu ---------- */
  const FIELD_ICON = { fullName: "user", receiver: "user", email: "mail", phone: "phone", password: "lock", old: "lock", pw: "lock", confirm: "lock", line: "pin", ward: "pin", district: "pin", city: "pin" };
  function enhance(root) {
    root.querySelectorAll(".field input").forEach((i) => {
      const ic = FIELD_ICON[i.name];
      if (!ic || i.parentElement.classList.contains("inp")) return;
      const w = document.createElement("div"); w.className = "inp";
      i.before(w); w.appendChild(i);
      w.insertAdjacentHTML("afterbegin", `<span class="ico">${ICON[ic]}</span>`);
      if (i.type !== "password") return;
      w.classList.add("pw");
      const b = document.createElement("button"); b.type = "button"; b.className = "eye"; b.innerHTML = ICON.eye; b.setAttribute("aria-label", "Hiện mật khẩu");
      b.onclick = () => { const show = i.type === "password"; i.type = show ? "text" : "password"; b.innerHTML = show ? ICON.off : ICON.eye; b.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu"); };
      w.appendChild(b);
    });
  }

  /* ---------- Kiểm tra dữ liệu nhập ---------- */
  const clr = (f) => { f.querySelectorAll(".field-error").forEach((s) => (s.textContent = "")); f.querySelectorAll("input.invalid").forEach((i) => i.classList.remove("invalid")); const m = $(".form-msg", f); if (m) { m.textContent = ""; m.className = "form-msg"; } };
  const err = (i, t) => { i.classList.add("invalid"); const s = i.closest(".field").querySelector(".field-error"); s.textContent = t; };
  const msg = (f, t, ok) => { const m = $(".form-msg", f); m.textContent = t; m.className = "form-msg" + (ok ? " ok" : ""); };
  const check = (f, rules) => { let ok = true, first; for (const [name, test] of rules) { const e = test(f[name].value.trim()); if (e) { err(f[name], e); ok = false; first = first || f[name]; } } if (first) first.focus(); return ok; };
  const need = (t) => (v) => (v ? "" : t);
  const maxLen = (n) => (v) => (v.length > n ? `Tối đa ${n} ký tự` : "");
  const both = (a, b) => (v) => a(v) || b(v);
  const emailRule = (v) => (!v ? "Vui lòng nhập email" : !EMAIL.test(v) ? "Email không đúng định dạng" : "");
  const phoneRule = (v) => (v && !PHONE.test(v) ? "Số điện thoại không hợp lệ (vd: 0901234567)" : "");
  const pwRule = (v) => (!v ? "Vui lòng nhập mật khẩu" : v.length < 6 ? "Mật khẩu tối thiểu 6 ký tự" : "");

  /* ---------- Trang đăng nhập ---------- */
  function loginPage() {
    if (cur()) return (location.href = "index.html");
    const f = $("#loginForm");
    f.onsubmit = (e) => {
      e.preventDefault(); clr(f);
      if (!check(f, [["email", emailRule], ["password", need("Vui lòng nhập mật khẩu")]])) return;
      const email = f.email.value.trim().toLowerCase();
      const u = get(K.users, []).find((x) => x.email.toLowerCase() === email && x.password === f.password.value);
      if (!u) return msg(f, "Email hoặc mật khẩu không đúng.");
      if (u.status === "locked") return msg(f, "Tài khoản đã bị khóa. Vui lòng liên hệ CenDeli để được hỗ trợ.");
      localStorage.setItem(K.cur, u.id);
      const next = new URLSearchParams(location.search).get("next");
      const dest = /^[\w-]+\.html$/.test(next || "") ? next : "index.html";
      if (u.role === "admin" && ADMIN_PAGE) fetch(ADMIN_PAGE, { method: "HEAD" }).then((r) => (location.href = r.ok ? ADMIN_PAGE : dest)).catch(() => (location.href = dest));
      else location.href = dest;
    };
  }

  /* ---------- Trang đăng ký ---------- */
  function registerPage() {
    if (cur()) return (location.href = "index.html");
    const f = $("#registerForm");
    f.onsubmit = (e) => {
      e.preventDefault(); clr(f);
      const users = get(K.users, []);
      const ok = check(f, [
        ["fullName", (v) => (!v ? "Vui lòng nhập họ và tên" : v.length > 100 ? "Họ và tên tối đa 100 ký tự" : "")],
        ["email", (v) => emailRule(v) || (v.length > 150 ? "Email tối đa 150 ký tự" : users.some((u) => u.email.toLowerCase() === v.toLowerCase()) ? "Email này đã được đăng ký" : "")],
        ["phone", phoneRule], ["password", pwRule],
        ["confirm", (v) => (!v ? "Vui lòng nhập lại mật khẩu" : v !== f.password.value ? "Mật khẩu nhập lại không khớp" : "")],
      ]);
      if (!ok) return;
      const u = { id: Math.max(0, ...users.map((x) => x.id)) + 1, fullName: f.fullName.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), password: f.password.value,
        role: "customer", status: "active", marketingConsent: f.consent.checked, consentAt: f.consent.checked ? now() : null, createdAt: now(), updatedAt: now() };
      set(K.users, [...users, u]);
      localStorage.setItem(K.cur, u.id);
      location.href = "index.html";
    };
  }

  /* ---------- Khung tài khoản dùng chung (menu bên trái) ---------- */
  function sideCard(me, active, n, asTabs) {
    const items = [["info", "user", "Thông tin cá nhân", "ho-so.html", ""], ["pw", "lock", "Đổi mật khẩu", "ho-so.html#mat-khau", ""], ["addr", "pin", "Địa chỉ", "ho-so.html#dia-chi", `<em>${n}</em>`], ["orders", "bag", "Lịch sử đơn hàng", "lich-su-don-hang.html", ""]];
    const nav = items.map(([id, ic, label, href, extra]) => {
      const inner = `<span class="ni">${ICON[ic]}</span>${label}${extra}`, on = id === active ? "on" : "";
      return asTabs && id !== "orders" ? `<button type="button" data-tab="${id}" class="${on}">${inner}</button>` : `<a href="${href}" class="${on}">${inner}</a>`;
    }).join("");
    return `<aside class="auth-card side-card"><div class="side-top"></div><div class="avatar">${esc(me.fullName.trim().charAt(0).toUpperCase())}</div><h2>${esc(me.fullName)}</h2><p>${esc(me.email)}</p><span class="badge">${me.role === "admin" ? "Quản trị viên" : "Khách hàng"}</span><nav class="acc-nav">${nav}</nav>
      <button type="button" class="side-logout" data-logout>${ICON.out}Đăng xuất</button></aside>`;
  }

  /* ---------- Trang hồ sơ ---------- */
  function profilePage() {
    const u = requireLogin(); if (!u) return;
    const root = $("#profileRoot"); root.className = "account";
    const HASH = { info: "#", pw: "#mat-khau", addr: "#dia-chi" };
    const fromHash = () => (location.hash === "#mat-khau" ? "pw" : location.hash === "#dia-chi" ? "addr" : "info");
    let tab = fromHash(), adding = false;

    const field = (l, n, o = {}) => `<div class="field ${o.cls || ""}"><label>${l}</label><input name="${n}" type="${o.type || "text"}" ${o.val != null ? `value="${esc(o.val)}"` : ""} ${o.ro ? "readonly" : ""} ${o.ac ? `autocomplete="${o.ac}"` : ""} /><small class="field-error"></small></div>`;
    const title = (ic, t, sub) => `<div class="panel-title"><span class="ph-ico">${ICON[ic]}</span><div><h2>${t}</h2><p class="auth-sub">${sub}</p></div></div>`;
    const infoP = (me) => title("user", "Thông tin cá nhân", "Email dùng để đăng nhập nên không thể thay đổi.") + `<form id="infoForm" novalidate><div class="grid2">
      ${field("Họ và tên", "fullName", { val: me.fullName })}${field("Email", "email", { val: me.email, ro: 1 })}${field("Số điện thoại", "phone", { val: me.phone })}
      <label class="check"><input type="checkbox" name="consent" ${me.marketingConsent ? "checked" : ""} /> Nhận tin khuyến mãi từ CenDeli</label></div>
      <p class="form-msg"></p><div class="form-actions"><button class="btn btn-primary" type="submit">Lưu thay đổi</button></div></form>`;
    const pwP = () => title("lock", "Đổi mật khẩu", "Dùng mật khẩu tối thiểu 6 ký tự") + `<form id="pwForm" novalidate><div class="grid2">
      ${field("Mật khẩu hiện tại", "old", { type: "password", ac: "current-password", cls: "full" })}${field("Mật khẩu mới", "pw", { type: "password", ac: "new-password" })}${field("Nhập lại mật khẩu mới", "confirm", { type: "password", ac: "new-password" })}</div>
      <p class="form-msg"></p><div class="form-actions"><button class="btn btn-primary" type="submit">Đổi mật khẩu</button></div></form>`;
    const addrCard = (a) => `<div class="addr-card ${a.isDefault ? "def" : ""}"><span class="ai">${ICON.pin}</span><div class="ab"><div><strong>${esc(a.receiver)}</strong> · ${esc(a.phone)}${a.isDefault ? '<span class="badge">Mặc định</span>' : ""}</div>
      <p>${esc([a.line, a.ward, a.district, a.city].filter(Boolean).join(", "))}</p><div class="row">${a.isDefault ? "" : `<button type="button" class="btn btn-outline btn-small" data-def="${a.id}">Đặt mặc định</button>`}<button type="button" class="btn btn-outline btn-small" data-del="${a.id}">Xóa</button></div></div></div>`;
    const addCard = (t) => `<button type="button" class="addr-add" id="addCard"><span>+</span>${t}</button>`;
    const addrP = (list) => title("pin", "Sổ địa chỉ giao hàng", "Chọn địa chỉ mặc định để đặt hàng nhanh hơn.")
      + (list.length
        ? `<div class="addr-tip">${ICON.pin}<span>Bạn đang có <b>${list.length}</b> địa chỉ. Địa chỉ <b>mặc định</b> sẽ được tự điền khi thanh toán.</span></div><div class="addr-grid">${list.map(addrCard).join("")}${addCard("Thêm địa chỉ mới")}</div>`
        : `<div class="addr-grid">${addCard("Bạn chưa lưu địa chỉ nào. Thêm ngay")}</div>`)
      + `<form id="addrForm" novalidate ${adding ? "" : "hidden"}><h3>Địa chỉ mới</h3><div class="grid2">${field("Tên người nhận", "receiver")}${field("Số điện thoại", "phone")}${field("Số nhà, tên đường", "line")}${field("Phường / xã", "ward")}${field("Quận / huyện", "district")}${field("Tỉnh / thành phố", "city")}</div>
      <label class="check"><input type="checkbox" name="def" /> Đặt làm địa chỉ mặc định</label><p class="form-msg"></p><div class="form-actions"><button class="btn btn-primary" type="submit">Lưu địa chỉ</button><button class="btn btn-outline" type="button" id="cancelAddr">Hủy</button></div></form>`;

    const draw = () => {
      const me = cur(); if (!me) return (location.href = "dang-nhap.html");
      const list = get(K.addr, []).filter((a) => a.userId === me.id);
      root.innerHTML = sideCard(me, tab, list.length, true) + `<section class="auth-card acc-panel">${tab === "pw" ? pwP() : tab === "addr" ? addrP(list) : infoP(me)}</section>`;
      enhance(root);
      root.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; adding = false; try { history.replaceState(null, "", HASH[tab]); } catch (e) { /* bỏ qua */ } draw(); }));

      const info = $("#infoForm");
      if (info) info.onsubmit = (e) => { e.preventDefault(); clr(info);
        if (!check(info, [["fullName", (v) => (!v ? "Vui lòng nhập họ và tên" : v.length > 100 ? "Tối đa 100 ký tự" : "")], ["phone", phoneRule]])) return;
        set(K.users, get(K.users, []).map((x) => x.id === me.id ? { ...x, fullName: info.fullName.value.trim(), phone: info.phone.value.trim(), marketingConsent: info.consent.checked, updatedAt: now() } : x));
        draw(); headerAuth(); msg($("#infoForm"), "Đã lưu thay đổi.", true); };

      const pw = $("#pwForm");
      if (pw) pw.onsubmit = (e) => { e.preventDefault(); clr(pw);
        if (!check(pw, [["old", need("Vui lòng nhập mật khẩu hiện tại")], ["pw", pwRule], ["confirm", (v) => (v !== pw.pw.value ? "Mật khẩu nhập lại không khớp" : "")]])) return;
        const fresh = cur(); /* đọc lại, tránh dùng mật khẩu cũ sau khi đã đổi một lần */
        if (pw.old.value !== fresh.password) return err(pw.old, "Mật khẩu hiện tại không đúng");
        set(K.users, get(K.users, []).map((x) => (x.id === fresh.id ? { ...x, password: pw.pw.value, updatedAt: now() } : x)));
        pw.reset(); msg(pw, "Đã đổi mật khẩu.", true); };

      const ad = $("#addrForm");
      if (ad) {
        $("#cancelAddr").onclick = () => { adding = false; draw(); };
        if (adding) ad.receiver.focus();
        const ac = $("#addCard"); if (ac) ac.onclick = () => { adding = true; draw(); };
        ad.onsubmit = (e) => { e.preventDefault(); clr(ad);
          if (!check(ad, [["receiver", both(need("Vui lòng nhập tên người nhận"), maxLen(100))], ["phone", (v) => (!v ? "Vui lòng nhập số điện thoại" : phoneRule(v))], ["line", both(need("Vui lòng nhập số nhà, tên đường"), maxLen(255))], ["ward", maxLen(100)], ["district", maxLen(100)], ["city", both(need("Vui lòng nhập tỉnh / thành phố"), maxLen(100))]])) return;
          const all = get(K.addr, []), mine = all.filter((a) => a.userId === me.id), makeDef = ad.def.checked || !mine.length;
          const next = all.map((a) => (a.userId === me.id && makeDef ? { ...a, isDefault: false } : a));
          next.push({ id: Math.max(0, ...all.map((a) => a.id)) + 1, userId: me.id, receiver: ad.receiver.value.trim(), phone: ad.phone.value.trim(), line: ad.line.value.trim(), ward: ad.ward.value.trim(), district: ad.district.value.trim(), city: ad.city.value.trim(), isDefault: makeDef });
          set(K.addr, next); adding = false; draw(); };
        root.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => {
          let all = get(K.addr, []); const gone = all.find((a) => a.id == b.dataset.del && a.userId === me.id);
          if (!gone) return;
          all = all.filter((a) => a.id !== gone.id);
          if (gone.isDefault) { const n = all.find((a) => a.userId === me.id); if (n) n.isDefault = true; }
          set(K.addr, all); draw(); }));
        root.querySelectorAll("[data-def]").forEach((b) => (b.onclick = () => {
          set(K.addr, get(K.addr, []).map((a) => (a.userId === me.id ? { ...a, isDefault: a.id == b.dataset.def } : a))); draw(); }));
      }
    };
    /* Bấm link "Đổi mật khẩu" / "Sổ địa chỉ" khi đang ở trang hồ sơ thì tự đổi tab */
    window.addEventListener("hashchange", () => { const t = fromHash(); if (t !== tab) { tab = t; adding = false; draw(); } });
    draw();
  }

  /* ---------- Trang lịch sử đơn hàng ---------- */
  function ordersPage() {
    const u = requireLogin(); if (!u) return;
    const ST = { pending: "Chờ xử lý", confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã hủy" };
    const PAY = { cod: "Thanh toán khi nhận hàng", bank_transfer: "Chuyển khoản" }, PS = { unpaid: "Chưa thanh toán", paid: "Đã thanh toán", refunded: "Đã hoàn tiền" };
    const FLOW = ["pending", "confirmed", "shipping", "completed"];
    const IMG = { "Ghẹ Sữa Rim Me / Rim Cay": "ghesuarimme.png", "Cá Thiều Que Tẩm Gia Vị": "cathieuque.png", "Bánh Tráng Xoài Dẻo": "banhtrangxoai.png", "Bánh Tráng Dừa Nướng (10 cái)": "banhtrangduanuong.jpg",
      "Mực Xé Sợi Hấp Bơ Tỏi": "mucxesoi.png", "Khô Cá Mai Chanh Tuyết / Tẩm Gia Vị": "khocamai.jpg", "Bánh Tráng Mắm Ruốc (Túi 10 cái)": "banhtrangmamruoc.jpg", "Chả Cá Quy Nhơn / Nha Trang (Chiên & Hấp)": "chaca.jpg",
      "Nem Chua Huế Gói Lá Chuối": "nemchua.png", "Bò Một Nắng Muối Kiến Vàng": "bomotnang.png", "Bắp Bò Ngâm Mắm Nhĩ": "bapbongam.jpg", "Chả Ốc Nướng Giấy Bạc": "chaocnuong.jpg",
      "Mắm Nêm Pha Sẵn Chuẩn Vị Xứ Quảng": "mamnem.png", "Cá Đéc / Cá Khoai Rim Cay Ngọt": "cakhoairim.jpg", "Mực Một Nắng / Mực Khô Câu": "mucmotnang.png", "Mắm Dưa Cà Pháo Xứ Quảng": "mamduaca.jpg",
      "Cá Nục Một Nắng Rim Tiêu Xanh": "canucmotnang.jpg", "Khô Cá Đuối Đen Tẩm Gia Vị": "khocaduoiden.jpg" };
    const thumb = (n) => `<span class="thumb"><b>${esc(n.trim().charAt(0))}</b>${IMG[n] ? `<img src="${IMG[n]}" alt="" onerror="this.remove()">` : ""}</span>`;
    const all = get(K.orders, []).filter((o) => o.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const TABS = [["all", "Tất cả", () => true], ["doing", "Đang xử lý", (o) => ["pending", "confirmed"].includes(o.status)], ["shipping", "Đang giao", (o) => o.status === "shipping"], ["completed", "Hoàn tất", (o) => o.status === "completed"], ["cancelled", "Đã hủy", (o) => o.status === "cancelled"]];
    const spent = all.filter((o) => o.status !== "cancelled").reduce((t, o) => t + o.total, 0);
    const active = all.filter((o) => ["pending", "confirmed", "shipping"].includes(o.status)).length;
    const stat = (ic, v, l) => `<div class="stat"><span class="stat-ico">${ICON[ic]}</span><div><strong>${v}</strong><small>${l}</small></div></div>`;

    const card = (o, open) => {
      const idx = FLOW.indexOf(o.status), n = o.items.reduce((t, i) => t + i[2], 0);
      const ship = o.address ? `<div class="sum-ship"><strong>Giao đến</strong>${esc(o.receiver)} · ${esc(o.rphone)}<br>${esc(o.address)}</div>` : "";
      const progress = o.status === "cancelled"
        ? `<p class="cancel-note">Đơn hàng này đã được hủy${o.cancelReason ? ": " + esc(o.cancelReason) : "."}</p>`
        : `<ol class="steps">${FLOW.map((s, i) => `<li class="${i <= idx ? "on" : ""}"><span>${i < idx || o.status === "completed" ? "✓" : i + 1}</span>${ST[s]}</li>`).join("")}</ol>`;
      return `<details class="order st-${esc(o.status)}" ${open ? "open" : ""}><summary>
        <span class="thumbs">${o.items.slice(0, 3).map((i) => thumb(i[0])).join("")}${o.items.length > 3 ? `<span class="more">+${o.items.length - 3}</span>` : ""}</span>
        <span class="info"><span class="code">${esc(o.code)}</span><span class="date">${esc(o.createdAt)} · ${n} sản phẩm</span></span>
        <span class="badge st-b-${esc(o.status)}">${ST[o.status] || esc(o.status)}</span><span class="total">${money(o.total)}</span><span class="chev">&#9662;</span></summary>
        <div class="order-body">
          ${progress}
          <div class="order-cols"><div class="lines">${o.items.map(([nm, p, q]) => `<div class="line">${thumb(nm)}<div class="nm"><strong>${esc(nm)}</strong><small>${money(p)} × ${q}</small></div><b>${money(p * q)}</b></div>`).join("")}</div>
            <aside class="sum"><h3>Thanh toán</h3>
              <p class="grand"><span>Tổng cộng</span><b>${money(o.total)}</b></p>
              <details class="more-info"><summary>Xem chi tiết</summary>
                <p><span>Tiền hàng</span><b>${money(o.subtotal)}</b></p>${o.discount ? `<p><span>Giảm giá</span><b>-${money(o.discount)}</b></p>` : ""}
                <p><span>Vận chuyển</span><b>${o.shipping ? money(o.shipping) : "Miễn phí"}</b></p>
                <small>${PAY[o.payment] || ""} · ${PS[o.paid] || ""}${o.carrier ? `<br>${esc(o.carrier)} · Mã vận đơn: ${esc(o.tracking)}` : ""}</small>
                ${ship}
              </details>
              <a class="btn btn-outline btn-small" href="san-pham.html">Mua lại</a></aside></div></div></details>`;
    };

    const root = $("#ordersRoot"); root.className = "account";
    const addrCount = get(K.addr, []).filter((a) => a.userId === u.id).length;
    const draw = (f) => {
      const t = TABS.find((x) => x[0] === f), list = all.filter(t[2]);
      root.innerHTML = sideCard(u, "orders", addrCount) + `<section class="auth-card acc-panel orders-panel"><div class="panel-title"><span class="ph-ico">${ICON.bag}</span><div><h2>Lịch sử đơn hàng</h2><p class="auth-sub">Theo dõi và xem lại các đơn bạn đã đặt tại CenDeli.</p></div></div>
        <div class="stats">${stat("bag", all.length, "Tổng số đơn")}${stat("clock", active, "Đang xử lý / giao")}${stat("ok", all.filter(TABS[3][2]).length, "Đã hoàn tất")}${stat("coin", money(spent), "Tổng chi tiêu")}</div>
        <div class="tabs">${TABS.map(([k, l, fn]) => `<button type="button" class="${k === f ? "on" : ""}" data-f="${k}">${l} <span>${all.filter(fn).length}</span></button>`).join("")}</div>
        <div class="order-list">${list.length ? list.map((o) => card(o, false)).join("") : `<div class="empty">${all.length ? "Không có đơn nào ở mục này." : "Bạn chưa có đơn hàng nào."}<br><br><a class="btn btn-primary" href="san-pham.html">Xem sản phẩm</a></div>`}</div></section>`;
      root.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => draw(b.dataset.f)));
    };
    draw("all");
  }

  /* ---------- Khởi động ---------- */
  seed();
  headerAuth();
  ({ login: loginPage, register: registerPage, profile: profilePage, orders: ordersPage }[document.body.dataset.page] || (() => {}))();
  enhance(document);
  window.CenDeliAuth = { currentUser: cur, logout };
})();