# Multi-Chain Settlement: Quick Start Guide

Get your multi-chain Layer 2 running in under 30 minutes!

## 🎯 What You'll Build

A Layer 2 that can automatically settle batches on the cheapest available chain (Ethereum, BSC, or Polygon).

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- RPC endpoints for Ethereum, BSC, and Polygon (Alchemy, Infura, or similar)
- Some testnet tokens (Sepolia ETH, BSC testnet BNB, Polygon Mumbai MATIC)

## 🚀 Step-by-Step Setup

### Step 1: Clone and Install (5 minutes)

```bash
# Clone the repository
git clone <your-repo>
cd eth-layer2-lone

# Install dependencies
npm install

# Install dependencies in sequencer
cd sequencer
npm install
cd ..
```

### Step 2: Create Environment File (5 minutes)

Create a `.env` file in the root directory:

```bash
# Settlement Configuration
SETTLEMENT_PRIVATE_KEY=0x_your_private_key_here

# Ethereum (Sepolia Testnet)
ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETH_SETTLEMENT_CONTRACT=0x... # We'll deploy this
ETH_BRIDGE_CONTRACT=0x...     # We'll deploy this

# BSC (Testnet)
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_SETTLEMENT_CONTRACT=0x... # We'll deploy this
BSC_BRIDGE_CONTRACT=0x...     # We'll deploy this

# Polygon (Mumbai Testnet)
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
POLYGON_SETTLEMENT_CONTRACT=0x... # We'll deploy this
POLYGON_BRIDGE_CONTRACT=0x...     # We'll deploy this

# Routing Strategy
SETTLEMENT_STRATEGY=balanced # Options: cost-optimized, speed-optimized, balanced
```

### Step 3: Deploy Smart Contracts (10 minutes)

Deploy settlement contracts on each chain:

```bash
cd contracts

# Deploy to Ethereum Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to BSC Testnet
npx hardhat run scripts/deploy.js --network bscTestnet

# Deploy to Polygon Mumbai
npx hardhat run scripts/deploy.js --network mumbai
```

**Update your `.env`** with the deployed contract addresses!

### Step 4: Create Chain Adapters (Already Done!)

The code is already in `sequencer/src/settlement/`:
- ✅ `IChainAdapter.ts` - Interface
- ✅ `EthereumAdapter.ts` - Ethereum adapter
- ✅ `BSCAdapter.ts` - BSC adapter
- ✅ `PolygonAdapter.ts` - Polygon adapter
- ✅ `SettlementRouter.ts` - Router logic

### Step 5: Test the Setup (5 minutes)

```bash
cd sequencer

# Run tests
npm test

# Test multi-chain settlement
npm run test:multichain
```

### Step 6: Start the Sequencer (2 minutes)

```bash
# From the sequencer directory
npm run start

# You should see:
# ✓ Connected to Ethereum (Sepolia)
# ✓ Connected to BSC (Testnet)
# ✓ Connected to Polygon (Mumbai)
# ✓ Settlement router initialized
# ✓ Sequencer started
```

### Step 7: Submit a Test Batch (3 minutes)

```bash
# In another terminal, use the SDK to submit a test transaction
cd sdk
node examples/submit-transaction.js

# Watch the sequencer logs to see which chain it chooses!
```

## 🎉 Success!

Your sequencer should output something like:

```
[Settlement Router] Analyzing batch #1...
[Settlement Router] Chain options:
  - Ethereum: score 45.2, cost $50, time 15s
  - BSC: score 72.1, cost $5, time 3s ✓
  - Polygon: score 85.3, cost $2, time 2s ✓✓ SELECTED
[Settlement Router] Submitting to Polygon...
[Settlement Router] Batch settled! tx: 0xabc123...
[Settlement Router] Cost: $2 (96% cheaper than Ethereum!)
```

## 📊 Monitoring Your Multi-Chain L2

### Check Settlement History

```bash
# View which chains were used
npm run stats:settlements

# Output:
# Last 100 batches:
#   Polygon: 78 (78%)
#   BSC: 15 (15%)
#   Ethereum: 7 (7%)
# 
# Average cost: $3.50
# vs Ethereum-only: $55.00
# Savings: 93.6%
```

### View Live Chain Conditions

```bash
# Monitor all chains in real-time
npm run monitor:chains

# Output:
# Ethereum  | Gas: $85  | Load: 92% | Time: 15s
# BSC       | Gas: $5   | Load: 45% | Time: 3s  ✓
# Polygon   | Gas: $2   | Load: 30% | Time: 2s  ✓✓
```

## 🎮 Try Different Routing Strategies

### Cost-Optimized (Cheapest Always)

