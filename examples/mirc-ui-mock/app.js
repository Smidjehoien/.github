/* SPDX-License-Identifier: MPL-2.0 */
// mIRCat UI-only mock — no networking, no crypto. All state is in-memory.
(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const channelListEl = $('#channel-list');
  const userListEl = $('#user-list');
  const logEl = $('#log');
  const inputEl = $('#input');
  const roomNameEl = $('#room-name');
  const themeToggleEl = document.querySelector('.theme-toggle');

  const channels = ['#general', '#random', '#cozy-outpost'];
  const users = ['alice', 'bob', 'carol', 'dave'];
  const nickColors = ['nick-a','nick-b','nick-c','nick-d','nick-e','nick-f'];
  
  // Cache nick color calculations to avoid rehashing
  const nickColorCache = new Map();
  const nickColorClass = (nick) => {
    if (nickColorCache.has(nick)) return nickColorCache.get(nick);
    const idx = Math.abs(hash(nick)) % 6; // 0..5
    const color = nickColors[idx];
    nickColorCache.set(nick, color);
    return color;
  };

  // Simple hash for color bucketing
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return h;
  }

  // In-memory message store per channel
  /** @type {Record<string, {time:number,nick:string,text:string}[]>} */
  const store = Object.fromEntries(
    channels.map((c) => [c, []])
  );

  // Seed a few messages in #general
  push('#general', 'alice', 'hello world');
  push('#general', 'bob', 'hi!');
  push('#general', 'you', '/join #cozy-outpost');

  renderChannels('#general');
  renderUsers(users);
  switchChannel('#general');

  // Event: send message on Enter
  $('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = inputEl.value.trim();
    if (!val) return;
    const chan = currentChannel();
    push(chan, 'you', val);
    inputEl.value = '';
    renderLog(chan);
    scrollLogToBottom();
  });

  // Theme toggle
  themeToggleEl.addEventListener('click', () => document.body.classList.toggle('light'));
  themeToggleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') document.body.classList.toggle('light');
  });

  function currentChannel() {
    const active = channelListEl.querySelector('li.active');
    return active?.dataset.value ?? '#general';
  }

  function renderChannels(active) {
    // More efficient DOM clearing
    while (channelListEl.firstChild) {
      channelListEl.removeChild(channelListEl.firstChild);
    }
    channels.forEach((c) => {
      const li = document.createElement('li');
      li.dataset.value = c;
      if (c === active) li.classList.add('active');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = c;
      btn.addEventListener('click', () => switchChannel(c));
      li.appendChild(btn);
      channelListEl.appendChild(li);
    });
  }

  function renderUsers(nicks) {
    // More efficient DOM clearing
    while (userListEl.firstChild) {
      userListEl.removeChild(userListEl.firstChild);
    }
    nicks.forEach((n) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<span class="${nickColorClass(n)}">${escapeHtml(n)}</span>`;
      li.appendChild(btn);
      userListEl.appendChild(li);
    });
  }

  function switchChannel(chan) {
    // update active UI
    $$('#channel-list li').forEach((li) => {
      li.classList.toggle('active', li.dataset.value === chan);
    });
    roomNameEl.textContent = chan;
    renderLog(chan);
    scrollLogToBottom();
  }

  function renderLog(chan) {
    const msgs = store[chan] ?? [];
    // More efficient DOM clearing  
    while (logEl.firstChild) {
      logEl.removeChild(logEl.firstChild);
    }
    // Use DocumentFragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    msgs.forEach((m) => fragment.appendChild(renderMsg(m)));
    logEl.appendChild(fragment);
  }

  function renderMsg(m) {
    const row = document.createElement('div');
    row.className = 'msg';
    const time = document.createElement('div');
    const hh = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    time.className = 'time';
    time.textContent = hh;
    const body = document.createElement('div');
    const nick = document.createElement('span');
    nick.className = `nick ${nickColorClass(m.nick)}`;
    nick.textContent = padNick(m.nick);
    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = m.text;
    body.appendChild(nick);
    body.appendChild(document.createTextNode(': '));
    body.appendChild(text);
    row.appendChild(time);
    row.appendChild(body);
    return row;
  }

  function padNick(n) {
    // mimic fixed-width nick column feel
    const max = 8; // simple pad for aesthetics
    if (n.length >= max) return n.slice(0, max);
    return (n + ' '.repeat(max)).slice(0, max);
  }

  function push(chan, nick, text) {
    const arr = store[chan] || (store[chan] = []);
    arr.push({ time: Date.now(), nick, text });
  }

  function scrollLogToBottom() {
    logEl.scrollTop = logEl.scrollHeight;
  }

  const htmlEscapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => htmlEscapeMap[c]);
  }
})();
