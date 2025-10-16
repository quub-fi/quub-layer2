/**
 * Settlement Router
 * Intelligently routes batch settlements to optimal chains
 */

import { ChainAdapter, ChainId, BatchSubmission, SettlementResult, ChainMetrics } from './IChainAdapter';

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

export interface SettlementStats {
  totalBatches: number;
  chainUsage: Map<ChainId, number>;
  totalCost: bigint;
  averageCost: bigint;
  averageTime: number;
}

export class SettlementRouter {
  private adapters: Map<ChainId, ChainAdapter> = new Map();
  private strategy: RoutingStrategy;
  private stats: SettlementStats;
  
  constructor(strategy: RoutingStrategy) {
    this.strategy = strategy;
    this.stats = {
      totalBatches: 0,
      chainUsage: new Map(),
      totalCost: 0n,
      averageCost: 0n,
      averageTime: 0,
    };
  }
  
  registerAdapter(adapter: ChainAdapter): void {
    this.adapters.set(adapter.chainId, adapter);
    this.stats.chainUsage.set(adapter.chainId, 0);
    console.log(`[Settlement Router] Registered ${adapter.config.name} adapter`);
  }
  
  async connect(): Promise<void> {
    console.log('[Settlement Router] Connecting to all chains...');
    const connections = Array.from(this.adapters.values()).map(adapter => 
      adapter.connect().catch(error => {
        console.error(`Failed to connect to ${adapter.config.name}:`, error);
      })
    );
    await Promise.all(connections);
    
    const connectedCount = Array.from(this.adapters.values()).filter(a => a.isConnected()).length;
    console.log(`[Settlement Router] Connected to ${connectedCount}/${this.adapters.size} chains`);
  }
  
  async disconnect(): Promise<void> {
    console.log('[Settlement Router] Disconnecting from all chains...');
    const disconnections = Array.from(this.adapters.values()).map(adapter =>
      adapter.disconnect()
    );
    await Promise.all(disconnections);
  }
  
  async analyzeBatch(batch: BatchSubmission): Promise<SettlementDecision[]> {
    console.log(`[Settlement Router] Analyzing batch ${batch.batchIndex} across all chains...`);
    
    const decisions: SettlementDecision[] = [];
    
    for (const [chainId, adapter] of this.adapters) {
      if (!adapter.isConnected()) {
        console.log(`[Settlement Router] Skipping ${adapter.config.name} (not connected)`);
        continue;
      }
      
      try {
        const [cost, metrics] = await Promise.all([
          adapter.estimateGasCost(batch),
          adapter.getMetrics(),
        ]);
        
        // Calculate score (0-100)
        const costScore = this.normalizeCostScore(cost);
        const timeScore = this.normalizeTimeScore(metrics.finalizationTime);
        const loadScore = 100 - metrics.chainLoad;
        
        // Weighted score: cost 50%, time 30%, load 20%
        const score = (costScore * 0.5) + (timeScore * 0.3) + (loadScore * 0.2);
        
        decisions.push({
          chainId,
          chainName: adapter.config.name,
          estimatedCost: cost,
          estimatedTime: metrics.finalizationTime,
          score,
          reason: this.generateReason(costScore, timeScore, loadScore),
        });
      } catch (error) {
        console.error(`[Settlement Router] Failed to analyze ${adapter.config.name}:`, error);
      }
    }
    
    // Sort by score (highest first)
    decisions.sort((a, b) => b.score - a.score);
    
    // Log analysis results
    console.log('[Settlement Router] Chain analysis results:');
    decisions.forEach((d, i) => {
      const marker = i === 0 ? '✓✓ BEST' : i === 1 ? '✓ GOOD' : '';
      console.log(`  ${d.chainName}: score ${d.score.toFixed(2)}, cost ${this.formatCost(d.estimatedCost)}, time ${d.estimatedTime}s ${marker}`);
    });
    
    return decisions;
  }
  
  async submitBatch(batch: BatchSubmission, maxRetries: number = 2): Promise<SettlementResult> {
    // Use strategy to select chain
    const selectedChainId = await this.strategy.selectChain(batch, this.adapters);
    
    return this.submitToChain(batch, selectedChainId, maxRetries);
  }
  
