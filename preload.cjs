//preload.cjs
const { ipcRenderer } = require('electron');

// ipcRenderer.on('ui-log', (event, message) => {
//   console.log(message);
//   // Update your UI with the message here, for example:
//   // document.getElementById('log').innerText += `\n${message}`;
//   const now = new Date();
//   const timestamp = '\n[' +
//     ('0' + now.getDate()).slice(-2) + '/' +
//     ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
//     now.getFullYear() + ' ' +
//     ('0' + now.getHours()).slice(-2) + ':' +
//     ('0' + now.getMinutes()).slice(-2) + ':' +
//     ('0' + now.getSeconds()).slice(-2) +
//     '] ';
//   const consoleLog = document.getElementById('consoleLog');
//   consoleLog.value += timestamp + message;
//   consoleLog.scrollTop = consoleLog.scrollHeight;
// });

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})