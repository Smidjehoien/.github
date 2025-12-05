/* SPDX-License-Identifier: MPL-2.0 */
// mIRCat UI-only mock — no networking, no crypto. All state is in-memory.
(function () {
  const selectElement = (selector) => document.querySelector(selector);
  const selectAllElements = (selector) => Array.from(document.querySelectorAll(selector));

  const channelListElement = selectElement('#channel-list');
  const userListElement = selectElement('#user-list');
  const chatLogElement = selectElement('#log');
  const messageInputElement = selectElement('#input');
  const roomNameElement = selectElement('#room-name');
  const themeToggleElement = document.querySelector('.theme-toggle');

  const channels = ['#general', '#random', '#cozy-outpost'];
  const users = ['alice', 'bob', 'carol', 'dave'];
  const nicknameColorClasses = ['nick-a','nick-b','nick-c','nick-d','nick-e','nick-f'];
  const getNicknameColorClass = (nickname) => {
    const colorIndex = Math.abs(computeStringHash(nickname)) % 6; // 0..5
    return nicknameColorClasses[colorIndex];
  };

  // Simple hash for color bucketing
  function computeStringHash(inputString) {
    let hashValue = 0;
    for (let charIndex = 0; charIndex < inputString.length; charIndex++) hashValue = ((hashValue << 5) - hashValue + inputString.charCodeAt(charIndex)) | 0;
    return hashValue;
  }

  // In-memory message store per channel
  /** @type {Record<string, {time:number,nick:string,text:string}[]>} */
  const messageStore = Object.fromEntries(
    channels.map((channelName) => [channelName, []])
  );

  // Seed a few messages in #general
  addMessageToChannel('#general', 'alice', 'hello world');
  addMessageToChannel('#general', 'bob', 'hi!');
  addMessageToChannel('#general', 'you', '/join #cozy-outpost');

  renderChannelList('#general');
  renderUserList(users);
  switchToChannel('#general');

  // Event: send message on Enter
  selectElement('#composer').addEventListener('submit', (event) => {
    event.preventDefault();
    const messageText = messageInputElement.value.trim();
    if (!messageText) return;
    const currentChannelName = getCurrentChannel();
    addMessageToChannel(currentChannelName, 'you', messageText);
    messageInputElement.value = '';
    renderChatLog(currentChannelName);
    scrollChatLogToBottom();
  });

  // Theme toggle
  themeToggleElement.addEventListener('click', () => document.body.classList.toggle('light'));
  themeToggleElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') document.body.classList.toggle('light');
  });

  function getCurrentChannel() {
    const activeChannelElement = channelListElement.querySelector('li.active');
    return activeChannelElement?.dataset.value ?? '#general';
  }

  function renderChannelList(activeChannel) {
    channelListElement.innerHTML = '';
    channels.forEach((channelName) => {
      const listItem = document.createElement('li');
      listItem.dataset.value = channelName;
      if (channelName === activeChannel) listItem.classList.add('active');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = channelName;
      button.addEventListener('click', () => switchToChannel(channelName));
      listItem.appendChild(button);
      channelListElement.appendChild(listItem);
    });
  }

  function renderUserList(nicknames) {
    userListElement.innerHTML = '';
    nicknames.forEach((nickname) => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<span class="${getNicknameColorClass(nickname)}">${escapeHtml(nickname)}</span>`;
      listItem.appendChild(button);
      userListElement.appendChild(listItem);
    });
  }

  function switchToChannel(channelName) {
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
    messages.forEach((message) => chatLogElement.appendChild(renderMessage(message)));
  }

  function renderMessage(messageData) {
    const messageRow = document.createElement('div');
    messageRow.className = 'msg';
    const timeElement = document.createElement('div');
    const formattedTime = new Date(messageData.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timeElement.className = 'time';
    timeElement.textContent = formattedTime;
    const bodyElement = document.createElement('div');
    const nicknameElement = document.createElement('span');
    nicknameElement.className = `nick ${getNicknameColorClass(messageData.nick)}`;
    nicknameElement.textContent = padNickname(messageData.nick);
    const textElement = document.createElement('span');
    textElement.className = 'text';
    textElement.textContent = messageData.text;
    bodyElement.appendChild(nicknameElement);
    bodyElement.appendChild(document.createTextNode(': '));
    bodyElement.appendChild(textElement);
    messageRow.appendChild(timeElement);
    messageRow.appendChild(bodyElement);
    return messageRow;
  }

  function padNickname(nickname) {
    // mimic fixed-width nick column feel
    const maxLength = 8; // simple pad for aesthetics
    if (nickname.length >= maxLength) return nickname.slice(0, maxLength);
    return (nickname + ' '.repeat(maxLength)).slice(0, maxLength);
  }

  function addMessageToChannel(channelName, nickname, messageText) {
    const channelMessages = messageStore[channelName] || (messageStore[channelName] = []);
    channelMessages.push({ time: Date.now(), nick: nickname, text: messageText });
  }

  function scrollChatLogToBottom() {
    chatLogElement.scrollTop = chatLogElement.scrollHeight;
  }

  const htmlEscapeCharacterMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(inputString) {
    return inputString.replace(/[&<>"']/g, (character) => htmlEscapeCharacterMap[character]);
  }
})();
