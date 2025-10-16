# Quub Layer 2

A complete Layer 2 blockchain network implementation featuring an Optimistic Rollup architecture with **multi-chain settlement support**.

## 🌟 What Makes Quub Different?

Unlike traditional Layer 2s that are locked to Ethereum, **Quub can settle on multiple blockchains** (Ethereum, BSC, Polygon, Arbitrum, etc.) based on cost, speed, and security requirements.

### Key Benefits
- ⚡ **80%+ Cost Savings**: Automatically route to the cheapest available chain
- 🔄 **High Availability**: If one chain is congested, use another
- 🎯 **Flexibility**: Choose security vs. cost tradeoffs
- 🚀 **3x More Capacity**: Distribute load across multiple chains

> **Learn more**: [Multi-Chain Architecture](./docs/MULTI_CHAIN_SUMMARY.md)

## 🏗️ Architecture

This Layer 2 solution consists of several key components:

- **Smart Contracts** (`/contracts`): Core L1 and L2 smart contracts including rollup contracts, fraud proofs, and bridge contracts
- **Sequencer** (`/sequencer`): Transaction ordering, batch creation, and **multi-chain settlement routing**
- **Verifier** (`/verifier`): Fraud proof verification and challenge resolution
- **Bridge** (`/bridge`): L1-L2 communication and asset bridging with **universal multi-chain support**
- **Data Availability** (`/data-availability`): Transaction data storage and retrieval
- **SDK** (`/sdk`): Developer tools and client libraries
- **Documentation** (`/docs`): Comprehensive guides and API references

### Multi-Chain Settlement

```
Your L2 Network
      ↓
Settlement Router (Intelligent Routing)
  ↓   ↓   ↓   ↓
ETH BSC POL ARB ... (Multiple chains)
```

**Routing based on:**
- Gas costs (choose cheapest)
- Chain congestion (avoid busy chains)
- Transaction type (DeFi → Ethereum, Gaming → Polygon)
- User preferences (user-defined chains)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd eth-layer2-lone
```

2. Install dependencies:

```bash
npm run setup
```

3. Build all packages:

```bash
npm run build
```

### Running the Network

1. Start a local Ethereum node:

```bash
cd contracts
npm run node
```

2. Deploy contracts:

```bash
npm run deploy:local
```

3. Start Layer 2 services:

```bash
npm run dev
```

## 📦 Packages

### Contracts

Smart contracts for the Layer 2 network including:

- Rollup manager contract
- Fraud proof system
- Bridge contracts for L1-L2 communication
- State commitment contracts

### Sequencer

The sequencer service that:

- Orders and batches transactions
- Creates state commitments
- Publishes batches to L1
- Manages the transaction mempool

### Verifier

The verification service that:

- Monitors L1 for state root challenges
- Generates fraud proofs when disputes arise
- Validates state transitions
- Executes challenge resolution

### Bridge

The bridge service that:

- Handles L1-L2 asset transfers
- Manages withdrawal requests
- Processes cross-layer messages
- Maintains asset custody

### Data Availability

The data availability service that:

- Stores transaction data
- Provides data for fraud proof generation
- Ensures data accessibility for verifiers
- Manages data retention policies

### SDK

Developer SDK that provides:

- Client libraries for interacting with L2
- Wallet integration utilities
- Transaction building helpers
- Network status monitoring

## 🧪 Testing

Run tests for all packages:

```bash
npm test
```

Run tests for specific packages:

```bash
npm run test:contracts
npm run test:sequencer
npm run test:sdk
```

## 🚀 Deployment

### Local Development

```bash
npm run deploy:local
```

### Testnet Deployment

```bash
npm run deploy:testnet
```

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

### Core Documentation
- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Developer Guide](docs/development.md)

### Multi-Chain Settlement 🌟 NEW
- [**Executive Summary**](docs/MULTI_CHAIN_SUMMARY.md) - Start here for overview
- [**Technical Architecture**](docs/MULTI_CHAIN_SETTLEMENT.md) - Deep dive into design
- [**Implementation Guide**](docs/IMPLEMENTATION_GUIDE.md) - Step-by-step code walkthrough
- [**Architecture Diagrams**](docs/diagrams/) - Visual representations

### Diagrams
- [System Architecture](docs/diagrams/05_system_architecture.puml)
- [Multi-Chain Comparison](docs/diagrams/07_multi_chain_comparison.puml)
- [Settlement Router Flow](docs/diagrams/08_settlement_router_flow.puml)

## 🤝 Contributing

Please read our contributing guidelines before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🛠️ Development

### Project Structure

```
eth-layer2-lone/
├── contracts/          # Smart contracts
├── sequencer/          # Sequencer service
├── verifier/           # Fraud proof verifier
├── bridge/             # L1-L2 bridge
├── data-availability/  # Data availability layer
├── sdk/                # Client SDK
├── docs/               # Documentation
├── scripts/            # Utility scripts
└── package.json        # Root package configuration
```

### Scripts

- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run clean` - Clean build artifacts
- `npm run dev` - Start development servers
- `npm run setup` - Install all dependencies

## 🔧 Configuration

Environment variables and configuration files are located in each package's directory. Copy `.env.example` to `.env` and configure as needed.

## 📊 Monitoring

The network includes built-in monitoring and metrics collection. Access the dashboard at `http://localhost:3000` when running in development mode.
