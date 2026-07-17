const currentMaster = getSession();
if (!currentMaster || currentMaster.role !== 'master') {
  location.href = 'login.html';
}
if (currentMaster && !currentMaster.contractSigned) {
  alert("Sizning arizangiz hali admin tomonidan tasdiqlanmagan.");
  clearSession();
  location.href = 'login.html';
}

function renderNav() {
  const nav = document.getElementById('navMenu');
  nav.innerHTML = `
    <button class="icon-btn" id="themeToggle" onclick="toggleTheme()"></button>
    <span style="font-weight:600; font-size:14px;">👋 ${currentMaster.name}</span>
    <button class="btn btn-ghost" id="logoutBtn">Chiqish</button>
  `;
  applyTheme(getTheme());
  document.getElementById('logoutBtn').onclick = () => {
    clearSession();
    location.href = 'index.html';
  };
}

function fillCategorySelect() {
  const select = document.getElementById('mCategory');
  select.innerHTML = CATEGORIES.map(
    (c) => `<option value="${c.id}" ${c.id === currentMaster.category ? 'selected' : ''}>${c.icon} ${c.name}</option>`
  ).join('');
}

function fillForm() {
  document.getElementById('mName').value = currentMaster.name || '';
  document.getElementById('mPhone').value = currentMaster.phone || '';
  document.getElementById('mExperience').value = currentMaster.experience || '';
  document.getElementById('mBio').value = currentMaster.bio || '';
  renderPhotoPreview(currentMaster.photo);
}

function renderPhotoPreview(photo) {
  const img = document.getElementById('mPhotoPreview');
  const placeholder = document.getElementById('mPhotoPlaceholder');
  if (photo) {
    img.src = photo;
    img.style.display = 'inline-block';
    placeholder.style.display = 'none';
  } else {
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    placeholder.textContent = (currentMaster.name || '?').trim().charAt(0).toUpperCase();
  }
}

let pendingPhoto = null;
document.getElementById('mPhotoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingPhoto = reader.result;
    renderPhotoPreview(pendingPhoto);
  };
  reader.readAsDataURL(file);
});

function renderRatings() {
  const user = getUsers().find((u) => u.id === currentMaster.id);
  const summary = document.getElementById('ratingSummary');
  const reviews = user.reviews || [];
  if (reviews.length === 0) {
    summary.innerHTML = `<div class="hint">Hozircha baholar yo'q</div>`;
  } else {
    summary.innerHTML = `<div style="font-size:20px; font-weight:800;">⭐ ${user.rating.toFixed(1)} <span style="font-size:13px; color:var(--muted); font-weight:500;">(${reviews.length} ta sharh)</span></div>`;
  }
  document.getElementById('reviewsList').innerHTML = reviews
    .map(
      (r) => `<div style="border-top:1px solid var(--border); padding:10px 0; font-size:14px;">
        <div>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <div style="color:var(--muted);">${r.review || ''}</div>
      </div>`
    )
    .join('');
}

document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const patch = {
    name: document.getElementById('mName').value,
    category: document.getElementById('mCategory').value,
    experience: document.getElementById('mExperience').value,
    bio: document.getElementById('mBio').value,
  };
  if (pendingPhoto) patch.photo = pendingPhoto;
  updateUser(currentMaster.id, patch);
  currentMaster.photo = patch.photo || currentMaster.photo;
  currentMaster.name = patch.name;
  showToast('Profil saqlandi');
});

renderNav();
fillCategorySelect();
fillForm();
renderRatings();
