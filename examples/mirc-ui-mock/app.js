/* SPDX-License-Identifier: MPL-2.0 */
// mIRCat UI-only mock — no networking, no crypto. All state is in-memory.
(function () {
  /** Select a single DOM element by CSS selector */
  const selectElement = (selector) => document.querySelector(selector);
  /** Select all matching DOM elements by CSS selector, returned as an array */
  const selectAllElements = (selector) => Array.from(document.querySelectorAll(selector));

  const channelListElement = selectElement('#channel-list');
  const userListElement = selectElement('#user-list');
  const chatLogElement = selectElement('#log');
  const messageInputElement = selectElement('#input');
  const roomNameElement = selectElement('#room-name');
  const themeToggleElement = document.querySelector('.theme-toggle');

  const channelNames = ['#general', '#random', '#cozy-outpost'];
  const userNicknames = ['alice', 'bob', 'carol', 'dave'];
  const getNickColorClass = (nickname) => {
    const colorIndex = Math.abs(computeStringHash(nickname)) % 6; // 0..5
    return ['nick-a','nick-b','nick-c','nick-d','nick-e','nick-f'][colorIndex];
  };

  // Simple hash for color bucketing
  function computeStringHash(text) {
    let hashValue = 0;
    for (let charIndex = 0; charIndex < text.length; charIndex++) hashValue = ((hashValue << 5) - hashValue + text.charCodeAt(charIndex)) | 0;
    return hashValue;
  }

  // In-memory message store per channel
  /** @type {Record<string, {time:number,nick:string,text:string}[]>} */
  const messageStore = Object.fromEntries(
    channelNames.map((channelName) => [channelName, []])
  );

  // Seed a few messages in #general
  addMessage('#general', 'alice', 'hello world');
  addMessage('#general', 'bob', 'hi!');
  addMessage('#general', 'you', '/join #cozy-outpost');

  renderChannelList('#general');
  renderUserList(userNicknames);
  switchChannel('#general');

  // Event: send message on Enter
  selectElement('#composer').addEventListener('submit', (event) => {
    event.preventDefault();
    const messageText = messageInputElement.value.trim();
    if (!messageText) return;
    const activeChannel = getCurrentChannel();
    addMessage(activeChannel, 'you', messageText);
    messageInputElement.value = '';
    renderChatLog(activeChannel);
    scrollChatLogToBottom();
  });

  // Theme toggle
  themeToggleElement.addEventListener('click', () => document.body.classList.toggle('light'));
  themeToggleElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') document.body.classList.toggle('light');
  });

  function getCurrentChannel() {
    const activeChannelItem = channelListElement.querySelector('li.active');
    return activeChannelItem?.dataset.value ?? '#general';
  }

  function renderChannelList(activeChannel) {
    channelListElement.innerHTML = '';
    channelNames.forEach((channelName) => {
      const listItem = document.createElement('li');
      listItem.dataset.value = channelName;
      if (channelName === activeChannel) listItem.classList.add('active');
      const channelButton = document.createElement('button');
      channelButton.type = 'button';
      channelButton.textContent = channelName;
      channelButton.addEventListener('click', () => switchChannel(channelName));
      listItem.appendChild(channelButton);
      channelListElement.appendChild(listItem);
    });
  }

  function renderUserList(nicknames) {
    userListElement.innerHTML = '';
    nicknames.forEach((nickname) => {
      const listItem = document.createElement('li');
      const userButton = document.createElement('button');
      userButton.type = 'button';
      userButton.innerHTML = `<span class="${getNickColorClass(nickname)}">${escapeHtml(nickname)}</span>`;
      listItem.appendChild(userButton);
      userListElement.appendChild(listItem);
    });
  }

  function switchChannel(channelName) {
    // update active UI
    selectAllElements('#channel-list li').forEach((listItem) => {
      listItem.classList.toggle('active', listItem.dataset.value === channelName);
    });
    roomNameElement.textContent = channelName;
    renderChatLog(channelName);
    scrollChatLogToBottom();
  }

  function renderChatLog(channelName) {
    const messages = messageStore[channelName] ?? [];
    chatLogElement.innerHTML = '';
    messages.forEach((message) => chatLogElement.appendChild(createMessageElement(message)));
  }

  function createMessageElement(messageData) {
    const messageRow = document.createElement('div');
    messageRow.className = 'msg';
    const timeElement = document.createElement('div');
    const formattedTime = new Date(messageData.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timeElement.className = 'time';
    timeElement.textContent = formattedTime;
    const bodyElement = document.createElement('div');
    const nicknameSpan = document.createElement('span');
    nicknameSpan.className = `nick ${getNickColorClass(messageData.nick)}`;
    nicknameSpan.textContent = formatNickname(messageData.nick);
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = messageData.text;
    bodyElement.appendChild(nicknameSpan);
    bodyElement.appendChild(document.createTextNode(': '));
    bodyElement.appendChild(textSpan);
    messageRow.appendChild(timeElement);
    messageRow.appendChild(bodyElement);
    return messageRow;
  }

  function formatNickname(nickname) {
    // mimic fixed-width nick column feel
    const maxLength = 8; // simple pad for aesthetics
    if (nickname.length >= maxLength) return nickname.slice(0, maxLength);
    return (nickname + ' '.repeat(maxLength)).slice(0, maxLength);
  }

  function addMessage(channelName, nickname, text) {
    const messages = messageStore[channelName] || (messageStore[channelName] = []);
    messages.push({ time: Date.now(), nick: nickname, text });
  }

  function scrollChatLogToBottom() {
    chatLogElement.scrollTop = chatLogElement.scrollHeight;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
})();
