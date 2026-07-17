function initChat(orderId, myRole, boxId, inputId, sendBtnId, urls) {
  const box = document.getElementById(boxId);
  let input = document.getElementById(inputId);
  input.replaceWith(input.cloneNode(true));
  input = document.getElementById(inputId);
  let sendBtn = document.getElementById(sendBtnId);
  sendBtn.replaceWith(sendBtn.cloneNode(true));
  sendBtn = document.getElementById(sendBtnId);

  function getCookie(name) {
    const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return match ? match.pop() : '';
  }
  const csrftoken = getCookie('csrftoken');

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
        bubble.className = 'chat-msg ' + (m.sender === myRole ? 'me' : 'other');
        bubble.textContent = m.text;
        box.appendChild(bubble);
      });
    }
    box.scrollTop = box.scrollHeight;
  }

  function poll() {
    fetch(urls.messages)
      .then((r) => r.json())
      .then((data) => render(data.messages))
      .catch(() => {});
  }

  function send() {
    const text = input.value.trim();
    if (!text) return;
    fetch(urls.send, {
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

  if (window.__chatInterval) clearInterval(window.__chatInterval);
  poll();
  window.__chatInterval = setInterval(poll, 2500);
}
