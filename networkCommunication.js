const { statusLog } = require('./utils');
const xrpl = require('xrpl');

async function goAirdrop(airdropList) {
    const selectElement = document.getElementById('nftDropdown');
    const selectedTaxon = parseInt(selectElement.value, 10);
    statusLog(`Selected taxon: ${selectedTaxon}`);

    const transactionNFTArray = Array.from(airdropList.get(selectedTaxon) || []);

    if (!transactionNFTArray.length) {
        statusLog('Error: transactionNFTArray is empty');
        return;
    }

    const totalAmount = wallets.reduce((acc, { Amount }) => acc + parseInt(Amount, 10), 0);
    const usingURL = document.getElementById('xrplServer').textContent.split(' ')[2];
    statusLog(`Sending ${totalAmount} NFTs`);

    statusLog('totalAmount value: ' + totalAmount);
    statusLog('transactionNFTArray value: ' + transactionNFTArray.length);

    if (transactionNFTArray.length < totalAmount) {
        statusLog(`Error: not enough NFTs of taxon ${selectedTaxon}`);
        return;
    }

    statusLog(`transactionNFTArray: ${JSON.stringify(transactionNFTArray, null, 2)}`);

    let client;

    try {
        statusLog(`xrpl endpoint: ${usingURL}`);
        if (!usingURL) { statusLog('failed to load the server url'); return; }
        statusLog('connecting...');
        client = new xrpl.Client(usingURL);
        await client.connect();
    } catch (error) {
        statusLog('Error connecting to the server: ' + error.message);
        return;
    }
    consoleLog.value += 'connected';

    let xrp_account_secret = document.getElementById('seed').value;
    try {
        hot_wallet = xrpl.Wallet.fromSeed(xrp_account_secret);
    } catch (error) {
        statusLog(`Error loading hot wallet: ${error}`);
        return;
    }
    statusLog('hot wallet is active');

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
                    sellPayload = SellOfferTxnPayload(nft.NFTokenID, Destination, Amount);
                    statusLog('sellPayload is loaded...');
                    cst_prepared_offer = await client.autofill(sellPayload);
                    statusLog('offer prepared...');
                    ts_signed_offer = hot_wallet.sign(cst_prepared_offer);
                    statusLog('offer signed...');
                    ts_result_offer = await client.submitAndWait(ts_signed_offer.tx_blob);
                    statusLog('offer submitted...');

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

    document.getElementById('executeButton').disabled = false;

    return;
}

function SellOfferTxnPayload(tokenId, destination, amount) {
    let exp = document.getElementById('expiration').value;
    const expiration = xrpl.unixTimeToRippleTime(new Date(exp));
    statusLog('expiration: ' + expiration);

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

module.exports = { goAirdrop, SellOfferTxnPayload };
