# Polygon Testnet Migration Guide

## ⚠️ Important: Mumbai Testnet Deprecated

**Polygon Mumbai testnet was shut down on April 13, 2024.**

## Migration to Polygon Amoy

We've updated the project to use **Polygon Amoy testnet**, which is the official replacement for Mumbai.

### What Changed

| Old (Mumbai) | New (Amoy) |
|--------------|------------|
| Chain ID: 80001 | Chain ID: 80002 |
| RPC: rpc-mumbai.maticvigil.com | RPC: rpc-amoy.polygon.technology |
| Deprecated ❌ | Active ✅ |

### Quick Start with Amoy

1. **Get Test MATIC**
   - Visit: https://faucet.polygon.technology/
   - Select "Polygon Amoy"
   - Enter your wallet address
   - Get free testnet MATIC

2. **Update Your Wallet**
   - **Network Name**: Polygon Amoy Testnet
   - **RPC URL**: https://rpc-amoy.polygon.technology/
   - **Chain ID**: 80002
   - **Currency Symbol**: MATIC
   - **Block Explorer**: https://amoy.polygonscan.com/

3. **Deploy Contracts**
   ```bash
   # Use 'amoy' network (recommended)
   npx hardhat run scripts/deploy.js --network amoy
   
   # OR use 'mumbai' (which now points to Amoy)
   npx hardhat run scripts/deploy.js --network mumbai
   ```

### Available Networks

After this update, you can deploy to:

```bash
# Ethereum testnets
npx hardhat run scripts/deploy.js --network sepolia

# BSC testnet
npx hardhat run scripts/deploy.js --network bscTestnet

# Polygon testnet (Amoy - new!)
npx hardhat run scripts/deploy.js --network amoy

# For backward compatibility, mumbai now points to Amoy
npx hardhat run scripts/deploy.js --network mumbai
```

### Configuration

Your `.env` file now has:

```bash
# Both point to the same Amoy testnet
MUMBAI_URL=https://rpc-amoy.polygon.technology/
AMOY_URL=https://rpc-amoy.polygon.technology/
```

### Resources

- **Faucet**: https://faucet.polygon.technology/
- **Explorer**: https://amoy.polygonscan.com/
- **RPC Endpoint**: https://rpc-amoy.polygon.technology/
- **Docs**: https://docs.polygon.technology/

### Alternative RPC Endpoints

If the default RPC is slow, try these alternatives:

```bash
# Public RPC endpoints for Polygon Amoy
https://rpc-amoy.polygon.technology/
https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
https://polygon-amoy.infura.io/v3/YOUR_KEY
```

### Troubleshooting

**"Network amoy doesn't exist"**
- Update hardhat.config.js (already done in this project)

**"Insufficient funds"**
- Get test MATIC from faucet: https://faucet.polygon.technology/

**"RPC unreachable"**
- Try alternative RPC endpoints above
- Check your internet connection

### For Documentation Updates

All documentation has been updated to reference Polygon Amoy instead of Mumbai:
- ✅ hardhat.config.js
- ✅ .env.example
- ✅ README files
- ✅ Deployment scripts

### Need Help?

- Official Polygon Discord: https://discord.gg/polygon
- Polygon Forum: https://forum.polygon.technology/

---

**Summary**: Mumbai is gone, Amoy is the new testnet. Everything still works the same way, just with a different chain ID and RPC endpoint!
