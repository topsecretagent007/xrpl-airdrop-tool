# XRPL NFT Airdrop Tool User Guide

## Introduction

The XRPL NFT Airdrop Tool is a desktop application that allows you to easily distribute Non-Fungible Tokens (NFTs) to a list of wallet addresses on the XRPL network. It provides a user-friendly interface to upload a CSV file containing wallet addresses, select an NFT to distribute, and set an expiration date for the claim.

## Getting Started

To use the XRPL NFT Airdrop Tool, follow these steps:

1.  Download and install the application by clicking on the "Releases" tab on the project's GitHub page.
2.  Launch the application.
3.  Select the XRPL network you want to use from the dropdown menu at the top of the interface.
4.  Enter your XRPL account seed in the "Seed" field. Ensure your seed remains confidential.
5.  Click "View" to toggle the visibility of your seed.
6.  Click "Verify" to validate the seed and fetch the XRPL address. During this process, all NFTSs will be sorted by Taxon and all NFTs with active sell orders are removed from the airdrop eligibility. This process may take some time depending on the amount of NFTs in the wallet.
7.  Select the NFT collection from the dropdown menu which you wish to airdrop.
8.  (optional) Set the claim expiration date & time for the NFTs using the date picker.
9.  Load a CSV file containing the wallet addresses and the amount of NFTs to distribute. The CSV format should be  `Destination, Amount`  (with header).
10.  Once all configurations are set, click the "Start airdrop" button to initiate the distribution process.
11.  Monitor the progress and any messages in the "Activity Log" area.

### Important Notes

-   Ensure that the XRPL server endpoints are properly configured depending on the network you are using.
-   This tool does not transmit your seed phrase over the network. Except for XRPL transactions, it operates entirely locally within your environment.
-   Regularly check for updates on the tool to enhance security and functionality.