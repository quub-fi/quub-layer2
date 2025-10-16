# Multi-Chain Deployment Guide

## Prerequisites

1. **Get Testnet Funds**

   - BSC Testnet: https://testnet.bnbchain.org/faucet-smart
   - Polygon Mumbai: https://faucet.polygon.technology/

2. **Get RPC URLs** (Free tier is fine)

   - Alchemy: https://www.alchemy.com/
   - Infura: https://www.infura.io/

3. **Have a Private Key**
   - Create a new wallet for testing
   - Export private key (without 0x prefix)

## Step 1: Configure Environment

From the project root:

```bash
# Copy the example file
cp contracts/.env.example contracts/.env

# Edit with your values
nano contracts/.env  # or use your preferred editor
```

Add your values:

```
PRIVATE_KEY=your_64_character_private_key_without_0x
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
MUMBAI_URL=https://rpc-mumbai.maticvigil.com/
```

## Step 2: Deploy to BSC Testnet

```bash
cd contracts
npx hardhat run scripts/deploy.js --network bscTestnet
```

Expected output:

```
Deploying contracts...
MockERC20 deployed to: 0xABC123...
L1Bridge deployed to: 0xDEF456...
OptimisticRollup deployed to: 0xGHI789...
✓ Deployment complete!
```

**Save these addresses!** You'll need them for configuration.

## Step 3: Deploy to Polygon Mumbai

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

Expected output:

```
Deploying contracts...
MockERC20 deployed to: 0x123ABC...
L1Bridge deployed to: 0x456DEF...
OptimisticRollup deployed to: 0x789GHI...
✓ Deployment complete!
```

**Save these addresses too!**

## Step 4: Configure Multi-Chain Settlement

From the project root:

```bash
# Copy the multi-chain environment template
cp .env.multichain.example .env.multichain

# Edit with your deployed contract addresses
nano .env.multichain
```

Update with your addresses:

```bash
# Your private key (same as contracts/.env)
SETTLEMENT_PRIVATE_KEY=0xyour_private_key_here

# BSC Testnet
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_SETTLEMENT_CONTRACT=0xYOUR_BSC_OPTIMISTIC_ROLLUP_ADDRESS
BSC_BRIDGE_CONTRACT=0xYOUR_BSC_BRIDGE_ADDRESS

# Polygon Mumbai
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com/
POLYGON_SETTLEMENT_CONTRACT=0xYOUR_MUMBAI_OPTIMISTIC_ROLLUP_ADDRESS
POLYGON_BRIDGE_CONTRACT=0xYOUR_MUMBAI_BRIDGE_ADDRESS

# Ethereum Sepolia (if you want to use it)
ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETH_SETTLEMENT_CONTRACT=0xYOUR_SEPOLIA_ADDRESS
ETH_BRIDGE_CONTRACT=0xYOUR_SEPOLIA_BRIDGE_ADDRESS
```

## Step 5: Test the Multi-Chain Setup

```bash
cd sequencer

# Install dependencies if needed
npm install

# Run the multi-chain example
npm run example:multichain
```

Expected output:

```
=== Multi-Chain Settlement Example ===

[Settlement Router] Registered Ethereum (Sepolia) adapter
[Settlement Router] Registered BSC (Testnet) adapter
[Settlement Router] Registered Polygon (Mumbai) adapter
[Settlement Router] Connecting to all chains...
[BSC (Testnet)] Connected successfully
[Polygon (Mumbai)] Connected successfully
[Settlement Router] Connected to 2/3 chains

--- Analyzing Batch ---
[Settlement Router] Chain analysis results:
  Polygon (Mumbai): score 85.30, cost 0.002000 mETH, time 2s ✓✓ BEST
  BSC (Testnet): score 72.10, cost 0.005000 mETH, time 3s ✓ GOOD
```

## Step 6: Verify Deployments

### Check on Block Explorers

**BSC Testnet:**

- Go to: https://testnet.bscscan.com/
- Search for your contract addresses
- Verify contracts are deployed

**Polygon Mumbai:**

- Go to: https://mumbai.polygonscan.com/
- Search for your contract addresses
- Verify contracts are deployed

## Troubleshooting

### "Network doesn't exist"

- Make sure you're in the `contracts` directory
- Check that hardhat.config.js has the network configured

### "Insufficient funds"

- Get testnet tokens from faucets (links above)
- Check your wallet has BNB (BSC) or MATIC (Polygon)

### "Cannot connect to RPC"

- Check your RPC URL is correct
- Try alternative RPC URLs:
  - BSC Testnet: https://data-seed-prebsc-2-s1.binance.org:8545/
  - Mumbai: https://polygon-testnet.public.blastapi.io

### "Private key error"

- Make sure PRIVATE_KEY is set in contracts/.env
- Remove any '0x' prefix from the key
- Ensure it's a valid 64-character hex string

### "Contract deployment failed"

- Check gas price settings in hardhat.config.js
- Try increasing gas limit
- Ensure you have enough testnet tokens

## Deployment Checklist

- [ ] Get testnet funds (BSC & Polygon)
- [ ] Configure contracts/.env with private key and RPC URLs
- [ ] Deploy to BSC testnet
- [ ] Deploy to Polygon Mumbai
- [ ] Save all deployed contract addresses
- [ ] Configure .env.multichain with addresses
- [ ] Test with example:multichain script
- [ ] Verify contracts on block explorers

## Quick Commands Reference

```bash
# Deploy to BSC Testnet
cd contracts && npx hardhat run scripts/deploy.js --network bscTestnet

# Deploy to Polygon Mumbai
cd contracts && npx hardhat run scripts/deploy.js --network mumbai

# Test multi-chain
cd sequencer && npm run example:multichain

# Verify contract on BSC
npx hardhat verify --network bscTestnet DEPLOYED_CONTRACT_ADDRESS

# Verify contract on Polygon
npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS
```

## Network Information

### BSC Testnet

- Chain ID: 97
- RPC: https://data-seed-prebsc-1-s1.binance.org:8545/
- Explorer: https://testnet.bscscan.com/
- Faucet: https://testnet.bnbchain.org/faucet-smart

### Polygon Mumbai

- Chain ID: 80001
- RPC: https://rpc-mumbai.maticvigil.com/
- Explorer: https://mumbai.polygonscan.com/
- Faucet: https://faucet.polygon.technology/

## Next Steps

After successful deployment:

1. Integrate settlement router into main sequencer
2. Set up monitoring for all chains
3. Test with real L2 transactions
4. Consider deploying to mainnets

## Support

- Hardhat docs: https://hardhat.org/docs
- BSC docs: https://docs.bnbchain.org/
- Polygon docs: https://docs.polygon.technology/

---

**Ready to deploy?** Start with Step 1! 🚀
