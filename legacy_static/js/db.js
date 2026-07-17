/* Al-Meymor — soddalashtirilgan "backend" (localStorage asosida) */

const DB_KEYS = {
  users: 'am_users',
  orders: 'am_orders',
  messages: 'am_messages',
  session: 'am_session',
};

const CATEGORIES = [
  { id: 'arxitektura', name: 'Arxitektura', icon: '🏛️' },
  { id: 'beton', name: 'Beton', icon: '🧱' },
  { id: 'euroremont', name: 'Euro remont', icon: '🏠' },
  { id: 'mebel', name: 'Mebel', icon: '🪑' },
  { id: 'qurilish', name: 'Qurilish', icon: '🏗️' },
  { id: 'reklama', name: 'Reklama', icon: '📣' },
  { id: 'santexnika', name: 'Santexnika', icon: '🔧' },
  { id: 'travertin', name: 'Travertin', icon: '🪨' },
];

const ORDER_STAGES = [
  'Buyurtma yuborildi',
  'Admin ko\'rib chiqmoqda',
  'Shartnoma tuzildi',
  'Ish yakunlandi',
];

function db_read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function db_write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function seedDB() {
  const users = db_read(DB_KEYS.users);
  if (users.length === 0) {
    db_write(DB_KEYS.users, [
      {
        id: 'admin1',
        role: 'admin',
        name: 'Admin',
        phone: 'admin',
        password: 'admin123',
      },
    ]);
  }
}
seedDB();

/* ---------- Users ---------- */
function getUsers() {
  return db_read(DB_KEYS.users);
}
function saveUsers(users) {
  db_write(DB_KEYS.users, users);
}
function findUserByPhone(phone) {
  return getUsers().find((u) => u.phone === phone);
}
function addUser(user) {
  const users = getUsers();
  user.id = uid();
  users.push(user);
  saveUsers(users);
  return user;
}
function updateUser(userId, patch) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users);
  return users[idx];
}

/* ---------- Session ---------- */
function setSession(userId) {
  localStorage.setItem(DB_KEYS.session, userId);
}
function getSession() {
  const id = localStorage.getItem(DB_KEYS.session);
  if (!id) return null;
  return getUsers().find((u) => u.id === id) || null;
}
function clearSession() {
  localStorage.removeItem(DB_KEYS.session);
}

/* ---------- Orders ---------- */
function getOrders() {
  return db_read(DB_KEYS.orders);
}
function saveOrders(orders) {
  db_write(DB_KEYS.orders, orders);
}
function addOrder(order) {
  const orders = getOrders();
  order.id = uid();
  order.stage = 0;
  order.createdAt = new Date().toISOString();
  order.rating = null;
  order.review = null;
  orders.push(order);
  saveOrders(orders);
  return order;
}
function updateOrder(orderId, patch) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...patch };
  saveOrders(orders);
  return orders[idx];
}

/* ---------- Messages ---------- */
function getMessages(orderId) {
  return db_read(DB_KEYS.messages).filter((m) => m.orderId === orderId);
}
function addMessage(orderId, sender, text) {
  const messages = db_read(DB_KEYS.messages);
  messages.push({ id: uid(), orderId, sender, text, time: new Date().toISOString() });
  db_write(DB_KEYS.messages, messages);
}

/* ---------- Toast ---------- */
function showToast(text) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = text;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
