/* SPDX-License-Identifier: MPL-2.0 */
// mIRCat UI-only mock — no networking, no crypto. All state is in-memory.
(function () {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const channelListEl = $('#channel-list');
  const userListEl = $('#user-list');
  const logEl = $('#log');
  const inputEl = $('#input');
  const roomNameEl = $('#room-name');
  const themeToggleEl = document.querySelector('.theme-toggle');

  const channels = ['#general', '#random', '#cozy-outpost'];
  const users = ['alice', 'bob', 'carol', 'dave'];
  const nickColors = ['nick-a','nick-b','nick-c','nick-d','nick-e','nick-f'];
  const nickColorClass = (nick) => {
    const index = Math.abs(hash(nick)) % 6; // 0..5
    return nickColors[index];
  };

  // Simple hash for color bucketing
  function hash(str) {
    let hashValue = 0;
    for (let i = 0; i < str.length; i++) hashValue = ((hashValue << 5) - hashValue + str.charCodeAt(i)) | 0;
    return hashValue;
  }

  // In-memory message store per channel
  /** @type {Record<string, {time:number,nick:string,text:string}[]>} */
  const store = Object.fromEntries(
    channels.map((channel) => [channel, []])
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
    const inputValue = inputEl.value.trim();
    if (!inputValue) return;
    const channel = currentChannel();
    push(channel, 'you', inputValue);
    inputEl.value = '';
    renderLog(channel);
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
    channelListEl.innerHTML = '';
    channels.forEach((channel) => {
      const li = document.createElement('li');
      li.dataset.value = channel;
      if (channel === active) li.classList.add('active');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = channel;
      btn.addEventListener('click', () => switchChannel(channel));
      li.appendChild(btn);
      channelListEl.appendChild(li);
    });
  }

  function renderUsers(nicks) {
    userListEl.innerHTML = '';
    nicks.forEach((nickname) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<span class="${nickColorClass(nickname)}">${escapeHtml(nickname)}</span>`;
      li.appendChild(btn);
      userListEl.appendChild(li);
    });
  }

  function switchChannel(chan) {
    // update active UI
    $$('#channel-list li').forEach((listItem) => {
      listItem.classList.toggle('active', listItem.dataset.value === chan);
    });
    roomNameEl.textContent = chan;
    renderLog(chan);
    scrollLogToBottom();
  }

  function renderLog(chan) {
    const messages = store[chan] ?? [];
    logEl.innerHTML = '';
    messages.forEach((message) => logEl.appendChild(renderMsg(message)));
  }

  function renderMsg(message) {
    const row = document.createElement('div');
    row.className = 'msg';
    const time = document.createElement('div');
    const formattedTime = new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    time.className = 'time';
    time.textContent = formattedTime;
    const body = document.createElement('div');
    const nick = document.createElement('span');
    nick.className = `nick ${nickColorClass(message.nick)}`;
    nick.textContent = padNick(message.nick);
    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = message.text;
    body.appendChild(nick);
    body.appendChild(document.createTextNode(': '));
    body.appendChild(text);
    row.appendChild(time);
    row.appendChild(body);
    return row;
  }

  function padNick(nickname) {
    // mimic fixed-width nick column feel
    const max = 8; // simple pad for aesthetics
    if (nickname.length >= max) return nickname.slice(0, max);
    return (nickname + ' '.repeat(max)).slice(0, max);
  }

  function push(chan, nick, text) {
    const messageArray = store[chan] || (store[chan] = []);
    messageArray.push({ time: Date.now(), nick, text });
  }

  function scrollLogToBottom() {
    logEl.scrollTop = logEl.scrollHeight;
  }

  const htmlEscapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
  }
})();