```bash
# In .env
SETTLEMENT_STRATEGY=cost-optimized

# Restart sequencer
npm run start

# Will almost always choose Polygon or BSC
```

### Speed-Optimized (Fastest Always)

```bash
# In .env
SETTLEMENT_STRATEGY=speed-optimized

# Restart sequencer
npm run start

# Will prefer Polygon for fastest finality
```

### Balanced (Default - Best Overall)

```bash
# In .env
SETTLEMENT_STRATEGY=balanced

# Restart sequencer
npm run start

# Will balance cost, speed, and reliability
```

## 🧪 Advanced Testing

### Test Failover

```bash
# Simulate Polygon being down
npm run test:failover

# Should automatically switch to BSC or Ethereum
```

### Test High-Value Transactions

```bash
# Force high-security settlement on Ethereum
npm run test:high-value

# Should route to Ethereum regardless of cost
```

### Load Test

```bash
# Submit 1000 transactions
npm run test:load

# Watch how the router distributes across chains
```

## 🐛 Troubleshooting

### "No available chains for settlement"

**Problem**: Can't connect to any chains

**Solution**:
```bash
# Check RPC endpoints
curl $ETH_RPC_URL
curl $BSC_RPC_URL
curl $POLYGON_RPC_URL

# Verify contract addresses in .env
# Make sure private key is funded on all chains
```

### "Batch submission failed"

**Problem**: Transaction reverted on chain

**Solution**:
```bash
# Check contract deployment
npx hardhat verify --network sepolia $ETH_SETTLEMENT_CONTRACT

# Check account has enough gas
# Check contract is not paused
```

### "Settlement costs higher than expected"

**Problem**: Not getting expected savings

**Solution**:
```bash
# Check gas prices on all chains
npm run check:gas-prices

# Verify routing strategy is set correctly
echo $SETTLEMENT_STRATEGY

# Try cost-optimized strategy
SETTLEMENT_STRATEGY=cost-optimized npm run start
```

## 📈 Next Steps

Now that your multi-chain L2 is running:

1. **Deploy to Production**: Use mainnet RPC endpoints and contracts
2. **Add More Chains**: Implement Arbitrum, Optimism, Base adapters
3. **Enable Cross-Chain Bridge**: Allow deposits/withdrawals on all chains
4. **Implement Advanced Routing**: Add ML-based routing predictions
5. **Monitor & Optimize**: Set up Grafana dashboards for all chains

## 📚 Additional Resources

- [Architecture Deep Dive](./MULTI_CHAIN_SETTLEMENT.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [API Documentation](./API.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## 💡 Tips

- **Start with Testnets**: Test thoroughly before mainnet
- **Monitor Gas Prices**: Set up alerts for unusual costs
- **Use WebSockets**: For real-time chain monitoring
- **Cache Chain Metrics**: Don't query every time
- **Set Thresholds**: Define minimum/maximum costs per chain
- **Log Everything**: Helps debugging multi-chain issues

## 🎓 Understanding the Logs

```
[Settlement Router] Analyzing batch #42...
```
Router is evaluating options

```
Ethereum: score 45.2, cost $50, time 15s
```
Ethereum scored 45.2/100 (moderate)

```
Polygon: score 85.3, cost $2, time 2s ✓✓ SELECTED
```
Polygon scored 85.3/100 (excellent) and was chosen

```
Batch settled! tx: 0xabc123...
```
Success! Transaction confirmed on-chain

```
Cost: $2 (96% cheaper than Ethereum!)
```
Actual cost and savings vs. Ethereum-only approach

## 🔍 Verify It's Working

### Check On-Chain

Visit block explorers:
- Ethereum: https://sepolia.etherscan.io/address/YOUR_CONTRACT
- BSC: https://testnet.bscscan.com/address/YOUR_CONTRACT
- Polygon: https://mumbai.polygonscan.com/address/YOUR_CONTRACT

You should see batch submissions on whichever chain the router selected!

### Check State Consistency

```bash
# Verify state roots match across all chains
npm run verify:state

# Should output:
# ✓ All chains have matching state roots
# ✓ No inconsistencies detected
```

## 🎊 Congratulations!

You now have a working multi-chain Layer 2! 🚀

Your L2 can:
- ✅ Settle on 3 different chains
- ✅ Automatically choose the cheapest option
- ✅ Save 80-95% on gas costs
- ✅ Handle chain failures gracefully
- ✅ Adapt to changing network conditions

**What's next?** Check out the [Implementation Guide](./IMPLEMENTATION_GUIDE.md) to add more features!

---

**Questions?** Open an issue on GitHub or reach out to the team!
