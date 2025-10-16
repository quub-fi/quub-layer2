# Multi-Chain Deployment Quick Start

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Private key with testnet funds

  - [ ] Sepolia ETH (get from https://sepoliafaucet.com/)
  - [ ] BSC testnet BNB (get from https://testnet.binance.org/faucet-smart)
  - [ ] Polygon Mumbai MATIC (get from https://faucet.polygon.technology/)

- [ ] RPC URLs (free from Alchemy, Infura, or public RPCs)

## Step 1: Create Environment File

```bash
cd contracts
cp .env.example .env
```

Then edit `.env` with your actual values:

```bash
# Required for all deployments
PRIVATE_KEY=your_private_key_here

# Ethereum Sepolia (Optional - for testing)
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# BSC Testnet (Required for multi-chain)
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Polygon Mumbai (Required for multi-chain)
MUMBAI_URL=https://rpc-mumbai.maticvigil.com/

# For contract verification (optional)
ETHERSCAN_API_KEY=your_etherscan_key
BSCSCAN_API_KEY=your_bscscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
```

## Step 2: Test Configuration

Test that your configuration works:

```bash
# Test BSC Testnet connection
npx hardhat run scripts/deploy.js --network bscTestnet

# Test Mumbai connection
npx hardhat run scripts/deploy.js --network mumbai
```

## Step 3: Run Multi-Chain Deployment

Use the automated script:

```bash
./deploy-multichain.sh
```

This will:

1. Deploy to BSC Testnet
2. Deploy to Polygon Mumbai
3. Save all contract addresses
4. Create a summary report

## Step 4: Configure Sequencer

After successful deployment, update the main `.env` file:

```bash
cd ..
cp .env.multichain.example .env
```

Then add the deployed contract addresses from `deployment-addresses.json`:

```bash
# Copy addresses from deployment-addresses.json
ETH_SETTLEMENT_CONTRACT=0x... # (if you deployed to Sepolia)
BSC_SETTLEMENT_CONTRACT=0x... # from deployment-addresses.json
POLYGON_SETTLEMENT_CONTRACT=0x... # from deployment-addresses.json
```

## Step 5: Test Multi-Chain Settlement

```bash
cd sequencer
npm run example:multichain
```

You should see output analyzing all three chains and selecting the best one!

## Troubleshooting

### "Network doesn't exist"

- Check that you're in the `contracts` directory
- Verify `hardhat.config.js` has the network configured

### "insufficient funds"

- Get testnet tokens from the faucets listed above
- Wait a few minutes for faucet transactions to confirm

### "connection failed"

- Check your RPC URL is correct
- Try using public RPCs (no API key needed):
  - BSC Testnet: `https://data-seed-prebsc-1-s1.binance.org:8545/`
  - Mumbai: `https://rpc-mumbai.maticvigil.com/`

### "nonce too low/high"

- Wait a few minutes and try again
- Or reset your account nonce in MetaMask

## Manual Deployment (Alternative)

If the script doesn't work, deploy manually:

```bash
cd contracts

# Deploy to BSC Testnet
npx hardhat run scripts/deploy.js --network bscTestnet

# Copy the contract addresses from output

# Deploy to Mumbai
npx hardhat run scripts/deploy.js --network mumbai

# Copy the contract addresses from output

# Manually update .env file with addresses
```

## Verification (Optional)

Verify contracts on block explorers:

```bash
# BSC Testnet
npx hardhat verify --network bscTestnet DEPLOYED_ADDRESS

# Mumbai
npx hardhat verify --network mumbai DEPLOYED_ADDRESS
```

## Next Steps

Once deployed:

1. ✅ Test with example script
2. ✅ Integrate with main sequencer
3. ✅ Monitor gas costs on each chain
4. ✅ Start routing transactions!

## Quick Reference

**Faucets:**

- Sepolia: https://sepoliafaucet.com/
- BSC Testnet: https://testnet.binance.org/faucet-smart
- Mumbai: https://faucet.polygon.technology/

**Block Explorers:**

- Sepolia: https://sepolia.etherscan.io/
- BSC Testnet: https://testnet.bscscan.com/
- Mumbai: https://mumbai.polygonscan.com/

**Public RPCs:**

- BSC Testnet: https://data-seed-prebsc-1-s1.binance.org:8545/
- Mumbai: https://rpc-mumbai.maticvigil.com/

## Files Generated

After deployment, you'll have:

- `deployment-addresses.json` - All contract addresses
- `deployment-summary.md` - Deployment report
- Updated `.env` in root with contract addresses

## Success!

When you see:

```
✓ All deployments successful!
✓ Addresses saved to deployment-addresses.json
✓ Summary saved to deployment-summary.md
```

You're ready to start using multi-chain settlement! 🚀
