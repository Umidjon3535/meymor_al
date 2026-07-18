(function () {
  const badge = document.getElementById('chatWidgetBadge');
  if (!badge) return;

  let lastUnreadTotal = 0;
  let firstCheck = true;

  function setBadge(count) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

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
    }, 4000);
  }

  function checkUnread() {
    fetch('/chat/unread/')
      .then((r) => r.json())
      .then((data) => {
        setBadge(data.total);
        if (data.total > 0 && (firstCheck || data.total > lastUnreadTotal)) {
          showToast(`Sizga ${data.total} ta yangi xabar keldi 💬`);
        }
        lastUnreadTotal = data.total;
        firstCheck = false;
      })
      .catch(() => {});
  }

  checkUnread();
  setInterval(checkUnread, 8000);
})();
