const adminUser = getSession();
if (!adminUser || adminUser.role !== 'admin') {
  location.href = 'login.html';
}

let activeDetailOrderId = null;

/* ---------- Sidebar navigation ---------- */
document.querySelectorAll('.nav-item[data-section]').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item[data-section]').forEach((i) => i.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('main section').forEach((s) => (s.style.display = 'none'));
    document.getElementById('section-' + item.dataset.section).style.display = 'block';
  });
});
document.getElementById('adminLogout').addEventListener('click', () => {
  clearSession();
  location.href = 'index.html';
});
document.getElementById('adminThemeToggle').addEventListener('click', toggleTheme);

/* ---------- Orders ---------- */
function renderOrdersTable() {
  const orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const wrap = document.getElementById('ordersTableWrap');
  if (orders.length === 0) {
    wrap.innerHTML = `<div class="empty-state">Buyurtmalar yo'q</div>`;
    return;
  }
  wrap.innerHTML = `
  <table class="table">
    <thead><tr><th>Mijoz</th><th>Kategoriya</th><th>Manzil</th><th>Holat</th><th></th></tr></thead>
    <tbody>
      ${orders
        .map(
          (o) => `
        <tr>
          <td>${o.clientName}<br><span class="hint">${o.clientPhone}</span></td>
          <td>${o.categoryName}</td>
          <td>${o.address}</td>
          <td><span class="badge">${ORDER_STAGES[o.stage]}</span></td>
          <td><button class="btn btn-outline btn-sm" onclick="openOrderDetail('${o.id}')">Ko'rish</button></td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>`;
}

function openOrderDetail(orderId) {
  activeDetailOrderId = orderId;
  document.getElementById('orderDetailModal').style.display = 'flex';
  renderOrderDetail();
}
function closeOrderDetail() {
  document.getElementById('orderDetailModal').style.display = 'none';
  activeDetailOrderId = null;
}

function renderOrderDetail() {
  const o = getOrders().find((x) => x.id === activeDetailOrderId);
  if (!o) return;
  const body = document.getElementById('orderDetailBody');
  const masters = getUsers().filter(
    (u) => u.role === 'master' && u.contractSigned && u.category === o.category
  );

  const stagesHtml = ORDER_STAGES.map((s, i) => {
    let cls = '';
    if (i < o.stage) cls = 'done';
    else if (i === o.stage) cls = 'active';
    return `<div class="stage ${cls}"><div class="dot">${i < o.stage ? '✓' : i + 1}</div>${s}</div>`;
  }).join('');

  const nextBtn =
    o.stage < 3
      ? `<button class="btn btn-primary btn-sm" onclick="advanceStage('${o.id}')">Keyingi bosqichga o'tkazish →</button>`
      : `<span class="tag approved">Yakunlangan</span>`;

  body.innerHTML = `
    <div><b>${o.categoryName}</b> — ${o.clientName} (${o.clientPhone})</div>
    <div class="hint">${o.address}</div>
    <div class="order-desc">${o.description || 'Izohsiz'}</div>
    <div class="stages">${stagesHtml}</div>

    <div class="field">
      <label>Usta biriktirish</label>
      <select id="assignMasterSelect">
        <option value="">— tanlanmagan —</option>
        ${masters
          .map(
            (m) => `<option value="${m.id}" ${o.masterId === m.id ? 'selected' : ''}>${m.name} (⭐ ${(m.rating || 0).toFixed(1)})</option>`
          )
          .join('')}
      </select>
    </div>
    <button class="btn btn-outline btn-sm" onclick="assignMaster('${o.id}')">Saqlash</button>

    <div style="margin:16px 0;">${nextBtn}</div>

    <h4>Chat</h4>
    <div class="chat-box" id="adminChatBox"></div>
    <div class="chat-input">
      <input type="text" id="adminChatInput" placeholder="Xabar yozing...">
      <button class="btn btn-primary btn-sm" id="adminChatSendBtn">Yuborish</button>
    </div>
  `;

  renderAdminChat();
  document.getElementById('adminChatSendBtn').onclick = sendAdminChat;
  document.getElementById('adminChatInput').onkeydown = (e) => {
    if (e.key === 'Enter') sendAdminChat();
  };
}

function advanceStage(orderId) {
  const o = getOrders().find((x) => x.id === orderId);
  if (!o || o.stage >= 3) return;
  updateOrder(orderId, { stage: o.stage + 1 });
  renderOrderDetail();
  renderOrdersTable();
  showToast(`Buyurtma holati: ${ORDER_STAGES[o.stage + 1]}`);
}

