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
  const nickColorCache = new Map();
  const nickColorClass = (nick) => {
    if (!nickColorCache.has(nick)) {
      const colorIndex = Math.abs(hash(nick)) % 6; // 0..5
      nickColorCache.set(nick, nickColors[colorIndex]);
    }
    return nickColorCache.get(nick);
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
    channels.map((channelName) => [channelName, []])
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
    const messageText = inputEl.value.trim();
    if (!messageText) return;
    const chan = currentChannel();
    push(chan, 'you', messageText);
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
    // Only update active state instead of recreating all elements
    const existingChannels = $$('#channel-list li');
    if (existingChannels.length === channels.length) {
      existingChannels.forEach((li) => {
        li.classList.toggle('active', li.dataset.value === active);
      });
    } else {
      // Initial render or channel list changed
      channelListEl.innerHTML = '';
      channels.forEach((channelName) => {
        const li = document.createElement('li');
        li.dataset.value = channelName;
        if (channelName === active) li.classList.add('active');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = channelName;
        btn.addEventListener('click', () => switchChannel(channelName));
        li.appendChild(btn);
        channelListEl.appendChild(li);
      });
    }
  }

  function renderUsers(nicks) {
    userListEl.innerHTML = '';
    nicks.forEach((nickname) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      const span = document.createElement('span');
      span.className = nickColorClass(nickname);
      span.textContent = nickname;
      btn.appendChild(span);
      li.appendChild(btn);
      userListEl.appendChild(li);
    });
  }

  function switchChannel(chan) {
    // Directly update active classes for performance (avoiding full renderChannels call)
    // This is intentionally duplicated from renderChannels for efficiency
    $$('#channel-list li').forEach((li) => {
      li.classList.toggle('active', li.dataset.value === chan);
    });
    roomNameEl.textContent = chan;
    renderLog(chan);
    scrollLogToBottom();
  }

  function renderLog(chan) {
    const msgs = store[chan] ?? [];
    // Only clear and re-render if we switched channels
    const currentChan = logEl.dataset.channel;
    if (currentChan !== chan) {
      logEl.innerHTML = '';
      logEl.dataset.channel = chan;
      msgs.forEach((message) => logEl.appendChild(renderMsg(message)));
    } else {
      // Incremental update: only add new messages
      // Safe because messages are append-only and DOM is not modified elsewhere
      const currentCount = logEl.children.length;
      if (msgs.length > currentCount) {
        for (let i = currentCount; i < msgs.length; i++) {
          logEl.appendChild(renderMsg(msgs[i]));
        }
      }
    }
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

  function padNick(nick) {
    // mimic fixed-width nick column feel
    const maxNickLength = 8; // simple pad for aesthetics
    if (nick.length >= maxNickLength) return nick.slice(0, maxNickLength);
    return (nick + ' '.repeat(maxNickLength)).slice(0, maxNickLength);
  }

  function push(chan, nick, text) {
    const channelMessages = store[chan] || (store[chan] = []);
    channelMessages.push({ time: Date.now(), nick, text });
  }

  function scrollLogToBottom() {
    logEl.scrollTop = logEl.scrollHeight;
  }


})();
