async function statusLog(message) {
    const now = new Date();
    const timestamp = '\n[' +
        ('0' + now.getDate()).slice(-2) + '/' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
        now.getFullYear() + ' ' +
        ('0' + now.getHours()).slice(-2) + ':' +
        ('0' + now.getMinutes()).slice(-2) + ':' +
        ('0' + now.getSeconds()).slice(-2) +
        '] ';
    const consoleLog = document.getElementById('consoleLog');
    consoleLog.value += timestamp + message;
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

module.exports = { statusLog };
