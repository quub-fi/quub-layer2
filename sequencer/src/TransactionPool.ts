import { keccak256 } from "keccak";

export interface Transaction {
  hash: string;
  to: string;
  value: bigint;
  data: string;
  gasLimit: number;
  gasPrice: bigint;
  nonce: number;
  from?: string;
  timestamp: number;
}

export interface TransactionStatus {
  hash: string;
  status: "pending" | "processing" | "processed" | "failed";
  timestamp: number;
  batchId?: string;
}

export class TransactionPool {
  private pendingTransactions: Map<string, Transaction> = new Map();
  private transactionStatuses: Map<string, TransactionStatus> = new Map();
  private nonces: Map<string, number> = new Map();

  /**
   * Add a transaction to the pool
   */
  public async addTransaction(
    tx: Omit<Transaction, "hash" | "timestamp">
  ): Promise<string> {
    const timestamp = Date.now();
    const hash = this.generateTransactionHash(tx, timestamp);

    // Validate transaction
    this.validateTransaction(tx);

    const transaction: Transaction = {
      ...tx,
      hash,
      timestamp,
    };

    this.pendingTransactions.set(hash, transaction);
    this.transactionStatuses.set(hash, {
      hash,
      status: "pending",
      timestamp,
    });

    console.log(`Transaction added to pool: ${hash}`);
    return hash;
  }

  /**
   * Get pending transactions
   */
  public getPendingTransactions(): Transaction[] {
    return Array.from(this.pendingTransactions.values()).sort((a, b) =>
      b.gasPrice.toString().localeCompare(a.gasPrice.toString())
    );
  }

  /**
   * Get transactions for batching (up to maxCount)
   */
  public getTransactionsForBatch(maxCount: number): Transaction[] {
    const pending = this.getPendingTransactions();
    return pending.slice(0, maxCount);
  }

  /**
   * Mark transactions as processing
   */
  public markTransactionsProcessing(hashes: string[]): void {
    hashes.forEach((hash) => {
      const status = this.transactionStatuses.get(hash);
      if (status) {
        status.status = "processing";
      }
    });
  }

  /**
   * Mark transactions as processed
   */
  public markTransactionsProcessed(hashes: string[]): void {
    hashes.forEach((hash) => {
      const status = this.transactionStatuses.get(hash);
      if (status) {
        status.status = "processed";
      }
      // Remove from pending pool
      this.pendingTransactions.delete(hash);
    });
  }

  /**
   * Mark transactions as failed
   */
  public markTransactionsFailed(hashes: string[]): void {
    hashes.forEach((hash) => {
      const status = this.transactionStatuses.get(hash);
      if (status) {
        status.status = "failed";
      }
      // Remove from pending pool
      this.pendingTransactions.delete(hash);
    });
  }

  /**
   * Get transaction status
   */
  public getTransactionStatus(hash: string): TransactionStatus | undefined {
    return this.transactionStatuses.get(hash);
  }

  /**
   * Get pool size
   */
  public size(): number {
    return this.pendingTransactions.size;
  }

  /**
   * Remove expired transactions
   */
  public cleanupExpiredTransactions(maxAge: number = 3600000): void {
    // 1 hour default
    const now = Date.now();
    const expiredHashes: string[] = [];

    this.pendingTransactions.forEach((tx, hash) => {
      if (now - tx.timestamp > maxAge) {
        expiredHashes.push(hash);
      }
    });

    expiredHashes.forEach((hash) => {
      this.pendingTransactions.delete(hash);
      this.transactionStatuses.delete(hash);
    });

    if (expiredHashes.length > 0) {
      console.log(`Cleaned up ${expiredHashes.length} expired transactions`);
    }
  }

  /**
   * Get nonce for address
   */
  public getNonce(address: string): number {
    return this.nonces.get(address.toLowerCase()) || 0;
  }

  /**
   * Update nonce for address
   */
  public updateNonce(address: string, nonce: number): void {
    this.nonces.set(address.toLowerCase(), nonce);
  }

  /**
   * Validate transaction
   */
  private validateTransaction(
    tx: Omit<Transaction, "hash" | "timestamp">
  ): void {
    if (!tx.to || tx.to === "0x0000000000000000000000000000000000000000") {
      throw new Error("Invalid recipient address");
    }

    if (tx.value < 0n) {
      throw new Error("Invalid value");
    }

    if (tx.gasLimit < 21000) {
      throw new Error("Gas limit too low");
    }

    if (tx.gasPrice <= 0n) {
      throw new Error("Invalid gas price");
    }

    if (tx.nonce < 0) {
      throw new Error("Invalid nonce");
    }
  }

  /**
   * Generate transaction hash
   */
  private generateTransactionHash(
    tx: Omit<Transaction, "hash" | "timestamp">,
    timestamp: number
  ): string {
    const data = `${tx.to}${tx.value.toString()}${tx.data}${
      tx.gasLimit
    }${tx.gasPrice.toString()}${tx.nonce}${timestamp}`;
    return "0x" + keccak256(Buffer.from(data)).toString("hex");
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalPending: number;
    totalProcessed: number;
    totalFailed: number;
    averageGasPrice: string;
  } {
    const pending = this.pendingTransactions.size;

    let processed = 0;
    let failed = 0;
    let totalGasPrice = 0n;
    let gasPriceCount = 0;

    this.transactionStatuses.forEach((status) => {
      if (status.status === "processed") processed++;
      if (status.status === "failed") failed++;
    });

    this.pendingTransactions.forEach((tx) => {
      totalGasPrice += tx.gasPrice;
      gasPriceCount++;
    });

    const averageGasPrice =
      gasPriceCount > 0
        ? (totalGasPrice / BigInt(gasPriceCount)).toString()
        : "0";

    return {
      totalPending: pending,
      totalProcessed: processed,
      totalFailed: failed,
      averageGasPrice,
    };
  }
}
