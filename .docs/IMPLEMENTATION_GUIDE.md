# Multi-Chain Settlement Implementation Guide

## Step-by-Step Implementation

### Phase 1: Foundation (Start Here)

#### Step 1.1: Create Chain Adapter Interface

**File: `sequencer/src/settlement/IChainAdapter.ts`**

```typescript
export enum ChainId {
  ETHEREUM = 1,
  BSC = 56,
  POLYGON = 137,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  BASE = 8453,
}

export interface ChainConfig {
  chainId: ChainId;
  name: string;
  rpcUrl: string;
  settlementContract: string;
  bridgeContract: string;
  gasLimit: number;
  requiredConfirmations: number;
}

export interface BatchSubmission {
  batchIndex: number;
  batchRoot: string;
  transactions: string[];
  stateRoot: string;
  timestamp: number;
}

export interface SettlementResult {
  success: boolean;
  txHash: string;
  blockNumber: number;
  gasUsed: bigint;
  cost: bigint;
  finalizationTime: number;
}

export interface ChainAdapter {
  // Configuration
  readonly chainId: ChainId;
  readonly config: ChainConfig;

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Settlement operations
  submitBatch(batch: BatchSubmission): Promise<SettlementResult>;
  verifyBatchSubmission(txHash: string): Promise<boolean>;

  // State queries
  getCurrentStateRoot(): Promise<string>;
  getLastBatchIndex(): Promise<number>;

  // Cost estimation
  estimateGasCost(batch: BatchSubmission): Promise<bigint>;
  getCurrentGasPrice(): Promise<bigint>;

  // Bridge operations
  lockTokens(token: string, amount: bigint, recipient: string): Promise<string>;
  unlockTokens(
    token: string,
    amount: bigint,
    recipient: string,
    proof: string
  ): Promise<string>;

  // Chain metrics
  getBlockTime(): Promise<number>;
  getFinalizationTime(): Promise<number>;
  getChainLoad(): Promise<number>; // 0-100 percentage
}
```

#### Step 1.2: Implement Ethereum Adapter

**File: `sequencer/src/settlement/EthereumAdapter.ts`**

