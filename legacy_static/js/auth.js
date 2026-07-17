const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

function showLoginTab() {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
}
function showRegisterTab() {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
}
tabLogin.addEventListener('click', showLoginTab);
tabRegister.addEventListener('click', showRegisterTab);

/* Role toggle */
let selectedRole = 'client';
const roleButtons = document.querySelectorAll('.role-btn');
const masterCategoryField = document.getElementById('masterCategoryField');
const masterHint = document.getElementById('masterHint');
const regCategorySelect = document.getElementById('regCategory');

regCategorySelect.innerHTML = CATEGORIES.map(
  (c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`
).join('');

roleButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    roleButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedRole = btn.dataset.role;
    const isMaster = selectedRole === 'master';
    masterCategoryField.style.display = isMaster ? 'block' : 'none';
    masterHint.style.display = isMaster ? 'block' : 'none';
  });
});

/* Query params: preselect tab */
const params = new URLSearchParams(location.search);
if (params.get('tab') === 'register') showRegisterTab();

/* LOGIN */
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  const user = findUserByPhone(phone);
  if (!user || user.password !== password) {
    errorEl.textContent = "Telefon raqam yoki parol noto'g'ri";
    return;
  }
  if (user.role === 'master' && !user.contractSigned) {
    errorEl.textContent = "Arizangiz hali admin tomonidan tasdiqlanmagan. Admin siz bilan bog'lanadi.";
    return;
  }

  setSession(user.id);
  if (user.role === 'admin') location.href = 'admin.html';
  else if (user.role === 'master') location.href = 'master.html';
  else location.href = 'client.html';
});

/* REGISTER */
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('regError');
  errorEl.textContent = '';

  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;

  if (findUserByPhone(phone)) {
    errorEl.textContent = 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan';
    return;
  }

  const newUser = {
    role: selectedRole,
    name,
    phone,
    password,
  };

  if (selectedRole === 'master') {
    newUser.category = regCategorySelect.value;
    newUser.contractSigned = false;
    newUser.bio = '';
    newUser.experience = '';
    newUser.rating = 0;
    newUser.reviews = [];
    addUser(newUser);
    showToast("Ariza yuborildi. Admin siz bilan bog'lanadi.");
    showLoginTab();
    registerForm.reset();
    return;
  }

  const created = addUser(newUser);
  setSession(created.id);

  const redirect = params.get('redirect');
  const cat = params.get('cat');
  if (redirect === 'order' && cat) {
    location.href = `index.html?redirect=order&cat=${cat}`;
  } else {
    location.href = 'client.html';
  }
});
