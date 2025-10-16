# Multi-Chain Deployment Setup Guide

## 🎯 Quick Setup (5 minutes)

### Step 1: Configure Your Private Key

Edit the `.env` file in the `contracts` directory:

```bash
# Open .env in your editor
code .env
# or
nano .env
```

Replace `your_private_key_here` with your actual private key:

```bash
PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE
```

⚠️ **Important**:

- DO NOT commit this file to git (it's already in .gitignore)
- This key will be used to deploy contracts on all networks
- Make sure this account has testnet tokens on all chains

### Step 2: Get Free RPC URLs

The default RPC URLs in `.env` are public but can be slow/rate-limited. For better performance, get free API keys:

#### Option A: Alchemy (Recommended)

1. Go to [https://www.alchemy.com/](https://www.alchemy.com/)
2. Sign up for free account
3. Create apps for:
   - **Ethereum Sepolia**
   - **Polygon Mumbai** (or Amoy testnet)
4. Get your API keys and update `.env`:

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY
```

#### Option B: Infura

1. Go to [https://www.infura.io/](https://www.infura.io/)
2. Sign up for free account
3. Create projects for each network
4. Update `.env` with your Infura URLs

#### Option C: Use Public RPCs (Quick Start)

The current `.env` has public RPCs that work but may be slower:

- BSC Testnet: `https://data-seed-prebsc-1-s1.binance.org:8545/`
- Polygon Mumbai: `https://rpc-mumbai.maticvigil.com/` (currently unreachable, try alternatives below)

**Alternative Polygon Mumbai RPCs** (update in `.env`):

```bash
# Try these if current one doesn't work:
POLYGON_MUMBAI_RPC_URL=https://polygon-testnet.public.blastapi.io
# or
POLYGON_MUMBAI_RPC_URL=https://rpc.ankr.com/polygon_mumbai
# or
POLYGON_MUMBAI_RPC_URL=https://matic-mumbai.chainstacklabs.com
```

### Step 3: Get Testnet Tokens

You need testnet tokens to deploy contracts. Here's where to get them:

#### Ethereum Sepolia

1. **Alchemy Faucet**: [https://www.alchemy.com/faucets/ethereum-sepolia](https://www.alchemy.com/faucets/ethereum-sepolia)
2. **Infura Faucet**: [https://www.infura.io/faucet/sepolia](https://www.infura.io/faucet/sepolia)
3. **Sepolia PoW Faucet**: [https://sepolia-faucet.pk910.de/](https://sepolia-faucet.pk910.de/)

Send to: Your wallet address (from your private key)
Amount needed: ~0.5 SepoliaETH

#### BSC Testnet

1. **Official BNB Faucet**: [https://testnet.bnbchain.org/faucet-smart](https://testnet.bnbchain.org/faucet-smart)
2. **Alternative**: [https://testnet.binance.org/faucet-smart](https://testnet.binance.org/faucet-smart)

Send to: Your wallet address
Amount needed: ~0.5 tBNB

#### Polygon Mumbai

1. **Alchemy Faucet**: [https://mumbaifaucet.com/](https://mumbaifaucet.com/)
2. **Official Faucet**: [https://faucet.polygon.technology/](https://faucet.polygon.technology/)
3. **QuickNode**: [https://faucet.quicknode.com/polygon/mumbai](https://faucet.quicknode.com/polygon/mumbai)

Send to: Your wallet address
Amount needed: ~1 MATIC

### Step 4: Verify Your Setup

Run the verification script:

```bash
./verify-setup.sh
```

You should see all green checkmarks ✓

### Step 5: Deploy Contracts

Once verified, deploy to all networks:

```bash
./deploy-multichain.sh
```

This will:

1. Deploy to BSC Testnet
2. Deploy to Polygon Mumbai
3. Save contract addresses to `deployed-addresses.json`
4. Update your environment files

## 📋 Checklist

Before deploying, make sure you have:

- [ ] Private key configured in `.env`
- [ ] RPC URLs configured (Alchemy, Infura, or public)
- [ ] Testnet tokens in your wallet:
  - [ ] 0.5+ SepoliaETH
  - [ ] 0.5+ tBNB (BSC Testnet)
  - [ ] 1+ MATIC (Mumbai)
- [ ] Ran `./verify-setup.sh` with no errors
- [ ] Dependencies installed (`npm install`)

## 🚨 Troubleshooting

### "Polygon Mumbai RPC unreachable"

Try alternative RPC URLs (see Step 2, Option C above)

### "Insufficient funds for gas"

Get more testnet tokens from the faucets above

### "Network bscTestnet doesn't exist"

Make sure you're in the `contracts` directory when running commands

### "PRIVATE_KEY not configured"

Edit `.env` and replace `your_private_key_here` with your actual key

### "Cannot find module 'hardhat'"

Run `npm install` in the contracts directory

## 🔐 Security Notes

1. **Never commit your `.env` file** - It contains your private key
2. **Use a separate wallet for testing** - Don't use your main wallet
3. **These are testnets** - Tokens have no real value
4. **Keep your private key safe** - Anyone with it can access your funds

## 🎯 Next Steps

After successful deployment:

1. Contract addresses will be saved in `deployed-addresses.json`
2. Update the main `.env.multichain.example` with your addresses
3. Test the multi-chain settlement:
   ```bash
   cd ../sequencer
   npm run example:multichain
   ```

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [BSC Testnet Explorer](https://testnet.bscscan.com/)
- [Polygon Mumbai Explorer](https://mumbai.polygonscan.com/)
- [Ethereum Sepolia Explorer](https://sepolia.etherscan.io/)

## 💡 Pro Tips

1. **Save your faucet links** - You'll need them again
2. **Monitor your testnet balances** - Use block explorers
3. **Test on one network first** - Before deploying to all
4. **Keep deployment logs** - The script saves them automatically
5. **Verify contracts** - Use block explorers to verify deployed contracts

---

**Need help?** Check the main documentation in `/docs/QUICK_START_MULTICHAIN.md`
