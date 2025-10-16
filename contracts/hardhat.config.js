require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {
            chainId: 1337
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 1337
        },
        sepolia: {
            url: process.env.SEPOLIA_URL || "",
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
        },
        mainnet: {
            url: process.env.MAINNET_URL || "",
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
        },
        // BSC Testnet
        bscTestnet: {
            url: process.env.BSC_TESTNET_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
            chainId: 97,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 10000000000 // 10 gwei
        },
        // BSC Mainnet
        bsc: {
            url: process.env.BSC_URL || "https://bsc-dataseed.binance.org/",
            chainId: 56,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 5000000000 // 5 gwei
        },
        // Polygon Mumbai Testnet (DEPRECATED - use Amoy instead)
        // Mumbai was shut down in April 2024
        mumbai: {
            url: process.env.MUMBAI_URL || "https://rpc-amoy.polygon.technology/",
            chainId: 80002, // Amoy testnet chainId
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 10000000000 // 10 gwei
        },
        // Polygon Amoy Testnet (NEW - replaces Mumbai)
        amoy: {
            url: process.env.AMOY_URL || "https://rpc-amoy.polygon.technology/",
            chainId: 80002,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 10000000000 // 10 gwei
        },
        // Polygon Mainnet
        polygon: {
            url: process.env.POLYGON_URL || "https://polygon-rpc.com/",
            chainId: 137,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 50000000000 // 50 gwei
        }
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD"
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API_KEY,
            sepolia: process.env.ETHERSCAN_API_KEY,
            bsc: process.env.BSCSCAN_API_KEY,
            bscTestnet: process.env.BSCSCAN_API_KEY,
            polygon: process.env.POLYGONSCAN_API_KEY,
            polygonMumbai: process.env.POLYGONSCAN_API_KEY
        }
    }
};