/* SPDX-License-Identifier: MPL-2.0 */
// mIRCat UI-only mock — no networking, no crypto. All state is in-memory.
(function () {
  const selectElement = (selector) => document.querySelector(selector);
  const selectAllElements = (selector) => Array.from(document.querySelectorAll(selector));

  const channelListEl = selectElement('#channel-list');
  const userListEl = selectElement('#user-list');
  const logEl = selectElement('#log');
  const inputEl = selectElement('#input');
  const roomNameEl = selectElement('#room-name');
  const themeToggleEl = document.querySelector('.theme-toggle');

  const channels = ['#general', '#random', '#cozy-outpost'];
  const users = ['alice', 'bob', 'carol', 'dave'];
  const nickColorClass = (nickname) => {
    const colorIndex = Math.abs(hash(nickname)) % 6; // 0..5
    return ['nick-a','nick-b','nick-c','nick-d','nick-e','nick-f'][colorIndex];
  };

  // Simple hash for color bucketing
  function hash(string) {
    let hashValue = 0;
    for (let i = 0; i < string.length; i++) hashValue = ((hashValue << 5) - hashValue + string.charCodeAt(i)) | 0;
    return hashValue;
  }

  // In-memory message store per channel
  /** @type {Record<string, {time:number,nick:string,text:string}[]>} */
  const messageStore = Object.fromEntries(
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
  selectElement('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = inputEl.value.trim();
    if (!messageText) return;
    const currentChannelName = currentChannel();
    push(currentChannelName, 'you', messageText);
    inputEl.value = '';
    renderLog(currentChannelName);
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
    channels.forEach((channelName) => {
      const listItem = document.createElement('li');
      listItem.dataset.value = channelName;
      if (channelName === active) listItem.classList.add('active');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = channelName;
      button.addEventListener('click', () => switchChannel(channelName));
      listItem.appendChild(button);
      channelListEl.appendChild(listItem);
    });
  }

  function renderUsers(nicks) {
    userListEl.innerHTML = '';
    nicks.forEach((nickname) => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<span class="${nickColorClass(nickname)}">${escapeHtml(nickname)}</span>`;
      listItem.appendChild(button);
      userListEl.appendChild(listItem);
    });
  }

  function switchChannel(channelName) {
    // update active UI
    selectAllElements('#channel-list li').forEach((listItem) => {
      listItem.classList.toggle('active', listItem.dataset.value === channelName);
    });
    roomNameEl.textContent = channelName;
    renderLog(channelName);
    scrollLogToBottom();
  }

  function renderLog(channelName) {
    const messages = messageStore[channelName] ?? [];
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

  function push(channelName, nick, text) {
    const messages = messageStore[channelName] || (messageStore[channelName] = []);
    messages.push({ time: Date.now(), nick, text });
  }

  function scrollLogToBottom() {
    logEl.scrollTop = logEl.scrollHeight;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
})();
