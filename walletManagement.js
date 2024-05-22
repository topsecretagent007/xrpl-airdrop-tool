const { statusLog } = require('./utils');
const xrpl = require('xrpl');

function deriveAddressFromSeed(seed) {
    const keypairs = require('ripple-keypairs');
    const keypair = xrpl.deriveKeypair(seed);
    const address = xrpl.deriveAddress(keypair.publicKey);
    userAddress = address;
    statusLog('Derived XRP address from seed.');
    consoleLog.value += '\nAddress: ' + address;
    document.getElementById('address').textContent = '\nAddress: ' + address;
    return address;
}

async function checkAccountValidity(address) {
    statusLog('Validating account...');
    const usingURL = document.getElementById('xrplServer').textContent.split(' ')[1];

    const client = new xrpl.Client(usingURL);

    try {
        await client.connect();
        consoleLog.value += '... connected.'
    } catch (error) {
        statusLog('Error connecting to the server: ' + error.message);
        return [false];
    }

    const accountInfoResponse = await client.request({
        command: 'account_info',
        account: address
    });

    if (accountInfoResponse.result.account_data) {
        if (parseInt(accountInfoResponse.result.account_data.Balance) > 0) {
            const allNfts = await xrplgetNFTs(address);

            if (Object.keys(allNfts).length > 0) {
                statusLog('Account is valid!');
                document.getElementById('address').textContent = 'Address: ' + accountInfoResponse.result.account_data.Account + emoji(0x2714);
                return [true, allNfts];
            } else {
                statusLog('Account is not valid: No NFTs... Try another account.');
                return [false];
            }
        } else {
            statusLog('Account is not valid: Balance is not greater than 0');
            document.getElementById('address').textContent = 'Address: ' + accountInfoResponse.result.account_data.Account + emoji(0x274C);
            return [false];
        }
    }
}

module.exports = { deriveAddressFromSeed, checkAccountValidity };
