(function () {
  function getCookie(name) {
    const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return match ? match.pop() : '';
  }
  const csrftoken = getCookie('csrftoken');

  const btn = document.getElementById('chatWidgetBtn');
  const badge = document.getElementById('chatWidgetBadge');
  const panel = document.getElementById('chatWidgetPanel');
  const backBtn = document.getElementById('chatWidgetBack');
  const closeBtn = document.getElementById('chatWidgetClose');
  const body = document.getElementById('chatWidgetBody');
  const titleEl = document.getElementById('chatWidgetTitle');
  if (!btn) return;

  let currentOrderId = null;
  let pollHandle = null;
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

  function renderOrderList() {
    backBtn.classList.remove('show');
    titleEl.textContent = 'Admin bilan chat';
    currentOrderId = null;
    if (pollHandle) clearInterval(pollHandle);

    fetch('/chat/my-orders/')
      .then((r) => r.json())
      .then((data) => {
        if (data.orders.length === 0) {
          body.innerHTML = '<div class="empty-state" style="padding:20px 0;">Hali buyurtmangiz yo\'q</div>';
          return;
        }
        if (data.orders.length === 1) {
          openThread(data.orders[0].order_id, `${data.orders[0].category_icon} ${data.orders[0].category_name}`);
          return;
        }
        body.innerHTML = '';
        data.orders.forEach((o) => {
          const item = document.createElement('div');
          item.className = 'chat-widget-order-item';
          item.innerHTML = `<span>${o.category_icon} ${o.category_name} <span class="hint">(${o.stage_label})</span></span>`;
          item.addEventListener('click', () => openThread(o.order_id, `${o.category_icon} ${o.category_name}`));
          body.appendChild(item);
        });
      });
  }

  function openThread(orderId, label) {
    currentOrderId = orderId;
    backBtn.classList.add('show');
    titleEl.textContent = label;

    body.innerHTML = `
      <div class="chat-widget-thread">
        <div class="chat-box" id="chatWidgetBox"></div>
        <div class="chat-input">
          <input type="text" id="chatWidgetInput" placeholder="Xabar yozing...">
          <button class="btn btn-primary btn-sm" id="chatWidgetSend">Yuborish</button>
        </div>
      </div>
    `;

    const box = document.getElementById('chatWidgetBox');
    const input = document.getElementById('chatWidgetInput');
    const sendBtn = document.getElementById('chatWidgetSend');

    function render(messages) {
      box.innerHTML = '';
      if (messages.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.style.padding = '20px 0';
        empty.textContent = "Xabarlar yo'q";
        box.appendChild(empty);
      } else {
        messages.forEach((m) => {
          const bubble = document.createElement('div');
          bubble.className = 'chat-msg ' + (m.sender === 'client' ? 'me' : 'other');
          bubble.textContent = m.text;
          box.appendChild(bubble);
        });
      }
      box.scrollTop = box.scrollHeight;
    }

    function poll() {
      fetch(`/chat/${orderId}/messages/`)
        .then((r) => r.json())
        .then((data) => {
          render(data.messages);
          checkUnread();
        })
        .catch(() => {});
    }

    function send() {
      const text = input.value.trim();
      if (!text) return;
      fetch(`/chat/${orderId}/send/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrftoken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'text=' + encodeURIComponent(text),
      }).then(() => {
        input.value = '';
        poll();
      });
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') send();
    });

    if (pollHandle) clearInterval(pollHandle);
    poll();
    pollHandle = setInterval(poll, 2500);
  }

  btn.addEventListener('click', () => {
    const willOpen = !panel.classList.contains('open');
    panel.classList.toggle('open');
    if (willOpen) renderOrderList();
  });
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));
  backBtn.addEventListener('click', renderOrderList);

  window.openWidgetChat = function (orderId, label) {
    panel.classList.add('open');
    openThread(orderId, label);
  };

  checkUnread();
  setInterval(checkUnread, 8000);
})();