function assignMaster(orderId) {
  const masterId = document.getElementById('assignMasterSelect').value;
  updateOrder(orderId, { masterId: masterId || null });
  showToast('Usta biriktirildi');
  renderOrdersTable();
}

function renderAdminChat() {
  const box = document.getElementById('adminChatBox');
  const messages = getMessages(activeDetailOrderId);
  if (messages.length === 0) {
    box.innerHTML = `<div class="empty-state" style="padding:20px 0;">Xabarlar yo'q</div>`;
  } else {
    box.innerHTML = messages
      .map((m) => `<div class="chat-msg ${m.sender === 'admin' ? 'me' : 'other'}">${m.text}</div>`)
      .join('');
  }
  box.scrollTop = box.scrollHeight;
}
function sendAdminChat() {
  const input = document.getElementById('adminChatInput');
  const text = input.value.trim();
  if (!text || !activeDetailOrderId) return;
  addMessage(activeDetailOrderId, 'admin', text);
  input.value = '';
  renderAdminChat();
}

/* ---------- Master requests ---------- */
function renderRequestsTable() {
  const requests = getUsers().filter((u) => u.role === 'master' && !u.contractSigned);
  const wrap = document.getElementById('requestsTableWrap');
  if (requests.length === 0) {
    wrap.innerHTML = `<div class="empty-state">Yangi so'rovlar yo'q</div>`;
    return;
  }
  wrap.innerHTML = `
  <table class="table">
    <thead><tr><th>Ism</th><th>Telefon</th><th>Yo'nalish</th><th></th></tr></thead>
    <tbody>
      ${requests
        .map((u) => {
          const cat = CATEGORIES.find((c) => c.id === u.category);
          return `
        <tr>
          <td>${u.name}</td>
          <td>${u.phone}</td>
          <td>${cat ? cat.icon + ' ' + cat.name : '-'}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="approveMaster('${u.id}')">Shartnoma tuzish / tasdiqlash</button>
            <button class="btn btn-danger btn-sm" onclick="rejectMaster('${u.id}')">Rad etish</button>
          </td>
        </tr>`;
        })
        .join('')}
    </tbody>
  </table>`;
}
function approveMaster(userId) {
  updateUser(userId, { contractSigned: true });
  showToast('Usta tasdiqlandi, endi tizimga kira oladi');
  renderRequestsTable();
  renderMastersTable();
}
function rejectMaster(userId) {
  const users = getUsers().filter((u) => u.id !== userId);
  saveUsers(users);
  showToast("So'rov rad etildi");
  renderRequestsTable();
}

/* ---------- Masters ---------- */
function renderMastersTable() {
  const masters = getUsers().filter((u) => u.role === 'master' && u.contractSigned);
  const wrap = document.getElementById('mastersTableWrap');
  if (masters.length === 0) {
    wrap.innerHTML = `<div class="empty-state">Tasdiqlangan ustalar yo'q</div>`;
    return;
  }
  wrap.innerHTML = `
  <table class="table">
    <thead><tr><th>Ism</th><th>Telefon</th><th>Yo'nalish</th><th>Reyting</th></tr></thead>
    <tbody>
      ${masters
        .map((u) => {
          const cat = CATEGORIES.find((c) => c.id === u.category);
          return `<tr>
            <td>${u.name}</td>
            <td>${u.phone}</td>
            <td>${cat ? cat.icon + ' ' + cat.name : '-'}</td>
            <td>⭐ ${(u.rating || 0).toFixed(1)} (${(u.reviews || []).length})</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>`;
}

/* ---------- Clients ---------- */
function renderClientsTable() {
  const clients = getUsers().filter((u) => u.role === 'client');
  const wrap = document.getElementById('clientsTableWrap');
  if (clients.length === 0) {
    wrap.innerHTML = `<div class="empty-state">Mijozlar yo'q</div>`;
    return;
  }
  wrap.innerHTML = `
  <table class="table">
    <thead><tr><th>Ism</th><th>Telefon</th><th>Buyurtmalar soni</th></tr></thead>
    <tbody>
      ${clients
        .map((u) => {
          const count = getOrders().filter((o) => o.clientId === u.id).length;
          return `<tr><td>${u.name}</td><td>${u.phone}</td><td>${count}</td></tr>`;
        })
        .join('')}
    </tbody>
  </table>`;
}

function renderAll() {
  renderOrdersTable();
  renderRequestsTable();
  renderMastersTable();
  renderClientsTable();
}

renderAll();
setInterval(() => {
  renderAll();
  if (activeDetailOrderId && document.getElementById('orderDetailModal').style.display === 'flex') {
    renderAdminChat();
  }
}, 2000);
