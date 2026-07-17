/* Bosh sahifa mantig'i */

let selectedCategory = null;

function renderNav() {
  const nav = document.getElementById('navMenu');
  const user = getSession();
  const themeBtn = `<button class="icon-btn" id="themeToggle" onclick="toggleTheme()"></button>`;

  if (!user) {
    nav.innerHTML = `
      ${themeBtn}
      <a href="login.html" class="btn btn-outline">Kirish</a>
      <a href="login.html?tab=register" class="btn btn-primary">Ro'yxatdan o'tish</a>
    `;
    applyTheme(getTheme());
    return;
  }
  let dashboardLink = 'client.html';
  if (user.role === 'admin') dashboardLink = 'admin.html';
  if (user.role === 'master') dashboardLink = 'master.html';

  nav.innerHTML = `
    ${themeBtn}
    <span style="font-weight:600; font-size:14px;">👋 ${user.name}</span>
    <a href="${dashboardLink}" class="btn btn-primary">Kabinetim</a>
    <button class="btn btn-ghost" id="logoutBtn">Chiqish</button>
  `;
  applyTheme(getTheme());
  document.getElementById('logoutBtn').onclick = () => {
    clearSession();
    location.reload();
  };
}

function renderCategories(filter = '') {
  const grid = document.getElementById('categoryGrid');
  const list = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );
  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state">Hech narsa topilmadi</div>`;
    return;
  }
  grid.innerHTML = list
    .map(
      (c) => `
    <div class="category-card" data-id="${c.id}">
      <div class="emoji">${c.icon}</div>
      <div class="name">${c.name}</div>
    </div>`
    )
    .join('');

  grid.querySelectorAll('.category-card').forEach((el) => {
    el.addEventListener('click', () => onCategoryClick(el.dataset.id));
  });
}

function onCategoryClick(catId) {
  const user = getSession();
  const cat = CATEGORIES.find((c) => c.id === catId);
  selectedCategory = cat;

  if (!user) {
    location.href = `login.html?tab=register&redirect=order&cat=${catId}`;
    return;
  }
  if (user.role !== 'client') {
    showToast("Buyurtma berish faqat mijozlar uchun");
    return;
  }
  openOrderModal(cat, user);
}

function openOrderModal(cat, user) {
  document.getElementById('orderModalTitle').textContent = `Buyurtma: ${cat.name}`;
  document.getElementById('orderName').value = user.name || '';
  document.getElementById('orderPhone').value = user.phone || '';
  document.getElementById('orderModal').style.display = 'flex';
}

function closeOrderModal() {
  document.getElementById('orderModal').style.display = 'none';
}

document.getElementById('orderForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = getSession();
  if (!user || !selectedCategory) return;

  addOrder({
    clientId: user.id,
    clientName: document.getElementById('orderName').value,
    clientPhone: document.getElementById('orderPhone').value,
    address: document.getElementById('orderAddress').value,
    description: document.getElementById('orderDesc').value,
    category: selectedCategory.id,
    categoryName: selectedCategory.name,
  });

  closeOrderModal();
  document.getElementById('orderForm').reset();
  showToast('Buyurtma yuborildi ✅');
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  renderCategories(e.target.value);
});

function renderHeroStats() {
  const masters = getUsers().filter((u) => u.role === 'master' && u.contractSigned);
  const orders = getOrders();
  const completed = orders.filter((o) => o.stage === 3).length;
  document.getElementById('heroStats').innerHTML = `
    <div class="hero-stat"><div class="num">${masters.length}</div><div class="label">Usta</div></div>
    <div class="hero-stat"><div class="num">${CATEGORIES.length}</div><div class="label">Yo'nalish</div></div>
    <div class="hero-stat"><div class="num">${completed}</div><div class="label">Yakunlangan ish</div></div>
  `;
}

function renderMasters() {
  const grid = document.getElementById('mastersGrid');
  const masters = getUsers()
    .filter((u) => u.role === 'master' && u.contractSigned)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  if (masters.length === 0) {
    grid.innerHTML = `<div class="empty-state">Hozircha tasdiqlangan ustalar yo'q</div>`;
    return;
  }

  grid.innerHTML = masters
    .map((m) => {
      const cat = CATEGORIES.find((c) => c.id === m.category);
      const avatar = m.photo
        ? `<img src="${m.photo}" alt="${m.name}">`
        : `<div class="avatar-placeholder">${(m.name || '?').trim().charAt(0).toUpperCase()}</div>`;
      const ratingText = m.rating ? `⭐ ${m.rating.toFixed(1)} (${(m.reviews || []).length})` : 'Hali baholanmagan';
      return `
      <div class="master-card">
        ${avatar}
        <div class="m-name">${m.name}</div>
        <div class="m-cat">${cat ? cat.icon + ' ' + cat.name : ''}${m.experience ? ' · ' + m.experience + ' yil tajriba' : ''}</div>
        <div class="m-rating">${ratingText}</div>
        <div class="m-bio">${m.bio || 'Ma\'lumot kiritilmagan'}</div>
      </div>`;
    })
    .join('');
}

renderNav();
renderCategories();
renderHeroStats();
renderMasters();

/* Agar login sahifasidan "redirect=order" bilan qaytilgan bo'lsa */
const params = new URLSearchParams(location.search);
if (params.get('redirect') === 'order') {
  const catId = params.get('cat');
  const user = getSession();
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (user && user.role === 'client' && cat) {
    selectedCategory = cat;
    openOrderModal(cat, user);
  }
}
