# XRPL NFT Airdrop Tool

This tool is designed to facilitate the airdrop process on the XRP Ledger (XRPL) and is a work in progress... so you may encounter bugs. Please test on TESTNET before executing an airdrop on the MAINNET!!!

## Features

- Testnet/Mainnet selection.
- Scans account and removes NFTs with active sell orders/transfers.
- Use a CSV file of wallets to airdrop.

## Getting Started

To get started with the XRPL Airdrop Tool, follow these steps:

1. Ensure you have [Node.js](https://nodejs.org/) installed on your system.
2. Clone the repository to your local machine:

```bash
git clone https://github.com/xurgedigitallab/xrpl-nft-airdrop-tool.git
cd xrpl-airdrop-tool
```

3. Install the dependencies:
```bash
npm install
```

4. (optional) Replace the default TESTNET and MAINNET XRPL endpoints:
  - Locate the configuration files in the `config` directory of the project.
  - Open `default-main.json` to edit the mainnet configuration or `default-test.json` for the testnet configuration.
  - Find the `"XRPL_Server"` key in the JSON file.
  - Replace the existing URL with your WebSocket endpoint. For example:
```javascript
// default value for testnet:
{
    "XRPL_Server": "wss://s.altnet.rippletest.net:51233/"
  }
  ```
  ```javascript
  // default value for mainnet:
{
    "XRPL_Server": "wss://xrplcluster.com/"
  }
  ```

5. Start the application:

```bash
npm start
```


## Usage

This tool is designed to facilitate the airdrop of NFTs on the XRPL network. To use this tool, follow the steps below:

1. **Select Network:**
   - Choose between `TESTNET` and `MAINNET` at the top of the interface to connect to the appropriate XRPL server.

2. **Account Setup:**
   - Enter your XRPL account seed in the `Seed` field. Ensure your seed remains confidential.
   - Click `View` to toggle the visibility of your seed.
   - Click `Verify` to validate the seed and fetch the XRPL address. During this, all NFTSs will be sorted by Taxon and all NFTs with active sell orders are removed from from airdrop eligibility. This process may take some time depending on the amount of NFTs in the wallet.

3. **Configure Airdrop:**
   - Select the NFT collection from the dropdown menu which you wish to airdrop.
   - (optional) Set the claim expiration date & [local] time for the NFTs using the date picker.
   - Load a CSV file containing the wallet addresses and the amount of NFTs to distribute. The CSV format should be `Destination, Amount` (with header).

4. **Start Airdrop:**
   - Once all configurations are set, click the `Start airdrop` button to initiate the distribution process.
   - Monitor the progress and any messages in the `Activity Log` area.

5. **Activity Log:**
   - Check the `Activity Log` to view detailed status updates and any error messages during the airdrop process.

### Important Notes

- Ensure that the XRPL server endpoints are properly configured depending on the network you are using.
- This tool does not transmit your seed phrase over the network. Except for XRPL transactions, it operates entirely locally within your environment.
- Regularly check for updates on the tool to enhance security and functionality.

## Contributing
Contributions are welcome. Please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

