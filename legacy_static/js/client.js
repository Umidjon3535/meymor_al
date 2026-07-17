const currentUser = getSession();
if (!currentUser || currentUser.role !== 'client') {
  location.href = 'login.html';
}

let activeOrderId = null;

function renderNav() {
  const nav = document.getElementById('navMenu');
  nav.innerHTML = `
    <button class="icon-btn" id="themeToggle" onclick="toggleTheme()"></button>
    <span style="font-weight:600; font-size:14px;">👋 ${currentUser.name}</span>
    <a href="index.html" class="btn btn-outline">Yangi buyurtma</a>
    <button class="btn btn-ghost" id="logoutBtn">Chiqish</button>
  `;
  applyTheme(getTheme());
  document.getElementById('logoutBtn').onclick = () => {
    clearSession();
    location.href = 'index.html';
  };
}

function renderOrders() {
  const list = document.getElementById('ordersList');
  const orders = getOrders()
    .filter((o) => o.clientId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (orders.length === 0) {
    list.innerHTML = `<div class="empty-state">Hali buyurtmalar yo'q. <a href="index.html" style="color:var(--green); font-weight:700;">Buyurtma berish</a></div>`;
    return;
  }

  list.innerHTML = orders
    .map((o) => {
      const stagesHtml = ORDER_STAGES.map((s, i) => {
        let cls = '';
        if (i < o.stage) cls = 'done';
        else if (i === o.stage) cls = 'active';
        return `<div class="stage ${cls}"><div class="dot">${i < o.stage ? '✓' : i + 1}</div>${s}</div>`;
      }).join('');

      const master = o.masterId ? getUsers().find((u) => u.id === o.masterId) : null;
      const masterInfo = master
        ? `<div class="hint">Biriktirilgan usta: <b>${master.name}</b> (${master.phone})</div>`
        : '';

      const showRateBtn = o.stage === 3 && !o.rating && master;
      const ratingDisplay = o.rating
        ? `<div class="hint">Sizning bahoyingiz: ${'★'.repeat(o.rating)}${'☆'.repeat(5 - o.rating)} — "${o.review || ''}"</div>`
        : '';

      return `
      <div class="card order-card">
        <div class="order-head">
          <div class="order-cat">${o.categoryName}</div>
          <div class="order-date">${new Date(o.createdAt).toLocaleString('uz-UZ')}</div>
        </div>
        <div class="order-desc">${o.description || 'Izohsiz'} · ${o.address}</div>
        <div class="stages">${stagesHtml}</div>
        ${masterInfo}
        ${ratingDisplay}
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="btn btn-outline btn-sm" onclick="openChatModal('${o.id}')">💬 Admin bilan chat</button>
          ${showRateBtn ? `<button class="btn btn-primary btn-sm" onclick="openRateModal('${o.id}')">⭐ Baholash</button>` : ''}
        </div>
      </div>`;
    })
    .join('');
}

/* ---------- Chat ---------- */
function openChatModal(orderId) {
  activeOrderId = orderId;
  document.getElementById('chatModal').style.display = 'flex';
  renderChat();
}
function closeChatModal() {
  document.getElementById('chatModal').style.display = 'none';
  activeOrderId = null;
}
function renderChat() {
  const box = document.getElementById('chatBox');
  const messages = getMessages(activeOrderId);
  if (messages.length === 0) {
    box.innerHTML = `<div class="empty-state" style="padding:20px 0;">Xabarlar yo'q</div>`;
  } else {
    box.innerHTML = messages
      .map(
        (m) => `<div class="chat-msg ${m.sender === 'client' ? 'me' : 'other'}">${m.text}</div>`
      )
      .join('');
  }
  box.scrollTop = box.scrollHeight;
}
document.getElementById('chatSendBtn').addEventListener('click', sendChat);
document.getElementById('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChat();
});
function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !activeOrderId) return;
  addMessage(activeOrderId, 'client', text);
  input.value = '';
  renderChat();
}

/* ---------- Rating ---------- */
let selectedRating = 0;
function openRateModal(orderId) {
  activeOrderId = orderId;
  selectedRating = 0;
  document.getElementById('reviewText').value = '';
  updateStars();
  document.getElementById('rateModal').style.display = 'flex';
}
function closeRateModal() {
  document.getElementById('rateModal').style.display = 'none';
  activeOrderId = null;
}
function updateStars() {
  document.querySelectorAll('#ratingStars span').forEach((s) => {
    s.classList.toggle('filled', Number(s.dataset.v) <= selectedRating);
  });
}
document.querySelectorAll('#ratingStars span').forEach((s) => {
  s.addEventListener('click', () => {
    selectedRating = Number(s.dataset.v);
    updateStars();
  });
});
document.getElementById('submitRatingBtn').addEventListener('click', () => {
  if (!selectedRating) {
    showToast("Iltimos, yulduzcha tanlang");
    return;
  }
  const order = getOrders().find((o) => o.id === activeOrderId);
  const review = document.getElementById('reviewText').value.trim();
  updateOrder(activeOrderId, { rating: selectedRating, review, stage: 3 });

  if (order && order.masterId) {
    const master = getUsers().find((u) => u.id === order.masterId);
    if (master) {
      const reviews = master.reviews || [];
      reviews.push({ rating: selectedRating, review, orderId: activeOrderId });
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      updateUser(master.id, { reviews, rating: avg });
    }
  }

  closeRateModal();
  renderOrders();
  showToast('Rahmat! Bahoyingiz saqlandi.');
});

renderNav();
renderOrders();
setInterval(() => {
  renderOrders();
  if (activeOrderId && document.getElementById('chatModal').style.display === 'flex') renderChat();
}, 2000);