```typescript
import { ethers } from "ethers";
import {
  ChainAdapter,
  ChainId,
  ChainConfig,
  BatchSubmission,
  SettlementResult,
} from "./IChainAdapter";

export class EthereumAdapter implements ChainAdapter {
  readonly chainId = ChainId.ETHEREUM;
  config: ChainConfig;

  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private settlementContract: ethers.Contract | null = null;

  constructor(config: ChainConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

    const privateKey = process.env.SETTLEMENT_PRIVATE_KEY;
    if (!privateKey) throw new Error("SETTLEMENT_PRIVATE_KEY not set");

    this.signer = new ethers.Wallet(privateKey, this.provider);

    // Load settlement contract ABI
    const abi = [
      "function submitBatch(uint256 batchIndex, bytes32 batchRoot, bytes calldata batchData) external",
      "function getStateRoot() external view returns (bytes32)",
      "function getLastBatchIndex() external view returns (uint256)",
    ];

    this.settlementContract = new ethers.Contract(
      this.config.settlementContract,
      abi,
      this.signer
    );
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.settlementContract = null;
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  async submitBatch(batch: BatchSubmission): Promise<SettlementResult> {
    if (!this.settlementContract) throw new Error("Not connected");

    const startTime = Date.now();

    // Encode batch data
    const batchData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256[]", "bytes32", "uint256"],
      [batch.transactions, batch.stateRoot, batch.timestamp]
    );

    // Submit transaction
    const tx = await this.settlementContract.submitBatch(
      batch.batchIndex,
      batch.batchRoot,
      batchData,
      { gasLimit: this.config.gasLimit }
    );

    // Wait for confirmation
    const receipt = await tx.wait(this.config.requiredConfirmations);

    const finalizationTime = Date.now() - startTime;

    return {
      success: receipt.status === 1,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      cost: receipt.gasUsed * receipt.gasPrice,
      finalizationTime,
    };
  }

  async verifyBatchSubmission(txHash: string): Promise<boolean> {
    if (!this.provider) throw new Error("Not connected");

    const receipt = await this.provider.getTransactionReceipt(txHash);
    return receipt !== null && receipt.status === 1;
  }

  async getCurrentStateRoot(): Promise<string> {
    if (!this.settlementContract) throw new Error("Not connected");
    return await this.settlementContract.getStateRoot();
  }

  async getLastBatchIndex(): Promise<number> {
    if (!this.settlementContract) throw new Error("Not connected");
    return Number(await this.settlementContract.getLastBatchIndex());
  }

  async estimateGasCost(batch: BatchSubmission): Promise<bigint> {
    if (!this.settlementContract) throw new Error("Not connected");

    const batchData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256[]", "bytes32", "uint256"],
      [batch.transactions, batch.stateRoot, batch.timestamp]
    );

    const gasEstimate = await this.settlementContract.submitBatch.estimateGas(
      batch.batchIndex,
      batch.batchRoot,
      batchData
    );

    const gasPrice = await this.getCurrentGasPrice();
    return gasEstimate * gasPrice;
  }

  async getCurrentGasPrice(): Promise<bigint> {
    if (!this.provider) throw new Error("Not connected");
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  async lockTokens(
    token: string,
    amount: bigint,
    recipient: string
  ): Promise<string> {
    // Implementation for bridge lock
    throw new Error("Not implemented");
  }

  async unlockTokens(
    token: string,
    amount: bigint,
    recipient: string,
    proof: string
  ): Promise<string> {
    // Implementation for bridge unlock
    throw new Error("Not implemented");
  }

  async getBlockTime(): Promise<number> {
    // Ethereum average: 12 seconds
    return 12;
  }

  async getFinalizationTime(): Promise<number> {
    // Time for required confirmations
    return this.config.requiredConfirmations * 12;
  }

  async getChainLoad(): Promise<number> {
    if (!this.provider) throw new Error("Not connected");

    const block = await this.provider.getBlock("latest");
    if (!block) return 50; // Default

    const gasUsedPercent = Number((block.gasUsed * 100n) / block.gasLimit);
    return gasUsedPercent;
  }
}
```

#### Step 1.3: Create Settlement Router

**File: `sequencer/src/settlement/SettlementRouter.ts`**

