//actions.js
const fs = require('fs');
const path = require('path');
let wallets = [];
//let allNfts = [];
let userAddress = '';
const xrpl = require('xrpl');
let hot_wallet = '';
let txnPayload = {};
let filteredNFTMap = new Map();
//let NFTCountMap = new Map();

// prepend timestamp
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



document.addEventListener('DOMContentLoaded', (event) => {
    // Check for Node.js integration, critical for Electron functionality
    if (typeof require !== 'undefined') {

        const { ipcRenderer } = require('electron');
        //let taxon;
        

        ///////////////
        // FUNCTIONS //
        ///////////////

        // This function executes an airdrop of NFTs (Non-Fungible Tokens)
        async function goAirdrop(airdropList) {
            // Get the selected taxon and amount of NFTs from the dropdown
            const selectElement = document.getElementById('nftDropdown');
            const selectedTaxon = parseInt(selectElement.value, 10);

            //const selectedTaxon = airdropList.get(String(selectedTaxon));
            //const selectedTaxon = selectElement.value;
            statusLog(`Selected taxon: ${selectedTaxon}`);

            // Get the NFT objects from the selected taxon and store in an array
            const transactionNFTArray = Array.from(airdropList.get(selectedTaxon) || []);

            // Check for undefined value
            if (!transactionNFTArray.length) {
                statusLog('Error: transactionNFTArray is empty');
                return;
            }

            // Calculate the total amount of NFTs to be airdropped
            const totalAmount = wallets.reduce((acc, { Amount }) => acc + parseInt(Amount, 10), 0);
            const usingURL = document.getElementById('xrplServer').textContent.split(' ')[2];
            statusLog(`Sending ${totalAmount} NFTs`);

            statusLog('totalAmount value: ' + totalAmount);
            statusLog('transactionNFTArray value: ' + transactionNFTArray.length);

            // Check if there are enough NFTs of the selected taxon
            if (transactionNFTArray.length < totalAmount) {
                statusLog(`Error: not enough NFTs of taxon ${selectedTaxon}`);
                return;
            }

            // Log the NFTs to be transferred
            statusLog(`transactionNFTArray: ${JSON.stringify(transactionNFTArray, null, 2)}`);


            let client;



            // Connect to the XRPL server
            try {
                statusLog(`xrpl endpoint: ${usingURL}`)
                if (!usingURL) { statusLog('failed to load the server url'); return; }
                statusLog('connecting...')
                client = new xrpl.Client(usingURL);
                await client.connect();
            } catch (error) {
                statusLog('Error connecting to the server: ' + error.message);
                return;
            }
            consoleLog.value += 'connected';

            // Load the hot wallet from the seed
            let xrp_account_secret = document.getElementById('seed').value;
            try {
                hot_wallet = xrpl.Wallet.fromSeed(xrp_account_secret);
            } catch (error) {
                statusLog(`Error loading hot wallet: ${error}`);
                return;
            }
            statusLog('hot wallet is active');



            //let transactionNFTArray = [];



            // Get the NFTs of the selected taxon
            // try {
            //     transactionNFTArray = selectedTaxon ? Array.from(NFTCountMap.get(selectedTaxon) || [], ({ NFTokenID }) => ({ NFTokenID })) : [];
            // } catch (error) {
            //     statusLog(`Error: ${error}`);
            // }

            // Check if there are enough NFTs of the selected taxon


            // Transfer the NFTs to the wallets
            try {
                for (const { Destination, Amount } of wallets) {
                    let counter = 0;
                    let count = 1;
                    statusLog(`Processing transfer to wallet: ${Destination} for ${Amount} NFTs`);

                    let i = 0;
                    do {
                        if (counter >= Amount) break;
                        let nft = transactionNFTArray[i];
                        statusLog(`Sending NFT: ${count} of ${Amount} to wallet ${Destination}`);

                        let sellPayload;
                        let ts_result_offer;
                        let ts_signed_offer;
                        let cst_prepared_offer;
                        try {
                            // Prepare, sign, and submit the offer
                            sellPayload = SellOfferTxnPayload(nft.NFTokenID, Destination, Amount);
                            statusLog('sellPayload is loaded...')
                            cst_prepared_offer = await client.autofill(sellPayload);
                            statusLog('offer prepared...')
                            ts_signed_offer = hot_wallet.sign(cst_prepared_offer);
                            statusLog('offer signed...')
                            ts_result_offer = await client.submitAndWait(ts_signed_offer.tx_blob);
                            statusLog('offer submitted...')

                            // If the offer was successful, remove the NFT from the array
                            if (ts_result_offer.result.meta.TransactionResult === "tesSUCCESS") {
                                statusLog('Transfer offer successful');
                                transactionNFTArray.splice(i, 1);
                                counter++;
                                count++;
                            }
                        } catch (error) {
                            statusLog('error submitting offer: ' + error);
                        }
                        i++;
                    } while (i < transactionNFTArray.length);
                }
            } catch (error) {
                statusLog('error during transfer: ' + error);
            }

            // Enable the execute button
            document.getElementById('executeButton').disabled = false;

            return;
        }


        function SellOfferTxnPayload(tokenId, destination, amount) {
            // if element <p id='expiration> contains a value
            let exp = document.getElementById('expiration').value;
            const expiration = xrpl.unixTimeToRippleTime(new Date(exp));
            //log the value
            statusLog('expiration: ' + expiration);
            // if expiration is empty...
            if (expiration != 0) {
                txnPayload = {
                    TransactionType: "NFTokenCreateOffer",
                    Account: userAddress,
                    NFTokenID: tokenId,
                    Amount: "0",
                    Flags: xrpl.NFTokenCreateOfferFlags.tfSellNFToken,
                    Destination: destination,
                    Expiration: expiration,
                };

            } else {
                txnPayload = {
                    TransactionType: "NFTokenCreateOffer",
                    Account: userAddress,
                    NFTokenID: tokenId,
                    Amount: "0",
                    Flags: xrpl.NFTokenCreateOfferFlags.tfSellNFToken,
                    Destination: destination
                };
            }


            return txnPayload;
        }

        // Function to convert emoji code to an emoji
        function emoji(code) {
            return String.fromCodePoint(code);
        }

        // Function to display the default XRPL server URL
        function displayDefaultServer() {
            const defaultNetwork = document.querySelector('input[name="network"]:checked').value;
            statusLog(`default network: ${defaultNetwork}`);
            //consoleLog.value += `default network: ${defaultNetwork}`;
            const xrplServer = document.getElementById('xrplServer');

            // Read the configuration file based on the selected network
            fs.readFile(path.join(__dirname, 'config', `default-${defaultNetwork}.json`), 'utf-8', (err, data) => {
                if (err) {
                    console.error(`Error reading the file: ${err.message}`);
                    return;
                }

                // Parse the JSON data
                const config = JSON.parse(data);

                // Set the textContent of the xrplServer element
                xrplServer.textContent = 'XRPL Server: ' + config.XRPL_Server;
            });
        }
        // Function to generate wallet address from seed
        function deriveAddressFromSeed(seed) {
            const keypairs = require('ripple-keypairs');
            const xrpl = require('xrpl');
            const keypair = xrpl.deriveKeypair(seed);
            const address = xrpl.deriveAddress(keypair.publicKey);
            userAddress = address;
            statusLog('Derived XRP address from seed.');
            consoleLog.value += '\nAddress: ' + address;
            document.getElementById('address').textContent = '\nAddress: ' + address;
            return address;
        }

        // Function to get NFTs from XRPL
        async function xrplgetNFTs(address) {
            // initialize xrpl client
            const usingURL = document.getElementById('xrplServer').textContent.split(' ')[2]
            const client = new xrpl.Client(usingURL);
            try {
                await client.connect();
            } catch (error) {
                statusLog('Error connecting to the server: ' + error.message);
                return;
            }

            let consoleLog = document.getElementById('consoleLog');
            statusLog('Retrieving NFT data');
            let allNfts = [];
            let marker;
            do {
                let response = await client.request({
                    command: 'account_nfts',
                    account: address,
                    ledger_index: 'validated',
                    limit: 400, // maximum limit
                    marker: marker
                });
                let nfts = response.result.account_nfts;
                allNfts.push(...nfts);
                marker = response.result.marker;
                consoleLog.value += '.';
            } while (marker);
            client.disconnect();
            statusLog('NFT data received.\nTotal NFTs found: ' + allNfts.length);
            //consoleLog.value += '\nNFTs:';
            //consoleLog.value += JSON.stringify(allNfts, null, 2);

            return allNfts;
        }

        // Function to Verify wallet address
        async function checkAccountValidity(address) {
            statusLog('Validating account...');
            const usingURL = document.getElementById('xrplServer').textContent.split(' ')[2]
            //consoleLog.value += `\nserver: ${usingURL}`;

            const client = new xrpl.Client(usingURL);

            try {
                //consoleLog.value += "\n'account_info' method";
                await client.connect();
                consoleLog.value += '... connected.'
            } catch (error) {
                statusLog('Error connecting to the server: ' + error.message);
                return [false];
            }

            // Check if account is valid
            const accountInfoResponse = await client.request({
                command: 'account_info',
                account: address
            });

            if (accountInfoResponse.result.account_data) {
                // Check if account balance is greater than 0
                if (parseInt(accountInfoResponse.result.account_data.Balance) > 0) {
                    // Get NFTs
                    const allNfts = await xrplgetNFTs(address);

                    //consoleLog.value += `\nRetrieved data for ${allNfts.length}\n NFTs using xrplgetNFTs()\n`;

                    if (Object.keys(allNfts).length > 0) {
                        // Account is valid
                        statusLog('Account is valid!');
                        document.getElementById('address').textContent = 'Address: ' + accountInfoResponse.result.account_data.Account + emoji(0x2714);
                        return [true, allNfts];
                    } else {
                        // Account does not have NFTs
                        statusLog('Account is not valid: No NFTs... Try another account.');
                        return [false];
                    }
                } else {
                    // Account balance is not greater than 0
                    statusLog('Account is not valid: Balance is not greater than 0');
                    document.getElementById('address').textContent = 'Address: ' + accountInfoResponse.result.account_data.Account + emoji(0x274C);
                    return [false];
                }
                // Am I really disconnecting here if the conditionals have a 'return' command?
            }

        }

        let NFTCountMap = new Map(); // Map of NFTs sorted by Taxon
        /**
         * Function to sort NFTs by Taxon
         * @param {Array} nfts Array of NFT objects
         * @returns {Map} NFTCountMap Map of NFTs sorted by Taxon
         */
        function sortNFTsByTaxon(nfts) {
            const sortingMap = new Map(); // Map of NFTs sorted by Taxon

            if (Array.isArray(nfts)) {
                statusLog('Sorting NFTs by Taxon\n');

                // for testing:
                // try {
                //     console.log('nfts:', JSON.stringify(nfts, null, 2)); // Check the contents of nfts

                // } catch (error) {
                //     // log error
                //     statusLog('Error:', error);
                // }

                nfts.forEach(nft => {
                    let taxon = nft.NFTokenTaxon;
                    if (taxon === undefined) {
                        console.log('Taxon is undefined for NFT:', nft);
                    } else {
                        if (sortingMap.has(taxon)) {
                            sortingMap.get(taxon).push(nft);
                            consoleLog.value += '.';
                        } else {
                            sortingMap.set(taxon, [nft]);
                        }
                    }
                });

                if (sortingMap.size === 0) {
                    statusLog('\nNFTCountMap is not initialized or populated. Something is wrong with the data flow in the application.\n');
                } else {
                    //statusLog('\nNFTCountMap loaded and sorted by Taxon. Moving on...\n');
                    // send NFTCountMap back to the calling method
                    sortingMap.forEach((value, key) => {
                        console.log(`Taxon: ${key} -> ${value.map(nft => JSON.stringify(nft)).join(', ')}`);
                    });
                    consoleLog.value += '\nsorted!';
                    return sortingMap;
                }


            } else {
                statusLog('NFTs variable is not an array:', nfts);
            }


        }

        /**
         * Function to remove NFTs with active sell offers from a map of NFTs
         * 
         * where the key is the Taxon, and the value is an array of NFT objects.
         * 
         * @param {Map} mapToFilter The map of NFTs to filter
         * @returns {Map} The modified map of NFTs, with the NFTs with active sell offers removed
         */
        async function filterSellOffers(mapToFilter) {

            // Remove NFTs with active sell offers
            statusLog('Removing NFTs with active Sell offers...');

            // Get the URL of the XRPL server from the form
            const usingURL = document.getElementById('xrplServer').textContent.split(' ')[2];
            statusLog('\nConnecting to server...' + usingURL);

            // Connect to the XRPL server
            client = new xrpl.Client(usingURL);
            await client.connect();
            consoleLog.value += '...connected!'
            let removedCount = 0; // Keep track of the number of NFTs removed
            let errorCount = 0; // Keep track of errors during tx

            // Iterate over the map of NFTs
            for (const taxon of mapToFilter.keys()) {
                const objects = mapToFilter.get(taxon); // Get the array of NFT objects for this Taxon

                // Iterate backwards over the array of NFT objects for this Taxon
                // to avoid issues with splicing
                for (let i = objects.length - 1; i >= 0; i--) {
                    const object = objects[i]; // Get the current NFT object

                    // Set up the parameters for the XRPL command to get the NFT sell offers
                    const params = {
                        command: 'nft_sell_offers',
                        nft_id: object.NFTokenID,
                        ledger_index: 'validated',
                        limit: 100
                    };

                    // Log the NFT ID being checked
                    statusLog(`\nChecking ID: ${object.NFTokenID}...`);

                    try {
                        // Make the XRPL request to get the NFT sell offers
                        const response = await client.request(params);

                        // If there are any sell offers, remove the NFT from the map
                        if (response.result.offers.length > 0) {
                            consoleLog.value += ` ${emoji(0x274C)}`; // X
                            objects.splice(i, 1); // Remove the NFT from the array
                            removedCount++; // Increment the number of NFTs removed
                        }
                        // If there are no sell offers, log the NFT as unchanged
                        else {
                            consoleLog.value += ` ${emoji(0x1F7E9)}`; // green box
                        }
                    }
                    catch (error) {
                        // If the NFT doesn't exist, log the error and move on
                        if (error.message.includes('The requested object was not found.')) {
                            consoleLog.value += ` ${emoji(0x1F7E9)}`; // X
                            // objects.splice(i, 1); // Remove the NFT from the array
                            // errorCount++; // Increment the number of NFTs removed bc of error
                        }
                        // If there was some other error, log the error and stop the script
                        else {
                            statusLog(`\nSomething went wrong when submitting last transaction.`);
                            // consoleLog.value += ` ${emoji(0x1F7E9)}`; // X
                            // objects.splice(i, 1); // Remove the NFT from the array
                            // errorCount++; // Increment the number of NFTs removed bc of error
                        }
                    }
                }
                // load new values into the map
                mapToFilter.set(taxon, objects);
            }

            // Log the number of NFTs removed
            statusLog(`Removed ${removedCount} NFTs with active sell offers`);
            if (errorCount > 0) {consoleLog.value += `\nRemoved ${errorCount} NFTs due to error`};


            // Return the modified map of NFTs

            await client.disconnect();
            // statusLog('Finished filterSellOffers');
            // return the value of the object
            return mapToFilter;

        }

        /**
         * Handle file selection and read data from selected file.
         * 
         * @param {Event} event Event object from the file input element
         */
        async function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return; // If no file is selected, exit the function

            //statusLog('Handle file select event');
            wallets = []; // Reset the wallets array

            try {
                const data = await readCSVFile(file);
                if (!Array.isArray(data)) {
                    statusLog('Data is not an array:', data);
                    throw new Error('Data is not an array');
                }
                //statusLog(`Data from file ${file.name}:`);
                //statusLog(data.map(obj => `Destination: ${obj.Destination}, Amount: ${obj.Amount}`).join(',\n'));

                wallets = data;
                if (!wallets) {
                    statusLog(`failed to pass data to 'wallets' object`);
                    throw new Error('Failed to pass data to wallets object');
                }

                //statusLog(`File ${file.name} stored in 'wallets'.`);
                //statusLog(`'wallets' object data:\n` + wallets.map(obj => `Destination: ${obj.Destination}, Amount: ${obj.Amount}`).join(',\n'));
                let totalAmount = wallets.reduce((acc, { Amount }) => acc + parseInt(Amount, 10), 0);
                //statusLog("Wallets and Amounts:");
                // wallets.forEach(({ Destination, Amount }, index) => {
                //     statusLog(`${index + 1}. Destination: ${Destination}, Amount: ${Amount}`);
                // });
                //statusLog(`'wallets' object data:\n` + wallets.map(obj => `Destination: ${obj.Destination}, Amount: ${obj.Amount}`).join(',\n'));
                consoleLog.value += `\nTotal NFTs to airdrop: ${totalAmount}`;

            } catch (error) {
                statusLog('Error reading file:', error);
                throw error;
            }
        }

        /**
         * Read CSV file function.
         * 
         * This function reads a CSV file and returns a JavaScript object with the data.
         * 
         * @param {File} file The file to read
         * @return {Promise<Object[]>} An array of objects with the CSV data
         */
        async function readCSVFile(file) {
            //statusLog('Reading CSV file');
            try {
                const fileContent = await fs.promises.readFile(file.path, 'utf-8');
                const rows = fileContent.trim().split('\n'); // split the data into rows
                //statusLog('CSV data read');
                const header = rows.shift().split(','); // extract the header
                //statusLog('Header extracted');
                const arrayData = rows.map(row => {
                    const cleanedRow = row.startsWith(',') ? row.slice(1) : row; // remove leading comma
                    return cleanedRow.split(','); // split the row into columns
                });
                //statusLog('Rows parsed');

                // Add the header back into arrayData
                arrayData.unshift(header);

                // convert array of strings to an array of json objects with keys 'Destination' and 'Amount'
                const jsonData = arrayData.slice(1).map(row => {
                    const destination = row[0];
                    const amount = row[1];
                    return { Destination: destination, Amount: amount };
                });
                statusLog('CSV data is loaded');

                // Update the textarea with the parsed data
                document.getElementById('csvData').value = arrayData.map(row => row.join(',')).join('\n');
                //statusLog('Updated textarea with parsed data');

                return jsonData;

            } catch (error) {
                statusLog('Error reading CSV file:', error);
                throw error;
            }
        }





        /////////////////////
        // EVENT LISTENERS //
        /////////////////////

        // When radio buttons for network selection change
        document.querySelectorAll('input[name="network"]').forEach(elem => {
            elem.addEventListener('change', function () {
                //displayDefaultServer();
                const defaultNetwork = document.querySelector('input[name="network"]:checked').value;
                statusLog(`default network: ${defaultNetwork}`);
                //consoleLog.value += `\ndefault network: ${defaultNetwork}`;
                const xrplServer = document.getElementById('xrplServer');

                // Read the configuration file based on the selected network
                fs.readFile(path.join(__dirname, 'config', `default-${defaultNetwork}.json`), 'utf-8', (err, data) => {
                    if (err) {
                        console.error(`Error reading the file: ${err.message}`);
                        return;
                    }

                    // Parse the JSON data
                    const config = JSON.parse(data);

                    // Set the textContent of the xrplServer element
                    xrplServer.textContent = 'XRPL Server: ' + config.XRPL_Server;
                    
                    alert('You are now on ' + this.value.toUpperCase() + 'NET!');
                });

            });
        });

        // When user clicks View button
        document.getElementById('viewSeed').addEventListener('mousedown', function () {
            document.getElementById('seed').type = 'text';
        });
        document.getElementById('viewSeed').addEventListener('mouseup', function () {
            document.getElementById('seed').type = 'password';
        });

        // When user clicks Verify button

        document.getElementById('verifySeed').addEventListener('click', async () => {
            const consoleLog = document.getElementById('consoleLog');
            statusLog('\nStarting process...');


            // Get address from seed
            const seed = document.getElementById('seed').value;
            const address = deriveAddressFromSeed(seed);

            // Validate account
            const isValid = await checkAccountValidity(address)
            // display the returned nfts from checkAccountValidity
            //consoleLog.value += 'account valid: ' + JSON.stringify(isValid[0]);
            //let nfts;
            //if isValid is false, log exit, else if true, const nfts = await getNFTs(client, address);
            if (isValid[0] == false) {
                consoleLog.value += '... Try another account.';
                return;
            }
            //else {

            consoleLog.value += '... Account is valid.';


            // Pass NFTs to sortNFTsByTaxon()
            const nfts = isValid[1]; // here we have an array of all nft objects belonging to the account
            const NFTCountMap = sortNFTsByTaxon(nfts); // returns map of NFTs sorted by NFTs
            //log error if the map is not valid
            if (!NFTCountMap) {
                statusLog('Error sorting NFTs by Taxon: NFTCountMap is not valid');
                return;
            }

            // allow NFTCountMap to be used in this function
            //statusLog('\nNFTCountMap: ' + JSON.stringify(NFTCountMap));
            // return NFTCountMap;


            //statusLog('\nNFTCountMap: ' + JSON.stringify(NFTCountMap));
            filteredNFTMap = await filterSellOffers(NFTCountMap);

            if (filteredNFTMap !== undefined && filteredNFTMap !== null) {
                // convert the Map to an array of key/value pairs
                const mapEntries = Array.from(filteredNFTMap.entries());
                // convert the key/value pairs to a string
                const mapAsString = mapEntries.reduce((acc, curr) => acc + curr[0] + ': ' + JSON.stringify(curr[1], null, 2) + ',\n', '{\n') + '}';
                //statusLog('\nSorted and filtered list of NFTs: ' + mapAsString);



                // Log a count of objects per taxon in filteredNFTMap
                statusLog('NFTs per Taxon ID:\n');
                filteredNFTMap.forEach((value, key) => {
                    consoleLog.value += `Taxon: ${key}\n` +
                        'Available NFTs: '.padEnd(16) + value.length + '\n' +
                        '='.repeat(20) + '\n';
                });

                // clear all the values in the <select id='nftDropdown'> element
                document.getElementById('nftDropdown').innerHTML = '';

                // Display the taxon count in the dropdown menu
                const nftsDropdown = document.getElementById('nftDropdown');
                filteredNFTMap.forEach((objects, taxon) => {
                    const option = document.createElement('option');
                    option.value = taxon;
                    option.text = `Taxon: ${taxon}, ${objects.length}`;
                    nftsDropdown.add(option);
                });
                
                // log a message if element <input type="file" id="csvFile"> has no file
                if (!document.getElementById('csvFile').files.length) {
                    statusLog('Finished processing NFTs\n\nAdd a .csv file containing the receiving wallet addresses\nwith header: Destination,Amount');
                }

                //statusLog('Finished processing NFTs\n\nAdd a .csv file containing the receiving wallet addresses\nwith header: Destination,Amount');

                await client.disconnect();
            } else {
                statusLog('\nThere was a problem filtering out sell offers: the map is undefined or null');
            }
        });

        // When .csv File input
        document.getElementById('csvFile').addEventListener('change', handleFileSelect);

        // When Execute airdrop button is clicked
        document.getElementById('executeButton').addEventListener('click', async () => {
            try {

                // deactivate the button
                document.getElementById('executeButton').disabled = true;

                // goAirdrop()
                const goAirdropPromise = goAirdrop(filteredNFTMap);
                await goAirdropPromise;
                statusLog('success');



                //activate the button
                document.getElementById('executeButton').disabled = false;
            } catch (error) {
                statusLog('Error occurred: ' + error.message);

                //activate the button
                document.getElementById('executeButton').disabled = false;
            }
            return;
        });

        // When window loads
        window.onload = function () {

            // log user instructions
            //statusLog('Please select a network and enter your account seed.\nDO NOT SHARE YOUR SEED\nThis program does not transmit your seed.');
            consoleLog.value += 'Select a network and enter your account seed.\nDO NOT SHARE YOUR SEEDPHRASE TO A WEBSITE\nThis program does not transmit your seed phrase.'

            displayDefaultServer();
        }

    } else {
        console.error("Node.js integration is disabled; this app requires Node.js to function properly.");
    }
});