  async submitToChain(batch: BatchSubmission, chainId: ChainId, maxRetries: number = 2): Promise<SettlementResult> {
    const adapter = this.adapters.get(chainId);
    if (!adapter) {
      throw new Error(`No adapter found for chain ${chainId}`);
    }
    
    if (!adapter.isConnected()) {
      throw new Error(`${adapter.config.name} is not connected`);
    }
    
    console.log(`[Settlement Router] Submitting batch ${batch.batchIndex} to ${adapter.config.name}`);
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await adapter.submitBatch(batch);
        
        // Update stats
        this.updateStats(chainId, result);
        
        console.log(`[Settlement Router] ✓ Batch settled successfully!`);
        console.log(`  Chain: ${adapter.config.name}`);
        console.log(`  Tx: ${result.txHash}`);
        console.log(`  Cost: ${this.formatCost(result.cost)}`);
        console.log(`  Time: ${result.finalizationTime}ms`);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`[Settlement Router] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          console.log(`[Settlement Router] Retrying in 5 seconds...`);
          await this.sleep(5000);
        }
      }
    }
    
    throw new Error(`Failed to submit batch after ${maxRetries + 1} attempts: ${lastError?.message}`);
  }
  
  async submitBatchWithFailover(batch: BatchSubmission): Promise<SettlementResult> {
    const decisions = await this.analyzeBatch(batch);
    
    if (decisions.length === 0) {
      throw new Error('No available chains for settlement');
    }
    
    // Try each chain in order of score
    for (const decision of decisions) {
      try {
        console.log(`[Settlement Router] Attempting settlement on ${decision.chainName}...`);
        return await this.submitToChain(batch, decision.chainId, 0); // No retries, failover instead
      } catch (error) {
        console.error(`[Settlement Router] ${decision.chainName} failed, trying next chain...`);
      }
    }
    
    throw new Error('All chains failed to settle batch');
  }
  
  getStats(): SettlementStats {
    return { ...this.stats };
  }
  
  getChainUsagePercentage(): Map<string, number> {
    const percentages = new Map<string, number>();
    const total = this.stats.totalBatches;
    
    if (total === 0) return percentages;
    
    for (const [chainId, count] of this.stats.chainUsage) {
      const adapter = this.adapters.get(chainId);
      if (adapter) {
        const percentage = (count / total) * 100;
        percentages.set(adapter.config.name, percentage);
      }
    }
    
    return percentages;
  }
  
  private updateStats(chainId: ChainId, result: SettlementResult): void {
    this.stats.totalBatches++;
    
    const currentCount = this.stats.chainUsage.get(chainId) || 0;
    this.stats.chainUsage.set(chainId, currentCount + 1);
    
    this.stats.totalCost += result.cost;
    this.stats.averageCost = this.stats.totalCost / BigInt(this.stats.totalBatches);
    
    // Update average time (running average)
    this.stats.averageTime = 
      (this.stats.averageTime * (this.stats.totalBatches - 1) + result.finalizationTime) / 
      this.stats.totalBatches;
  }
  
  private normalizeCostScore(cost: bigint): number {
    // Lower cost = higher score
    // Assume max cost is 1 ETH (1e18 wei)
    const maxCost = BigInt(10) ** BigInt(18);
    const normalized = 100 - Number(cost * 100n / maxCost);
    return Math.max(0, Math.min(100, normalized));
  }
  
  private normalizeTimeScore(time: number): number {
    // Lower time = higher score
    // Assume max time is 300 seconds (5 minutes)
    const maxTime = 300;
    const normalized = 100 - (time / maxTime * 100);
    return Math.max(0, Math.min(100, normalized));
  }
  
  private generateReason(costScore: number, timeScore: number, loadScore: number): string {
    const factors = [];
    if (costScore > 70) factors.push('low cost');
    if (timeScore > 70) factors.push('fast finality');
    if (loadScore > 70) factors.push('low congestion');
    return factors.join(', ') || 'balanced';
  }
  
  private formatCost(cost: bigint): string {
    const eth = Number(cost) / 1e18;
    if (eth < 0.001) {
      return `${(eth * 1000).toFixed(3)} mETH`;
    }
    return `${eth.toFixed(6)} ETH`;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cost-optimized strategy - always choose the cheapest chain
export class CostOptimizedStrategy implements RoutingStrategy {
  name = 'cost-optimized';
  
  async selectChain(
    batch: BatchSubmission,
    adapters: Map<ChainId, ChainAdapter>
  ): Promise<ChainId> {
    let cheapestChain: ChainId | null = null;
    let lowestCost = BigInt(Number.MAX_SAFE_INTEGER);
    
    for (const [chainId, adapter] of adapters) {
      if (!adapter.isConnected()) continue;
      
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
      throw new Error('No available chains for settlement');
    }
    
    return cheapestChain;
  }
}

// Speed-optimized strategy - always choose the fastest chain
export class SpeedOptimizedStrategy implements RoutingStrategy {
  name = 'speed-optimized';
  
  async selectChain(
    batch: BatchSubmission,
    adapters: Map<ChainId, ChainAdapter>
  ): Promise<ChainId> {
    let fastestChain: ChainId | null = null;
    let shortestTime = Number.MAX_SAFE_INTEGER;
    
    for (const [chainId, adapter] of adapters) {
      if (!adapter.isConnected()) continue;
      
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
      throw new Error('No available chains for settlement');
    }
    
    return fastestChain;
  }
}

// Balanced strategy - balance cost, speed, and load
export class BalancedStrategy implements RoutingStrategy {
  name = 'balanced';
  
  async selectChain(
    batch: BatchSubmission,
    adapters: Map<ChainId, ChainAdapter>
  ): Promise<ChainId> {
    let bestChain: ChainId | null = null;
    let bestScore = -1;
    
    for (const [chainId, adapter] of adapters) {
      if (!adapter.isConnected()) continue;
      
      try {
        const [cost, metrics] = await Promise.all([
          adapter.estimateGasCost(batch),
          adapter.getMetrics(),
        ]);
        
        // Calculate balanced score
        const costScore = this.normalizeCost(cost);
        const timeScore = this.normalizeTime(metrics.finalizationTime);
        const loadScore = 100 - metrics.chainLoad;
        
        // Weighted: cost 40%, time 40%, load 20%
        const score = (costScore * 0.4) + (timeScore * 0.4) + (loadScore * 0.2);
        
        if (score > bestScore) {
          bestScore = score;
          bestChain = chainId;
        }
      } catch (error) {
        console.error(`Failed to score chain ${chainId}`);
      }
    }
    
    if (!bestChain) {
      throw new Error('No available chains for settlement');
    }
    
    return bestChain;
  }
  
  private normalizeCost(cost: bigint): number {
    const maxCost = BigInt(10) ** BigInt(18);
    const normalized = 100 - Number(cost * 100n / maxCost);
    return Math.max(0, Math.min(100, normalized));
  }
  
  private normalizeTime(time: number): number {
    const maxTime = 300;
    const normalized = 100 - (time / maxTime * 100);
    return Math.max(0, Math.min(100, normalized));
  }
}
