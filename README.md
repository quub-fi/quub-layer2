# ETH Layer 2 Lone

A complete Layer 2 Ethereum blockchain network implementation featuring an Optimistic Rollup architecture.

## 🏗️ Architecture

This Layer 2 solution consists of several key components:

- **Smart Contracts** (`/contracts`): Core L1 and L2 smart contracts including rollup contracts, fraud proofs, and bridge contracts
- **Sequencer** (`/sequencer`): Transaction ordering and batch creation service
- **Verifier** (`/verifier`): Fraud proof verification and challenge resolution
- **Bridge** (`/bridge`): L1-L2 communication and asset bridging
- **Data Availability** (`/data-availability`): Transaction data storage and retrieval
- **SDK** (`/sdk`): Developer tools and client libraries
- **Documentation** (`/docs`): Comprehensive guides and API references

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

- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Developer Guide](docs/development.md)

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
