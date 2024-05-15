// airdrop.cjs
// Set environment variable to suppress no config warning
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y'
// REQUIRE MODULES
const { ipcMain } = require('electron');
const xrpl = require('xrpl');
const config = require('config');
const fs = require('fs');
const readline = require('readline');
const { parse } = require('csv-parse');

const electron = require('electron');

function statusLog(message) {
    const now = new Date();
    const timestamp = '\n[' +
        ('0' + now.getDate()).slice(-2) + '/' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
        now.getFullYear() + ' ' +
        ('0' + now.getHours()).slice(-2) + ':' +
        ('0' + now.getMinutes()).slice(-2) + ':' +
        ('0' + now.getSeconds()).slice(-2) +
        '] ';

    // Get the webContents of the first BrowserWindow
    const webContents = electron.BrowserWindow.getAllWindows()[0].webContents;

    // Run JavaScript code in the renderer process
    webContents.executeJavaScript(`
        const consoleLog = document.getElementById('consoleLog');
        consoleLog.value += '${timestamp + message}';
        consoleLog.scrollTop = consoleLog.scrollHeight;
    `).catch(error => {
        console.error('Failed to execute script:', error);
    });
}

module.exports.main = async function (address) {


    // FUNCTION TO CHECK IF THE NFT HAS AN ACTIVE OFFER
    async function hasActiveSellOffer(client, account, tokenId) {
        const response = await client.request({
            command: 'account_offers',
            account: account
        });

        for (const offer of response.result.offers) {
            if (offer.NFTokenID === tokenId) {
                return true;
            }
        }

        return false;
    }

    // FUNCTION TO GENERATE SELL OFFER TRANSACTION PAYLOAD
    // This function constructs a payload for creating a sell offer for an NFT. It converts the amount to a string to match the API's expected format.
    function SellOfferTxnPayload(tokenId, destination, amount) {
        const txnPayload = {
            TransactionType: "NFTokenCreateOffer",
            Account: xrp_account,
            NFTokenID: tokenId,
            Amount: amount.toString(),
            Flags: xrpl.NFTokenCreateOfferFlags.tfSellNFToken,
            Destination: destination
        };

        if (expiration != 0) {
            txnPayload.Expiration = expiration; // Adds an expiration field to the payload if it is set and non-zero.
        }

        return txnPayload;
    }

    // FUNCTION TO GENERATE PAYLOAD FOR RETRIEVING NFTs OWNED BY AN ACCOUNT
    // This function creates a request payload to retrieve the list of NFTs owned by a specific XRP ledger account.
    function AccountNftTxnPayload(xrpAddress, marker) {
        const payload = {
            "command": "account_nfts",
            "account": xrpAddress,
            "ledger_index": "validated", // Uses a validated ledger index to ensure the response reflects a stable view of the ledger state.
            "limit": 200 // Limits the response to 200 NFTs per request, adjustable as needed.
        };

        if (marker !== undefined) {
            payload.marker = marker; // Handles pagination by including a marker if provided.
        }

        return payload;
    }

    // FUNCTION TO READ AND PARSE CSV FILE CONTAINING WALLET ADDRESSES
    // This function reads a CSV file synchronously and parses it into a JSON object. Proper error handling is implemented.
    async function readWalletsCSV() {
        try {
            const content = fs.readFileSync('./wallets/wallets.csv', { encoding: 'utf8' });
            const records = parse(content, {
                columns: true,
                skip_empty_lines: true
            });
            return records;
        } catch (err) {
            console.error("Error reading CSV file:", err);
            throw err;
        }
    }


    // MAIN FUNCTION TO EXECUTE NFT TRANSFER PROCESS
    // The main async function coordinates the entire NFT transfer process including connecting to the XRPL server, retrieving NFTs, and processing transfers.
    // CREATE READLINE INTERFACE
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // FUNCTION TO PROMPT USER FOR NETWORK SELECTION
    function askNetwork() {
        return new Promise((resolve, reject) => {
            rl.question('Select network type (1 for Mainnet, 2 for Testnet): ', (answer) => {
                if (answer === '1') {
                    resolve(config.get('XRPL_Mainnet'));
                } else if (answer === '2') {
                    resolve(config.get('XRPL_Testnet'));
                } else {
                    reject(new Error('Invalid selection'));
                }
            });
        });
    }

    // FUNCTION TO PROMPT USER FOR CONFIRMATION
    function askForConfirmation() {
        return new Promise((resolve) => {
            rl.question('Do you want to proceed with the airdrop? (yes/no): ', (answer) => {
                resolve(answer.toLowerCase() === 'yes');
            });
        });
    }


    let wallets;
    try {
        wallets = await readWalletsCSV();
        if (Array.isArray(wallets)) {
            wallets.reduce(/* your reduce function */);
        } else {
            console.error('wallets is not an array');
        }
        let totalAmount = wallets.reduce((acc, { Amount }) => acc + parseInt(Amount, 10), 0);

        electronEvent.sender.send('ui-log', "Wallets and Amounts:");
        wallets.forEach(({ Destination, Amount }, index) => {
            electronEvent.sender.send('ui-log', `${index + 1}. Destination: ${Destination}, Amount: ${Amount}`);
        });
        electronEvent.sender.send('ui-log', `Total Amount: ${totalAmount}`);

        const confirmation = await askForConfirmation();
        if (!confirmation) {
            electronEvent.sender.send('ui-log', 'Transfer canceled by the user.');
            rl.close();
            return;
        }
    } catch (error) {
        console.error('Error processing CSV:', error);
        electronEvent.sender.send('ui-log', 'Error processing CSV:', error);
        rl.close();
        return;
    }


    let xrplServer;
    try {
        xrplServer = await askNetwork();
        const client = new xrpl.Client(xrplServer);
        await client.connect();

        try {
            let account_nfts = [];
            electronEvent.sender.send('ui-log', 'Getting Account NFTs');
            let marker = undefined;
            do {
                let nfts = await client.request(AccountNftTxnPayload(xrp_account, marker));
                if (nfts.result.account_nfts && nfts.result.account_nfts.length > 0) {
                    account_nfts.push(...nfts.result.account_nfts);
                }
                marker = nfts.result.marker;
            } while (marker != undefined);

            const filtered_account_nfts = account_nfts.filter(nft => nft.Issuer == issuer && nft.NFTokenTaxon == taxon);
            electronEvent.sender.send('ui-log', `${filtered_account_nfts.length} NFTs found on account for issuer: ${issuer} and Taxon: ${taxon}`);

            const wallets = await readWalletsCSV();
            const hot_wallet = xrpl.Wallet.fromSeed(xrp_account_secret);

            for (const { Destination, Amount } of wallets) {
                let counter = 0;
                let count = 1;
                electronEvent.sender.send('ui-log', `Processing transfer to wallet: ${Destination} for ${Amount} NFTs`);

                for (let i = 0; i < filtered_account_nfts.length; i++) {
                    if (counter >= Amount) break;
                    let nft = filtered_account_nfts[i];
                    electronEvent.sender.send('ui-log', `Processing NFT: ${count} of ${Amount} to wallet ${Destination}`);
                    // Check if the NFT already has an active SellOffer
                    if (await hasActiveSellOffer(client, xrp_account, nft.NFTokenID)) {
                        electronEvent.sender.send('ui-log', `Skipping NFT: ${nft.NFTokenID} as it already has an active SellOffer.`);
                        continue;
                    }
                    electronEvent.sender.send('ui-log', `Transferring NFT: ${nft.NFTokenID} URI: ${xrpl.convertHexToString(nft.URI)}`);

                    let sellPayload = SellOfferTxnPayload(nft.NFTokenID, Destination, Amount);
                    const cst_prepared_offer = await client.autofill(sellPayload);
                    const ts_signed_offer = hot_wallet.sign(cst_prepared_offer);
                    const ts_result_offer = await client.submitAndWait(ts_signed_offer.tx_blob);

                    if (ts_result_offer.result.meta.TransactionResult === "tesSUCCESS") {
                        electronEvent.sender.send('ui-log', 'Transfer offer successful');
                        filtered_account_nfts.splice(i, 1); // Remove the NFT from the array
                        i--; // Decrement the index to account for the removed element
                        counter++;
                        count++;
                    }
                }
            }
        } catch (err) {
            console.error('Error during transfer offers or CSV processing:', err);
        } finally {
            if (client.isConnected) await client.disconnect();
        }
        if (client.isConnected) await client.disconnect();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        rl.close();
    }

}

