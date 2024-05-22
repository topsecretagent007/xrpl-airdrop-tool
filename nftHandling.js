const { statusLog } = require('./utils');
const xrpl = require('xrpl');

async function xrplgetNFTs(address) {
    const usingURL = document.getElementById('xrplServer').textContent.split(' ')[1];
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
            limit: 400,
            marker: marker
        });
        let nfts = response.result.account_nfts;
        allNfts.push(...nfts);
        marker = response.result.marker;
        consoleLog.value += '.';
    } while (marker);
    client.disconnect();
    statusLog('NFT data received.\nTotal NFTs found: ' + allNfts.length);

    return allNfts;
}

function sortNFTsByTaxon(nfts) {
    const sortingMap = new Map();

    if (Array.isArray(nfts)) {
        statusLog('Sorting NFTs by Taxon\n');
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

async function filterSellOffers(mapToFilter) {
    statusLog('Removing NFTs with active Sell offers...');
    const usingURL = document.getElementById('xrplServer').textContent.split(' ')[1];
    statusLog('\nConnecting to server...' + usingURL);

    const client = new xrpl.Client(usingURL);
    await client.connect();
    consoleLog.value += '...connected!'
    let removedCount = 0;
    let errorCount = 0;

    for (const taxon of mapToFilter.keys()) {
        const objects = mapToFilter.get(taxon);

        for (let i = objects.length - 1; i >= 0; i--) {
            const object = objects[i];
            const params = {
                command: 'nft_sell_offers',
                nft_id: object.NFTokenID,
                ledger_index: 'validated',
                limit: 100
            };

            statusLog(`\nChecking ID: ${object.NFTokenID}...`);

            try {
                const response = await client.request(params);

                if (response.result.offers.length > 0) {
                    consoleLog.value += ` ${emoji(0x274C)}`;
                    objects.splice(i, 1);
                    removedCount++;
                } else {
                    consoleLog.value += ` ${emoji(0x1F7E9)}`;
                }
            }
            catch (error) {
                if (error.message.includes('The requested object was not found.')) {
                    consoleLog.value += ` ${emoji(0x1F7E9)}`;
                } else {
                    statusLog(`\nSomething went wrong when submitting last transaction.`);
                }
            }
        }
        mapToFilter.set(taxon, objects);
    }

    statusLog(`Removed ${removedCount} NFTs with active sell offers`);
    if (errorCount > 0) { consoleLog.value += `\nRemoved ${errorCount} NFTs due to error` };

    await client.disconnect();
    return mapToFilter;
}

module.exports = { xrplgetNFTs, sortNFTsByTaxon, filterSellOffers };