```typescript
import {
  ChainAdapter,
  ChainId,
  BatchSubmission,
  SettlementResult,
} from "./IChainAdapter";

export interface RoutingStrategy {
  name: string;
  selectChain(
    batch: BatchSubmission,
    adapters: Map<ChainId, ChainAdapter>
  ): Promise<ChainId>;
}

export interface SettlementDecision {
  chainId: ChainId;
  chainName: string;
  estimatedCost: bigint;
  estimatedTime: number;
  score: number;
  reason: string;
}

export class SettlementRouter {
  private adapters: Map<ChainId, ChainAdapter> = new Map();
  private strategy: RoutingStrategy;

  constructor(strategy: RoutingStrategy) {
    this.strategy = strategy;
  }

  registerAdapter(adapter: ChainAdapter): void {
    this.adapters.set(adapter.chainId, adapter);
  }

  async connect(): Promise<void> {
    const connections = Array.from(this.adapters.values()).map((adapter) =>
      adapter.connect()
    );
    await Promise.all(connections);
  }

  async disconnect(): Promise<void> {
    const disconnections = Array.from(this.adapters.values()).map((adapter) =>
      adapter.disconnect()
    );
    await Promise.all(disconnections);
  }

  async analyzeBatch(batch: BatchSubmission): Promise<SettlementDecision[]> {
    const decisions: SettlementDecision[] = [];

    for (const [chainId, adapter] of this.adapters) {
      try {
        const cost = await adapter.estimateGasCost(batch);
        const time = await adapter.getFinalizationTime();
        const load = await adapter.getChainLoad();

        // Calculate score (0-100)
        const costScore = this.normalizeCostScore(cost);
        const timeScore = this.normalizeTimeScore(time);
        const loadScore = 100 - load;

        const score = costScore * 0.5 + timeScore * 0.3 + loadScore * 0.2;

        decisions.push({
          chainId,
          chainName: adapter.config.name,
          estimatedCost: cost,
          estimatedTime: time,
          score,
          reason: this.generateReason(costScore, timeScore, loadScore),
        });
      } catch (error) {
        console.error(`Failed to analyze chain ${chainId}:`, error);
      }
    }

    return decisions.sort((a, b) => b.score - a.score);
  }

  async submitBatch(batch: BatchSubmission): Promise<SettlementResult> {
    // Use strategy to select chain
    const selectedChainId = await this.strategy.selectChain(
      batch,
      this.adapters
    );

    const adapter = this.adapters.get(selectedChainId);
    if (!adapter) {
      throw new Error(`No adapter found for chain ${selectedChainId}`);
    }

    console.log(
      `Submitting batch ${batch.batchIndex} to ${adapter.config.name}`
    );

    // Submit to selected chain
    const result = await adapter.submitBatch(batch);

    console.log(`Batch submitted: ${result.txHash}, cost: ${result.cost}`);

    return result;
  }

  private normalizeCostScore(cost: bigint): number {
    // Lower cost = higher score
    // Assume max cost is 1 ETH (1e18 wei)
    const maxCost = 1000000000000000000n; // 1 ETH
    const normalized = 100 - Number((cost * 100n) / maxCost);
    return Math.max(0, Math.min(100, normalized));
  }

  private normalizeTimeScore(time: number): number {
    // Lower time = higher score
    // Assume max time is 300 seconds (5 minutes)
    const maxTime = 300;
    const normalized = 100 - (time / maxTime) * 100;
    return Math.max(0, Math.min(100, normalized));
  }

  private generateReason(
    costScore: number,
    timeScore: number,
    loadScore: number
  ): string {
    const factors = [];
    if (costScore > 70) factors.push("low cost");
    if (timeScore > 70) factors.push("fast finality");
    if (loadScore > 70) factors.push("low congestion");
    return factors.join(", ") || "balanced";
  }
}

// Cost-optimized strategy
export class CostOptimizedStrategy implements RoutingStrategy {
  name = "cost-optimized";

  async selectChain(
    batch: BatchSubmission,
    adapters: Map<ChainId, ChainAdapter>
  ): Promise<ChainId> {
    let cheapestChain: ChainId | null = null;
    let lowestCost = BigInt(Number.MAX_SAFE_INTEGER);

    for (const [chainId, adapter] of adapters) {
      try {
        const cost = await adapter.estimateGasCost(batch);
        if (cost < lowestCost) {
          lowestCost = cost;
          cheapestChain = chainId;
        }
      } catch (error) {
        console.error(`Failed to estimate cost for chain ${chainId}`);
      }
    }

    if (!cheapestChain) {
      throw new Error("No available chains for settlement");
    }

    return cheapestChain;
  }
}

// Speed-optimized strategy
export class SpeedOptimizedStrategy implements RoutingStrategy {
  name = "speed-optimized";

  async selectChain(
    batch: BatchSubmission,
    adapters: Map<ChainId, ChainAdapter>
  ): Promise<ChainId> {
    let fastestChain: ChainId | null = null;
    let shortestTime = Number.MAX_SAFE_INTEGER;

    for (const [chainId, adapter] of adapters) {
      try {
        const time = await adapter.getFinalizationTime();
        if (time < shortestTime) {
          shortestTime = time;
          fastestChain = chainId;
        }
      } catch (error) {
        console.error(`Failed to estimate time for chain ${chainId}`);
      }
    }

    if (!fastestChain) {
      throw new Error("No available chains for settlement");
    }

    return fastestChain;
  }
}

// Balanced strategy
export class BalancedStrategy implements RoutingStrategy {
  name = "balanced";

  async selectChain(
    batch: BatchSubmission,
    adapters: Map<ChainId, ChainAdapter>
  ): Promise<ChainId> {
    let bestChain: ChainId | null = null;
    let bestScore = -1;

    for (const [chainId, adapter] of adapters) {
      try {
        const cost = await adapter.estimateGasCost(batch);
        const time = await adapter.getFinalizationTime();
        const load = await adapter.getChainLoad();

        // Balanced scoring
        const costScore = this.normalizeCost(cost);
        const timeScore = this.normalizeTime(time);
        const loadScore = 100 - load;

        const score = costScore * 0.4 + timeScore * 0.4 + loadScore * 0.2;

        if (score > bestScore) {
          bestScore = score;
          bestChain = chainId;
        }
      } catch (error) {
        console.error(`Failed to score chain ${chainId}`);
      }
    }

    if (!bestChain) {
      throw new Error("No available chains for settlement");
    }

    return bestChain;
  }

  private normalizeCost(cost: bigint): number {
    const maxCost = 1000000000000000000n;
    return 100 - Number((cost * 100n) / maxCost);
  }

  private normalizeTime(time: number): number {
    const maxTime = 300;
    return 100 - (time / maxTime) * 100;
  }
}
```