// CONFIGURATION VARIABLES
// Storing sensitive and specific configuration in a separate file and using a library to manage it enhances security and flexibility.
//const xrplServer = config.get('XRPL_Server');
ipcMain.on('executeMain', (electronEvent, args) => {
        // Check if the necessary arguments are provided
        if (!args.address || !args.taxon) {
            console.error('Error: Missing required configuration parameters');
            electronEvent.sender.send('ui-log', 'Error: Missing required configuration parameters');
            return; // Exit the function if the necessary arguments are not provided
        }
    
        // If the necessary arguments are provided, continue with the rest of the code
        let xrp_account = args.address;
        let issuer = args.address;
        let taxon = args.taxon;
        let expiration = args.expiration !== "" ? xrpl.unixTimeToRippleTime(new Date(args.expiration)) : 0;
        let xrp_account_secret = args.seed;
    
        // Log the config variables
        statusLog(`xrp_account: ${xrp_account}`);
        statusLog(`issuer: ${issuer}`);
        statusLog(`taxon: ${taxon}`);
        statusLog(`expiration: ${expiration}`);
    
        // Continue with the rest of the code using the validated configuration
        //electronEvent.sender.send('ui-log', `Transaction config: ${JSON.stringify(transactionConfig, null, 2)}`);
        //console.log(`Transaction config: ${JSON.stringify(transactionConfig, null, 2)}`);
        //electronEvent.sender.send(`Transaction config: ${JSON.stringify(transactionConfig, null, 2)}`);

        //xrp_account = transactionConfig.Account;
        // xrp_account_secret = args.seed;
        // issuer = transactionConfig.Transfer.Issuer;
        // taxon = transactionConfig.Transfer.Taxon;
        // expiration = transactionConfig.Transfer.Expiration !== ""
        //     ? xrpl.unixTimeToRippleTime(new Date(transactionConfig.Transfer.Expiration))
        //     : 0;

        // // Call the main function after the configuration is loaded
        main(address);

    //return transactionConfig;



    // MAIN FUNCTION TO EXECUTE NFT TRANSFER PROCESS
    //main();
    
});


