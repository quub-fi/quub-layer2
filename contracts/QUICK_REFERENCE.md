# Multi-Chain Contracts - Quick Reference

## 🚀 Quick Commands

```bash
# Verify your setup
./verify-setup.sh

# Deploy to all testnets (BSC + Polygon)
./deploy-multichain.sh

# Deploy to specific network
npx hardhat run scripts/deploy.js --network bscTestnet
npx hardhat run scripts/deploy.js --network mumbai

# Run tests
npm test

# Compile contracts
npx hardhat compile

# Clean artifacts
npx hardhat clean
```

## 📋 Pre-Deployment Checklist

- [ ] `.env` file configured with your private key
- [ ] Testnet tokens in your wallet (use faucets)
- [ ] RPC URLs configured (public or Alchemy/Infura)
- [ ] `npm install` completed
- [ ] `./verify-setup.sh` shows all green ✓

## 🌐 Networks Configured

| Network          | Chain ID | Explorer                                          | Faucet                                                     |
| ---------------- | -------- | ------------------------------------------------- | ---------------------------------------------------------- |
| BSC Testnet      | 97       | [bscscan.com](https://testnet.bscscan.com)        | [faucet](https://testnet.bnbchain.org/faucet-smart)        |
| Polygon Mumbai   | 80001    | [polygonscan.com](https://mumbai.polygonscan.com) | [faucet](https://mumbaifaucet.com)                         |
| Ethereum Sepolia | 11155111 | [etherscan.io](https://sepolia.etherscan.io)      | [faucet](https://www.alchemy.com/faucets/ethereum-sepolia) |

## 💰 Testnet Tokens Needed

- **BSC Testnet**: 0.5+ tBNB
- **Polygon Mumbai**: 1+ MATIC
- **Ethereum Sepolia**: 0.5+ SepoliaETH

## 📄 Contract Files

- `OptimisticRollup.sol` - Main rollup contract
- `L1Bridge.sol` - Bridge for deposits/withdrawals
- `MockERC20.sol` - Test token

## 🔧 Configuration Files

- `.env` - Your private configuration (DO NOT COMMIT)
- `.env.example` - Template for `.env`
- `hardhat.config.js` - Network & compiler settings
- `deployed-addresses.json` - Auto-generated after deployment

## 📊 After Deployment

Your contract addresses will be saved in `deployed-addresses.json`:

```json
{
  "bscTestnet": {
    "OptimisticRollup": "0x...",
    "L1Bridge": "0x...",
    "deployed": "2025-10-16T07:52:00.000Z"
  },
  "mumbai": {
    "OptimisticRollup": "0x...",
    "L1Bridge": "0x...",
    "deployed": "2025-10-16T07:52:00.000Z"
  }
}
```

## 🔗 Update Sequencer Config

After deployment, update `/sequencer/.env`:

```bash
# Copy addresses from deployed-addresses.json

BSC_SETTLEMENT_CONTRACT=0x_your_bsc_rollup_address
BSC_BRIDGE_CONTRACT=0x_your_bsc_bridge_address

POLYGON_SETTLEMENT_CONTRACT=0x_your_polygon_rollup_address
POLYGON_BRIDGE_CONTRACT=0x_your_polygon_bridge_address
```

## 🧪 Test Multi-Chain Settlement

```bash
cd ../sequencer
npm run example:multichain
```

## 🆘 Common Issues

| Issue                        | Solution                                  |
| ---------------------------- | ----------------------------------------- |
| "Network doesn't exist"      | Check `hardhat.config.js` has the network |
| "Insufficient funds"         | Get testnet tokens from faucets           |
| "RPC unreachable"            | Try alternative RPC URL in `.env`         |
| "Private key not configured" | Edit `.env` with your key                 |

## 📚 Full Documentation

- **Setup Guide**: `SETUP_GUIDE.md` (detailed setup instructions)
- **Multi-Chain Docs**: `/docs/QUICK_START_MULTICHAIN.md`
- **Architecture**: `/docs/MULTI_CHAIN_SETTLEMENT.md`

## 🎯 Deployment Flow

```
1. Configure .env ────> 2. Get testnet tokens
         │                        │
         ▼                        ▼
3. Run verify-setup.sh ──> 4. Deploy contracts
         │                        │
         ▼                        ▼
5. Get addresses ────────> 6. Update sequencer config
         │                        │
         ▼                        ▼
7. Test settlement ──────> 8. Celebrate! 🎉
```

---

**Pro Tip**: Run `./verify-setup.sh` before every deployment to catch issues early!