### Phase 2: Add Additional Chain Adapters

#### Step 2.1: BSC Adapter

**File: `sequencer/src/settlement/BSCAdapter.ts`**

```typescript
import { EthereumAdapter } from "./EthereumAdapter";
import { ChainId } from "./IChainAdapter";

export class BSCAdapter extends EthereumAdapter {
  readonly chainId = ChainId.BSC;

  async getBlockTime(): Promise<number> {
    // BSC average: 3 seconds
    return 3;
  }

  async getFinalizationTime(): Promise<number> {
    // BSC finalization is faster
    return this.config.requiredConfirmations * 3;
  }
}
```

#### Step 2.2: Polygon Adapter

**File: `sequencer/src/settlement/PolygonAdapter.ts`**

```typescript
import { EthereumAdapter } from "./EthereumAdapter";
import { ChainId } from "./IChainAdapter";

export class PolygonAdapter extends EthereumAdapter {
  readonly chainId = ChainId.POLYGON;

  async getBlockTime(): Promise<number> {
    // Polygon average: 2 seconds
    return 2;
  }

  async getFinalizationTime(): Promise<number> {
    // Polygon finalization
    return this.config.requiredConfirmations * 2;
  }
}
```

### Phase 3: Integration with Sequencer

#### Step 3.1: Update Sequencer Service

**File: `sequencer/src/SequencerService.ts`**

Add multi-chain support:

