/*---UPDATE---*/
(() => {
  'use strict';
  const KEY = { users: 'cendeli_users', current: 'cendeli_currentUser', orders: 'cendeli_orders', products: 'cendeli_products' };
  const $ = (s, root = document) => root.querySelector(s);
  const read = (key, fallback = []) => { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { notify('Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy.'); return false; } };
  const money = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STATUS = { pending:'Chờ xác nhận', confirmed:'Đã xác nhận', shipping:'Đang giao', completed:'Hoàn tất', cancelled:'Đã hủy' };
  const PAY = { cod:'COD', bank_transfer:'Chuyển khoản', ewallet:'Ví điện tử' };
  // products được dùng trực tiếp từ js/products.js; không tạo mảng sản phẩm thứ hai.
  let users = [], orders = [], contacts = [];
  let toastTimer;
  function notify(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400); }
  function currentUser() { const id = Number(localStorage.getItem(KEY.current)); return read(KEY.users).find(u => Number(u.id) === id && u.status !== 'locked'); }
  function guard() { const me = currentUser(); if (!me || me.role !== 'admin') { alert('Bạn cần đăng nhập bằng tài khoản quản trị để truy cập trang này.'); location.href = 'dang-nhap.html?next=admin.html'; return null; } return me; }
  function loadData() {
    users = read(KEY.users); orders = read(KEY.orders);
    // Danh sách products đã được js/products.js nạp từ dữ liệu mặc định
    // hoặc từ khóa localStorage cendeli_products. Không nạp sang mảng riêng.
    if (!Array.isArray(products)) {
      console.error('Không tìm thấy mảng products từ js/products.js.');
    }
  }
  function saveProducts() { if (write(KEY.products, products)) { renderProducts(); renderDashboard(); notify('Danh sách sản phẩm đã được lưu.'); } }

  function showPage(name) {
  document.querySelectorAll('.page').forEach(p =>
    p.classList.toggle('active', p.id === `page-${name}`)
  );

  document.querySelectorAll('.nav-link').forEach(b =>
    b.classList.toggle('active', b.dataset.page === name)
  );

  const titles = {
    dashboard: 'Dashboard',
    products: 'Quản lý sản phẩm',
    orders: 'Quản lý đơn hàng',
    users: 'Quản lý người dùng',
    contacts: 'Chăm sóc khách hàng'
  };

  $('#pageTitle').textContent = titles[name] || 'Dashboard';
  $('#sidebar').classList.remove('open');

  if (name === 'dashboard') renderDashboard();
  if (name === 'products') renderProducts();
  if (name === 'orders') renderOrders();
  if (name === 'users') renderUsers();
  if (name === 'contacts') loadContacts();
}
  function renderDashboard() {
    $('#statProducts').textContent = products.length;
    $('#statOrders').textContent = orders.length;
    $('#statUsers').textContent = users.filter(u => u.role !== 'admin').length;
    const revenue = orders.filter(o => o.status === 'completed').reduce((sum,o) => sum + Number(o.total || 0), 0);
    $('#statRevenue').textContent = money(revenue);
    const counts = Object.keys(STATUS).map(key => ({key,label:STATUS[key],count:orders.filter(o => o.status === key).length}));
    const max = Math.max(1,...counts.map(x => x.count));
    $('#statusChart').innerHTML = counts.map(x => `<div class="bar-row"><span>${x.label}</span><div class="bar-track"><div class="bar-fill" style="width:${x.count/max*100}%"></div></div><b>${x.count}</b></div>`).join('');
    const recent = [...orders].sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0,4);
    $('#recentOrders').innerHTML = recent.length ? recent.map(o => `<div class="recent-item"><div><b>${esc(o.code || '#'+o.id)}</b><small>${esc(o.receiver || 'Khách hàng')} · ${esc(o.createdAt || '')}</small></div><div class="recent-right"><b>${money(o.total)}</b><small><span class="pill ${esc(o.status)}">${STATUS[o.status] || esc(o.status)}</span></small></div></div>`).join('') : '<div class="empty-state">Chưa có đơn hàng.</div>';
    $('#dashboardProducts').innerHTML = products.slice(0,4).map(p => `<div class="mini-product"><img src="${esc(p.image || '')}" onerror="this.style.display='none'"><div><b>${esc(p.name)}</b><small>${money(p.salePrice)}</small></div></div>`).join('') || '<div class="empty-state">Chưa có sản phẩm.</div>';
    renderRevenueChart();
    renderTopSellingProducts();
  }
  function parseOrderDate(value) {
    if (!value) return null;
    const date = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function renderRevenueChart() {
    const now = new Date();
    const months = [];
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      months.push({ year: date.getFullYear(), month: date.getMonth(), label: date.toLocaleDateString('vi-VN', { month: 'short' }), total: 0 });
    }
    orders.filter(o => o.status === 'completed').forEach(order => {
      const date = parseOrderDate(order.createdAt);
      if (!date) return;
      const month = months.find(m => m.year === date.getFullYear() && m.month === date.getMonth());
      if (month) month.total += Number(order.total) || 0;
    });
    const max = Math.max(1, ...months.map(m => m.total));
    $('#revenueChart').innerHTML = months.map(m => {
      const height = m.total ? Math.max(5, m.total / max * 100) : 0;
      return `<div class="revenue-column"><div class="revenue-value">${m.total ? money(m.total) : '—'}</div><div class="revenue-bar-area"><div class="revenue-bar" style="height:${height}%" title="${esc(m.label)}: ${money(m.total)}"></div></div><div class="revenue-label">${esc(m.label)}</div></div>`;
    }).join('');
  }
  function renderTopSellingProducts() {
    const totals = new Map();
    orders.filter(o => o.status !== 'cancelled').forEach(order => {
      (Array.isArray(order.items) ? order.items : []).forEach(item => {
        // Cấu trúc chi tiết đơn hàng hiện tại: [tên sản phẩm, đơn giá lúc mua, số lượng].
        const name = Array.isArray(item) ? String(item[0] || '') : String(item.name || '');
        const price = Number(Array.isArray(item) ? item[1] : (item.price ?? item.salePrice)) || 0;
        const quantity = Number(Array.isArray(item) ? item[2] : item.quantity) || 0;
        if (!name || quantity <= 0) return;
        const key = name.trim().toLocaleLowerCase('vi-VN');
        const current = totals.get(key) || { name, quantity: 0, revenue: 0 };
        current.quantity += quantity;
        current.revenue += price * quantity;
        totals.set(key, current);
      });
    });
    const ranked = [...totals.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 5);
    const findProduct = name => products.find(p => String(p.name).trim().toLocaleLowerCase('vi-VN') === name.trim().toLocaleLowerCase('vi-VN'));
    $('#topSellingProducts').innerHTML = ranked.length ? ranked.map((item, index) => {
      const product = findProduct(item.name);
      const image = product && product.image ? `<img src="${esc(product.image)}" alt="${esc(item.name)}" onerror="this.style.display='none'">` : '<span class="top-product-placeholder">Ảnh</span>';
      return `<div class="top-selling-item"><span class="rank-number">${index + 1}</span>${image}<div class="top-selling-info"><b>${esc(item.name)}</b><small>${item.quantity} sản phẩm đã đặt</small></div><strong>${money(item.revenue)}</strong></div>`;
    }).join('') : '<div class="empty-state">Chưa có dữ liệu bán hàng.</div>';
  }
  function categoryOptions() { const categories = [...new Set(products.map(p => p.category).filter(Boolean))]; $('#categoryFilter').innerHTML = '<option value="">Tất cả danh mục</option>' + categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join(''); }
  function renderProducts() {
    categoryOptions(); const q = ($('#productSearch').value || '').toLowerCase(), cat = $('#categoryFilter').value;
    const list = products.filter(p => String(p.name).toLowerCase().includes(q) && (!cat || p.category === cat));
    $('#productCount').textContent = `${list.length} sản phẩm`;
    $('#productTable').innerHTML = list.length ? list.map(p => `<tr><td><div class="product-cell"><img src="${esc(p.image || '')}" onerror="this.style.display='none'"><div><b>${esc(p.name)}</b><small>#${esc(p.id)}</small></div></div></td><td>${esc(p.category)}</td><td>${money(p.originalPrice)}</td><td><b>${money(p.salePrice)}</b></td><td><button class="action-btn" data-edit-product="${p.id}">Sửa</button><button class="action-btn danger-btn" data-delete-product="${p.id}">Xóa</button></td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">Không tìm thấy sản phẩm phù hợp.</td></tr>';
  }
  function openProduct(product) {
    $('#productForm').reset(); $('#editProductId').value = product ? product.id : ''; $('#dialogTitle').textContent = product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm';
    if (product) { $('#pName').value = product.name || ''; $('#pCategory').value = product.category || 'Đồ ăn liền'; $('#pOriginal').value = product.originalPrice || 0; $('#pSale').value = product.salePrice || 0; $('#pImage').value = product.image || ''; $('#pDescription').value = product.description || ''; }
    $('#productDialog').showModal();
  }
  function saveProduct(e) {
    e.preventDefault(); const id = Number($('#editProductId').value), name = $('#pName').value.trim(), originalPrice = Number($('#pOriginal').value), salePrice = Number($('#pSale').value);
    if (!name || originalPrice < 0 || salePrice < 0 || !Number.isFinite(originalPrice) || !Number.isFinite(salePrice)) return notify('Vui lòng kiểm tra lại thông tin sản phẩm.');
    const old = products.find(p => Number(p.id) === id);
    const item = { ...(old || {}), id: old ? old.id : Math.max(0,...products.map(p => Number(p.id)||0))+1, name, category: $('#pCategory').value, originalPrice, salePrice, image: $('#pImage').value.trim(), description: $('#pDescription').value.trim() };
    if (old) {
      const index = products.findIndex(p => Number(p.id) === id);
      if (index !== -1) products.splice(index, 1, item);
    } else {
      products.push(item);
    }
    $('#productDialog').close(); saveProducts();
  }
  function deleteProduct(id) {
    const p = products.find(x => Number(x.id) === Number(id));
    if (!p || !confirm(`Bạn có chắc muốn xóa sản phẩm “${p.name}”?`)) return;
    const index = products.findIndex(x => Number(x.id) === Number(id));
    if (index !== -1) products.splice(index, 1);
    saveProducts();
  }
  function renderOrders() {
    const q = ($('#orderSearch').value || '').toLowerCase(), status = $('#orderStatusFilter').value;
    const list = [...orders].filter(o => `${o.code} ${o.receiver}`.toLowerCase().includes(q) && (!status || o.status === status)).sort((a,b) => Number(b.id)-Number(a.id));
    $('#orderTable').innerHTML = list.length ? list.map(o => `<tr><td><button class="text-btn" data-order-detail="${o.id}">${esc(o.code || '#'+o.id)}</button></td><td>${esc(o.receiver || '—')}<small style="display:block;color:#9aa49c;margin-top:4px">${esc(o.rphone || '')}</small></td><td>${esc(o.createdAt || '—')}</td><td><b>${money(o.total)}</b></td><td>${PAY[o.payment] || esc(o.payment || '—')}<br><span class="pill ${o.paid === 'paid' ? 'active' : 'unpaid'}">${o.paid === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></td><td><span class="pill ${esc(o.status)}">${STATUS[o.status] || esc(o.status)}</span></td><td><select class="inline-status" data-order-status="${o.id}" aria-label="Trạng thái đơn ${esc(o.code)}">${Object.entries(STATUS).map(([k,v]) => `<option value="${k}" ${o.status===k?'selected':''}>${v}</option>`).join('')}</select></td></tr>`).join('') : '<tr><td colspan="7" class="empty-state">Chưa có đơn hàng phù hợp.</td></tr>';
  }
  function changeOrder(id,status) { const order = orders.find(o => Number(o.id) === Number(id)); if (!order) return; order.status = status; order.history = Array.isArray(order.history) ? order.history : []; order.history.push([status, `Quản trị viên cập nhật: ${STATUS[status]}`, new Date().toLocaleString('sv-SE').slice(0,16)]); if (status === 'completed' && order.payment === 'cod') order.paid = 'paid'; if (write(KEY.orders,orders)) { renderOrders(); renderDashboard(); notify('Đã cập nhật trạng thái đơn hàng.'); } }
  function orderDetail(id) { const o = orders.find(x => Number(x.id) === Number(id)); if (!o) return; $('#orderDialogTitle').textContent = o.code || `Đơn hàng #${o.id}`; $('#orderDetails').innerHTML = `<div class="detail-box"><b>Người nhận:</b> ${esc(o.receiver)}<br><b>Số điện thoại:</b> ${esc(o.rphone)}<br><b>Địa chỉ:</b> ${esc(o.address)}<br><b>Ngày đặt:</b> ${esc(o.createdAt)}<hr><b>Sản phẩm:</b><ul>${(o.items||[]).map(i=>`<li>${esc(i[0])} × ${Number(i[2])} — ${money(Number(i[1])*Number(i[2]))}</li>`).join('')}</ul><b>Tạm tính:</b> ${money(o.subtotal)}<br><b>Giảm giá:</b> ${money(o.discount)}<br><b>Phí vận chuyển:</b> ${money(o.shipping)}<div class="detail-total">Tổng thanh toán: ${money(o.total)}</div><p><b>Ghi chú:</b> ${esc(o.note || 'Không có')}</p></div>`; $('#orderDialog').showModal(); }
  function renderUsers() {
    const q = ($('#userSearch').value || '').toLowerCase(), role = $('#userRoleFilter').value;
    const list = users.filter(u => `${u.fullName} ${u.email}`.toLowerCase().includes(q) && (!role || u.role === role));
    $('#userTable').innerHTML = list.length ? list.map(u => `<tr><td><b>${esc(u.fullName)}</b><small style="display:block;color:#9aa49c;margin-top:4px">${esc(u.email)}</small></td><td>${esc(u.phone || '—')}</td><td><span class="pill ${u.role==='admin'?'confirmed':'active'}">${u.role==='admin'?'Quản trị viên':'Khách hàng'}</span></td><td><span class="pill ${u.status==='locked'?'locked':'active'}">${u.status==='locked'?'Đã khóa':'Hoạt động'}</span></td><td>${u.role==='admin' ? '<span style="color:#9aa49c">Tài khoản quản trị</span>' : `<button class="action-btn" data-toggle-user="${u.id}" data-status="${u.status==='locked'?'active':'locked'}">${u.status==='locked'?'Mở khóa':'Khóa tài khoản'}</button>`}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">Không tìm thấy người dùng.</td></tr>';
  }
  function toggleUser(id,status) { const user = users.find(u => Number(u.id) === Number(id)); if (!user || user.role === 'admin') return; user.status = status; if (write(KEY.users,users)) { renderUsers(); notify(status === 'locked' ? 'Đã khóa tài khoản người dùng.' : 'Đã mở khóa tài khoản.'); } }
  
  // ==============================
  // QUẢN LÝ LIÊN HỆ VÀ GÓP Ý
  // ==============================

  const CONTACT_API = 'http://localhost:3000/api/contacts';

  const CONTACT_STATUS = {
    new: 'Mới',
    read: 'Đã xem',
    replied: 'Đã phản hồi'
  };

  const CONTACT_TYPE = {
    contact: 'Liên hệ / Cần hỗ trợ',
    feedback: 'Góp ý dịch vụ'
  };

  function getAdminToken() {
    return localStorage.getItem('cendeli_token');
  }

  async function contactRequest(url, options = {}) {
    const token = getAdminToken();

    if (!token) {
      throw new Error('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Không thể xử lý yêu cầu.');
    }

    return result;
  }

  async function loadContacts() {
    const tbody = $('#contactTable');

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Đang tải dữ liệu...</td>
      </tr>
    `;

    try {
      const result = await contactRequest(`${CONTACT_API}/admin`);

      // Hỗ trợ trường hợp API trả về { contacts: [...] }
      // hoặc { data: [...] }.
      contacts = Array.isArray(result.contacts)
        ? result.contacts
        : Array.isArray(result.data)
          ? result.data
          : [];

      renderContacts();
    } catch (error) {
      console.error('Lỗi tải liên hệ:', error);

      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            ${esc(error.message)}
          </td>
        </tr>
      `;

      notify(error.message);
    }
  }

  function renderContacts() {
    const tbody = $('#contactTable');
    const keyword = ($('#contactSearch').value || '')
      .trim().toLocaleLowerCase('vi-VN');

    const type = $('#contactTypeFilter').value;
    const status = $('#contactStatusFilter').value;

    const list = contacts.filter(item => {
      const searchText = [
        item.name,
        item.email,
        item.subject,
        item.message
      ].join(' ').toLocaleLowerCase('vi-VN');

      return searchText.includes(keyword)
        && (!type || item.type === type)
        && (!status || item.status === status);
    });

    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            Không tìm thấy yêu cầu liên hệ phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(item => {
      const statusClass = item.status === 'replied'
        ? 'active'
        : item.status === 'read'
          ? 'confirmed'
          : 'unpaid';

      return `
        <tr>
          <td>#${esc(item.id)}</td>
          <td>
            <b>${esc(item.name)}</b>
            <small style="display:block;color:#9aa49c;margin-top:4px">
              ${esc(item.email)}
            </small>
          </td>
          <td>${esc(CONTACT_TYPE[item.type] || item.type)}</td>
          <td>${esc(item.subject || 'Không có chủ đề')}</td>
          <td>${esc(item.created_at || '—')}</td>
          <td>
            <span class="pill ${statusClass}">
              ${esc(CONTACT_STATUS[item.status] || item.status)}
            </span>
          </td>
          <td>
            <button class="action-btn"
                    data-contact-detail="${esc(item.id)}">
              Xem / Phản hồi
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function showContactDetail(id) {
    const item = contacts.find(c => Number(c.id) === Number(id));

    if (!item) {
      notify('Không tìm thấy yêu cầu liên hệ.');
      return;
    }

    const oldDialog = $('#contactDialog');
    if (oldDialog) oldDialog.remove();

    const dialog = document.createElement('dialog');
    dialog.id = 'contactDialog';
    dialog.className = 'product-dialog';

    dialog.innerHTML = `
      <div class="dialog-head">
        <div>
          <p class="eyebrow">CHĂM SÓC KHÁCH HÀNG</p>
          <h2>Yêu cầu #${esc(item.id)}</h2>
        </div>
        <button type="button" class="close-btn" id="closeContactDialog">×</button>
      </div>

      <div class="detail-box">
        <p><b>Khách hàng:</b> ${esc(item.name)}</p>
        <p><b>Email:</b> ${esc(item.email)}</p>
        <p><b>Số điện thoại:</b> ${esc(item.phone || 'Chưa cung cấp')}</p>
        <p><b>Loại yêu cầu:</b> ${esc(CONTACT_TYPE[item.type] || item.type)}</p>
        <p><b>Chủ đề:</b> ${esc(item.subject || 'Không có chủ đề')}</p>
        <p><b>Ngày gửi:</b> ${esc(item.created_at || '—')}</p>
        <hr>
        <p><b>Nội dung khách hàng:</b></p>
        <p style="white-space:pre-wrap">${esc(item.message)}</p>
        <hr>
        <label for="contactReply"><b>Phản hồi khách hàng</b></label>
        <textarea id="contactReply" rows="5"
          placeholder="Nhập nội dung phản hồi...">${esc(item.admin_reply || '')}</textarea>

        <label for="contactNewStatus"><b>Trạng thái</b></label>
        <select id="contactNewStatus">
          <option value="new" ${item.status === 'new' ? 'selected' : ''}>Mới</option>
          <option value="read" ${item.status === 'read' ? 'selected' : ''}>Đã xem</option>
          <option value="replied" ${item.status === 'replied' ? 'selected' : ''}>Đã phản hồi</option>
        </select>

        <div class="dialog-actions">
          <button type="button" class="secondary-btn" id="saveContactStatus">
            Lưu trạng thái
          </button>
          <button type="button" class="primary-btn" id="sendContactReply">
            Lưu phản hồi
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.showModal();

    $('#closeContactDialog', dialog).addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });

    $('#saveContactStatus', dialog).addEventListener('click', async () => {
      const newStatus = $('#contactNewStatus', dialog).value;

      try {
        await contactRequest(
          `${CONTACT_API}/admin/${item.id}/status`,
          {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
          }
        );

        notify('Đã cập nhật trạng thái yêu cầu.');
        dialog.close();
        dialog.remove();
        await loadContacts();
      } catch (error) {
        notify(error.message);
      }
    });

    $('#sendContactReply', dialog).addEventListener('click', async () => {
      const reply = $('#contactReply', dialog).value.trim();

      if (!reply) {
        notify('Vui lòng nhập nội dung phản hồi.');
        return;
      }

      try {
        await contactRequest(
          `${CONTACT_API}/admin/${item.id}/reply`,
          {
            method: 'POST',
            body: JSON.stringify({ admin_reply: reply })
          }
        );

        notify('Đã lưu phản hồi khách hàng.');
        dialog.close();
        dialog.remove();
        await loadContacts();
      } catch (error) {
        notify(error.message);
      }
    });
  }  
  
  function bind() {
    document.querySelectorAll('.nav-link').forEach(b => b.addEventListener('click',()=>showPage(b.dataset.page)));
    document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.goto)));
    $('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
    $('#logoutBtn').addEventListener('click',()=>{localStorage.removeItem(KEY.current);location.href='index.html';});
    $('#todayLabel').textContent = new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
    $('#productSearch').addEventListener('input',renderProducts); $('#categoryFilter').addEventListener('change',renderProducts);
    $('#addProductBtn').addEventListener('click',()=>openProduct(null)); $('#productForm').addEventListener('submit',saveProduct);
    $('#closeDialog').addEventListener('click',()=>$('#productDialog').close()); $('#cancelDialog').addEventListener('click',()=>$('#productDialog').close());
    $('#productTable').addEventListener('click',e=>{const edit=e.target.closest('[data-edit-product]'),del=e.target.closest('[data-delete-product]');if(edit)openProduct(products.find(p=>Number(p.id)===Number(edit.dataset.editProduct)));if(del)deleteProduct(del.dataset.deleteProduct);});
    $('#orderSearch').addEventListener('input',renderOrders); $('#orderStatusFilter').addEventListener('change',renderOrders);
    $('#orderTable').addEventListener('change',e=>{const s=e.target.closest('[data-order-status]');if(s)changeOrder(s.dataset.orderStatus,s.value);});
    $('#orderTable').addEventListener('click',e=>{const b=e.target.closest('[data-order-detail]');if(b)orderDetail(b.dataset.orderDetail);});
    $('#closeOrderDialog').addEventListener('click',()=>$('#orderDialog').close());
    $('#userSearch').addEventListener('input',renderUsers); $('#userRoleFilter').addEventListener('change',renderUsers);
    $('#userTable').addEventListener('click',e=>{const b=e.target.closest('[data-toggle-user]');if(b)toggleUser(b.dataset.toggleUser,b.dataset.status);});
        // Sự kiện quản lý liên hệ và góp ý
    $('#contactSearch').addEventListener('input', renderContacts);
    $('#contactTypeFilter').addEventListener('change', renderContacts);
    $('#contactStatusFilter').addEventListener('change', renderContacts);

    $('#refreshContactsBtn').addEventListener('click', loadContacts);

    $('#contactTable').addEventListener('click', e => {
      const button = e.target.closest('[data-contact-detail]');
      if (button) showContactDetail(button.dataset.contactDetail);
    });
    window.addEventListener('storage',e=>{if(Object.values(KEY).includes(e.key)){loadData();renderDashboard();}});
  }
  document.addEventListener('DOMContentLoaded',()=>{const me=guard();if(!me)return;if(!Array.isArray(products)){alert('Không tải được danh sách sản phẩm. Hãy kiểm tra thứ tự nhúng js/products.js và js/admin.js.');return;}$('#adminName').textContent=me.fullName||'Quản trị viên';$('#welcomeName').textContent=(me.fullName||'Admin').split(' ').slice(-1)[0];loadData();bind();renderDashboard();});
})();
