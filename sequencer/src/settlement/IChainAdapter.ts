/**
 * Chain Adapter Interface
 * Provides a standardized way to interact with different blockchains
 */

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

export interface ChainMetrics {
  gasPrice: bigint;
  blockTime: number;
  finalizationTime: number;
  chainLoad: number; // 0-100 percentage
  lastUpdated: number;
}

/**
 * Chain Adapter Interface
 * All chain-specific implementations must implement this interface
 */
export interface ChainAdapter {
  // Configuration
  readonly chainId: ChainId;
  readonly config: ChainConfig;
  
  // Connection management
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
  unlockTokens(token: string, amount: bigint, recipient: string, proof: string): Promise<string>;
  
  // Chain metrics
  getBlockTime(): Promise<number>;
  getFinalizationTime(): Promise<number>;
  getChainLoad(): Promise<number>;
  getMetrics(): Promise<ChainMetrics>;
}

/**
 * Base adapter class with common functionality
 */
export abstract class BaseChainAdapter implements ChainAdapter {
  abstract readonly chainId: ChainId;
  abstract config: ChainConfig;
  
  protected connected: boolean = false;
  protected metricsCache: ChainMetrics | null = null;
  protected metricsCacheDuration: number = 30000; // 30 seconds
  
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract submitBatch(batch: BatchSubmission): Promise<SettlementResult>;
  abstract verifyBatchSubmission(txHash: string): Promise<boolean>;
  abstract getCurrentStateRoot(): Promise<string>;
  abstract getLastBatchIndex(): Promise<number>;
  abstract estimateGasCost(batch: BatchSubmission): Promise<bigint>;
  abstract getCurrentGasPrice(): Promise<bigint>;
  abstract lockTokens(token: string, amount: bigint, recipient: string): Promise<string>;
  abstract unlockTokens(token: string, amount: bigint, recipient: string, proof: string): Promise<string>;
  abstract getBlockTime(): Promise<number>;
  abstract getFinalizationTime(): Promise<number>;
  abstract getChainLoad(): Promise<number>;
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async getMetrics(): Promise<ChainMetrics> {
    // Return cached metrics if still fresh
    if (this.metricsCache && Date.now() - this.metricsCache.lastUpdated < this.metricsCacheDuration) {
      return this.metricsCache;
    }
    
    // Fetch fresh metrics
    const [gasPrice, blockTime, finalizationTime, chainLoad] = await Promise.all([
      this.getCurrentGasPrice(),
      this.getBlockTime(),
      this.getFinalizationTime(),
      this.getChainLoad(),
    ]);
    
    this.metricsCache = {
      gasPrice,
      blockTime,
      finalizationTime,
      chainLoad,
      lastUpdated: Date.now(),
    };
    
    return this.metricsCache;
  }
  
  protected clearMetricsCache(): void {
    this.metricsCache = null;
  }
}