```typescript
import {
  SettlementRouter,
  BalancedStrategy,
} from "./settlement/SettlementRouter";
import { EthereumAdapter } from "./settlement/EthereumAdapter";
import { BSCAdapter } from "./settlement/BSCAdapter";
import { PolygonAdapter } from "./settlement/PolygonAdapter";
import { ChainId, ChainConfig } from "./settlement/IChainAdapter";

export class SequencerService {
  private settlementRouter: SettlementRouter;

  constructor() {
    // Initialize router with strategy
    this.settlementRouter = new SettlementRouter(new BalancedStrategy());

    // Register chain adapters
    this.registerChainAdapters();
  }

  private registerChainAdapters(): void {
    // Ethereum
    const ethConfig: ChainConfig = {
      chainId: ChainId.ETHEREUM,
      name: "Ethereum",
      rpcUrl: process.env.ETH_RPC_URL || "http://localhost:8545",
      settlementContract: process.env.ETH_SETTLEMENT_CONTRACT || "",
      bridgeContract: process.env.ETH_BRIDGE_CONTRACT || "",
      gasLimit: 500000,
      requiredConfirmations: 2,
    };
    this.settlementRouter.registerAdapter(new EthereumAdapter(ethConfig));

    // BSC
    if (process.env.BSC_RPC_URL) {
      const bscConfig: ChainConfig = {
        chainId: ChainId.BSC,
        name: "BSC",
        rpcUrl: process.env.BSC_RPC_URL,
        settlementContract: process.env.BSC_SETTLEMENT_CONTRACT || "",
        bridgeContract: process.env.BSC_BRIDGE_CONTRACT || "",
        gasLimit: 500000,
        requiredConfirmations: 1,
      };
      this.settlementRouter.registerAdapter(new BSCAdapter(bscConfig));
    }

    // Polygon
    if (process.env.POLYGON_RPC_URL) {
      const polygonConfig: ChainConfig = {
        chainId: ChainId.POLYGON,
        name: "Polygon",
        rpcUrl: process.env.POLYGON_RPC_URL,
        settlementContract: process.env.POLYGON_SETTLEMENT_CONTRACT || "",
        bridgeContract: process.env.POLYGON_BRIDGE_CONTRACT || "",
        gasLimit: 500000,
        requiredConfirmations: 1,
      };
      this.settlementRouter.registerAdapter(new PolygonAdapter(polygonConfig));
    }
  }

  async start(): Promise<void> {
    // Connect to all chains
    await this.settlementRouter.connect();
    console.log("Connected to all settlement chains");

    // Start sequencing
    // ... existing sequencer logic
  }

  async settleBatch(batch: BatchSubmission): Promise<void> {
    // Analyze batch across all chains
    const decisions = await this.settlementRouter.analyzeBatch(batch);

    console.log("Settlement options:");
    decisions.forEach((d) => {
      console.log(
        `  ${d.chainName}: score ${d.score.toFixed(2)}, cost ${
          d.estimatedCost
        }, time ${d.estimatedTime}s`
      );
    });

    // Submit to best chain
    const result = await this.settlementRouter.submitBatch(batch);

    console.log(`Batch settled on chain, tx: ${result.txHash}`);
  }
}
```

### Phase 4: Configuration

#### Environment Variables

**File: `.env.example`**

```bash
# Ethereum
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETH_SETTLEMENT_CONTRACT=0x...
ETH_BRIDGE_CONTRACT=0x...

# BSC
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_SETTLEMENT_CONTRACT=0x...
BSC_BRIDGE_CONTRACT=0x...

# Polygon
POLYGON_RPC_URL=https://polygon-rpc.com/
POLYGON_SETTLEMENT_CONTRACT=0x...
POLYGON_BRIDGE_CONTRACT=0x...

# Settlement
SETTLEMENT_PRIVATE_KEY=0x...
SETTLEMENT_STRATEGY=balanced # cost-optimized | speed-optimized | balanced
```

## Testing Strategy

### Unit Tests

```typescript
describe("SettlementRouter", () => {
  it("should select cheapest chain with cost-optimized strategy", async () => {
    // Test implementation
  });

  it("should select fastest chain with speed-optimized strategy", async () => {
    // Test implementation
  });

  it("should balance factors with balanced strategy", async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
describe("Multi-Chain Settlement Integration", () => {
  it("should settle batch on multiple chains", async () => {
    // Test implementation
  });

  it("should fallback to another chain if primary fails", async () => {
    // Test implementation
  });
});
```

## Next Steps

1. ✅ Review architecture document
2. ⬜ Implement chain adapter interface
3. ⬜ Implement Ethereum adapter
4. ⬜ Create settlement router
5. ⬜ Add BSC adapter
6. ⬜ Add Polygon adapter
7. ⬜ Deploy settlement contracts on each chain
8. ⬜ Integrate with sequencer
9. ⬜ Test on testnets
10. ⬜ Deploy to mainnet

## Useful Commands

```bash
# Install dependencies
npm install ethers

# Run tests
npm test

# Deploy settlement contracts
npm run deploy:ethereum
npm run deploy:bsc
npm run deploy:polygon

# Start sequencer with multi-chain support
npm run start:sequencer
```
