import { Transaction } from "./TransactionPool";

export interface Batch {
  id: string;
  transactions: Transaction[];
  timestamp: number;
  stateRoot: string;
  previousStateRoot: string;
}

export class BatchProcessor {
  private currentBatch: Transaction[] = [];
  private batchId: number = 0;

  constructor(private maxBatchSize: number = 100) {}

  /**
   * Create a batch from pending transactions
   */
  public createBatch(transactions: Transaction[]): Transaction[] {
    const batchSize = Math.min(transactions.length, this.maxBatchSize);
    const batch = transactions.slice(0, batchSize);

    console.log(`Creating batch with ${batch.length} transactions`);
    return batch;
  }

  /**
   * Process a batch of transactions
   */
  public async processBatch(
    transactions: Transaction[],
    previousStateRoot: string
  ): Promise<{
    batch: Batch;
    stateRoot: string;
    receipts: TransactionReceipt[];
  }> {
    const batchId = this.generateBatchId();
    const timestamp = Date.now();

    console.log(
      `Processing batch ${batchId} with ${transactions.length} transactions`
    );

    // Execute transactions
    const receipts: TransactionReceipt[] = [];
    let currentStateRoot = previousStateRoot;

    for (const tx of transactions) {
      try {
        const receipt = await this.executeTransaction(tx, currentStateRoot);
        receipts.push(receipt);

        // Update state root (simplified - would involve actual state trie updates)
        currentStateRoot = this.updateStateRoot(currentStateRoot, tx, receipt);
      } catch (error) {
        console.error(`Error executing transaction ${tx.hash}:`, error);
        receipts.push({
          transactionHash: tx.hash,
          status: "failed",
          gasUsed: 0,
          logs: [],
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const batch: Batch = {
      id: batchId,
      transactions,
      timestamp,
      stateRoot: currentStateRoot,
      previousStateRoot,
    };

    return {
      batch,
      stateRoot: currentStateRoot,
      receipts,
    };
  }

  /**
   * Execute a single transaction
   */
  private async executeTransaction(
    tx: Transaction,
    stateRoot: string
  ): Promise<TransactionReceipt> {
    // Simplified transaction execution
    // In a real implementation, this would involve:
    // 1. Loading account states
    // 2. Validating the transaction
    // 3. Executing the transaction code
    // 4. Updating account states
    // 5. Generating logs and events

    const gasUsed = this.estimateGasUsed(tx);

    // Basic validation
    if (tx.gasLimit < gasUsed) {
      throw new Error("Out of gas");
    }

    return {
      transactionHash: tx.hash,
      status: "success",
      gasUsed,
      logs: this.generateLogs(tx),
      blockNumber: this.getCurrentBlockNumber(),
      transactionIndex: 0, // Would be set based on position in batch
    };
  }

  /**
   * Estimate gas used for transaction
   */
  private estimateGasUsed(tx: Transaction): number {
    // Simplified gas estimation
    let gasUsed = 21000; // Base transaction cost

    // Add cost for data
    if (tx.data && tx.data !== "0x") {
      const dataSize = (tx.data.length - 2) / 2; // Remove 0x prefix and convert hex to bytes
      gasUsed += dataSize * 16; // 16 gas per byte of data
    }

    // Add cost for value transfer
    if (tx.value > 0n) {
      gasUsed += 9000; // Additional cost for value transfer
    }

    return Math.min(gasUsed, tx.gasLimit);
  }

  /**
   * Generate logs for transaction
   */
  private generateLogs(tx: Transaction): Log[] {
    const logs: Log[] = [];

    // Generate transfer log if value > 0
    if (tx.value > 0n) {
      logs.push({
        address: tx.to,
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer event signature
          "0x" +
            (tx.from || "0000000000000000000000000000000000000000").padStart(
              64,
              "0"
            ),
          "0x" + tx.to.replace("0x", "").padStart(64, "0"),
        ],
        data: "0x" + tx.value.toString(16).padStart(64, "0"),
      });
    }

    return logs;
  }

  /**
   * Update state root after transaction execution
   */
  private updateStateRoot(
    currentStateRoot: string,
    tx: Transaction,
    receipt: TransactionReceipt
  ): string {
    // Simplified state root update
    // In a real implementation, this would involve:
    // 1. Updating the state trie
    // 2. Recalculating the merkle root

    const data = `${currentStateRoot}${tx.hash}${receipt.status}${receipt.gasUsed}`;
    return "0x" + this.hashString(data);
  }

  /**
   * Simple hash function (would use proper merkle tree in production)
   */
  private hashString(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, "0");
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${++this.batchId}_${Date.now()}`;
  }

  /**
   * Get current block number (simplified)
   */
  private getCurrentBlockNumber(): number {
    return Math.floor(Date.now() / 10000); // New block every 10 seconds
  }

  /**
   * Get current batch size
   */
  public getCurrentBatchSize(): number {
    return this.currentBatch.length;
  }

  /**
   * Clear current batch
   */
  public clearBatch(): void {
    this.currentBatch = [];
  }

  /**
   * Get batch statistics
   */
  public getStatistics(): {
    totalBatches: number;
    maxBatchSize: number;
    currentBatchSize: number;
  } {
    return {
      totalBatches: this.batchId,
      maxBatchSize: this.maxBatchSize,
      currentBatchSize: this.currentBatch.length,
    };
  }
}

export interface TransactionReceipt {
  transactionHash: string;
  status: "success" | "failed";
  gasUsed: number;
  logs: Log[];
  blockNumber?: number;
  transactionIndex?: number;
  error?: string;
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
}
