const fs = require('fs');
const path = require('path');
const { statusLog } = require('./utils');

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return; 

    wallets = []; 

    try {
        const data = await readCSVFile(file);
        if (!Array.isArray(data)) {
            statusLog('Data is not an array:', data);
            throw new Error('Data is not an array');
        }

        wallets = data;
        if (!wallets) {
            statusLog(`failed to pass data to 'wallets' object`);
            throw new Error('Failed to pass data to wallets object');
        }

        let totalAmount = wallets.reduce((acc, { Amount }) => acc + parseInt(Amount, 10), 0);
        consoleLog.value += `\nTotal NFTs to airdrop: ${totalAmount}`;

        document.getElementById('executeButton').disabled = false;
        document.getElementById('executeButton').style.opacity = '1';
        document.getElementById('executeButton').style.cursor = 'pointer';

    } catch (error) {
        statusLog('Error reading file:', error);
        throw error;
    }
}

async function readCSVFile(file) {
    try {
        const fileContent = await fs.promises.readFile(file.path, 'utf-8');
        const rows = fileContent.trim().split('\n'); 
        const header = rows.shift().split(','); 
        const arrayData = rows.map(row => {
            const cleanedRow = row.startsWith(',') ? row.slice(1) : row; 
            return cleanedRow.split(','); 
        });

        arrayData.unshift(header);

        const jsonData = arrayData.slice(1).map(row => {
            const destination = row[0];
            const amount = row[1];
            return { Destination: destination, Amount: amount };
        });
        statusLog('CSV data is loaded');

        document.getElementById('csvData').value = arrayData.map(row => row.join(',')).join('\n');

        return jsonData;

    } catch (error) {
        statusLog('Error reading CSV file:', error);
        throw error;
    }
}

module.exports = { handleFileSelect, readCSVFile };
