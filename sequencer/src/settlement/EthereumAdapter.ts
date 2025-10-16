/**
 * Ethereum Chain Adapter
 * Implements ChainAdapter for Ethereum mainnet and testnets
 */

import { ethers } from "ethers";
import {
  BaseChainAdapter,
  ChainId,
  ChainConfig,
  BatchSubmission,
  SettlementResult,
} from "./IChainAdapter";

export class EthereumAdapter extends BaseChainAdapter {
  readonly chainId: ChainId = ChainId.ETHEREUM;
  config: ChainConfig;

  protected provider: ethers.JsonRpcProvider | null = null;
  protected signer: ethers.Wallet | null = null;
  protected settlementContract: ethers.Contract | null = null;
  protected bridgeContract: ethers.Contract | null = null;

  constructor(config: ChainConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      console.log(`[${this.config.name}] Already connected`);
      return;
    }

    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

      // Initialize signer
      const privateKey = process.env.SETTLEMENT_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("SETTLEMENT_PRIVATE_KEY not set in environment");
      }

      this.signer = new ethers.Wallet(privateKey, this.provider);

      // Load settlement contract
      const settlementAbi = [
        "function submitBatch(uint256 batchIndex, bytes32 batchRoot, bytes calldata batchData) external",
        "function getStateRoot() external view returns (bytes32)",
        "function getLastBatchIndex() external view returns (uint256)",
        "function verifyBatch(uint256 batchIndex) external view returns (bool)",
      ];

      this.settlementContract = new ethers.Contract(
        this.config.settlementContract,
        settlementAbi,
        this.signer
      );

      // Test connection
      await this.provider.getBlockNumber();

      this.connected = true;
      console.log(`[${this.config.name}] Connected successfully`);
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to ${this.config.name}: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.settlementContract = null;
    this.bridgeContract = null;
    this.connected = false;
    this.clearMetricsCache();
    console.log(`[${this.config.name}] Disconnected`);
  }

  async submitBatch(batch: BatchSubmission): Promise<SettlementResult> {
    if (!this.settlementContract || !this.provider) {
      throw new Error(`${this.config.name} adapter not connected`);
    }

    const startTime = Date.now();

    try {
      // Encode batch data
      const batchData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256[]", "bytes32", "uint256"],
        [
          batch.transactions.map((tx) => ethers.keccak256(tx)),
          batch.stateRoot,
          batch.timestamp,
        ]
      );

      // Submit transaction
      console.log(
        `[${this.config.name}] Submitting batch ${batch.batchIndex}...`
      );
      const tx = await this.settlementContract.submitBatch(
        batch.batchIndex,
        batch.batchRoot,
        batchData,
        { gasLimit: this.config.gasLimit }
      );

      console.log(`[${this.config.name}] Batch submitted, tx: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(this.config.requiredConfirmations);

      const finalizationTime = Date.now() - startTime;
      const cost = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice);

      console.log(
        `[${this.config.name}] Batch ${
          batch.batchIndex
        } confirmed in ${finalizationTime}ms, cost: ${ethers.formatEther(
          cost
        )} ETH`
      );

      // Clear metrics cache after submission
      this.clearMetricsCache();

      return {
        success: receipt.status === 1,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: BigInt(receipt.gasUsed),
        cost,
        finalizationTime,
      };
    } catch (error) {
      console.error(`[${this.config.name}] Batch submission failed:`, error);
      throw error;
    }
  }

  async verifyBatchSubmission(txHash: string): Promise<boolean> {
    if (!this.provider) {
      throw new Error(`${this.config.name} adapter not connected`);
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt !== null && receipt.status === 1;
    } catch (error) {
      console.error(`[${this.config.name}] Verification failed:`, error);
      return false;
    }
  }

  async getCurrentStateRoot(): Promise<string> {
    if (!this.settlementContract) {
      throw new Error(`${this.config.name} adapter not connected`);
    }

    const stateRoot = await this.settlementContract.getStateRoot();
    return stateRoot;
  }

  async getLastBatchIndex(): Promise<number> {
    if (!this.settlementContract) {
      throw new Error(`${this.config.name} adapter not connected`);
    }

    const lastBatchIndex = await this.settlementContract.getLastBatchIndex();
    return Number(lastBatchIndex);
  }

  async estimateGasCost(batch: BatchSubmission): Promise<bigint> {
    if (!this.settlementContract) {
      throw new Error(`${this.config.name} adapter not connected`);
    }

    try {
      const batchData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256[]", "bytes32", "uint256"],
        [
          batch.transactions.map((tx) => ethers.keccak256(tx)),
          batch.stateRoot,
          batch.timestamp,
        ]
      );

      const gasEstimate = await this.settlementContract.submitBatch.estimateGas(
        batch.batchIndex,
        batch.batchRoot,
        batchData
      );

      const gasPrice = await this.getCurrentGasPrice();
      return gasEstimate * gasPrice;
    } catch (error) {
      console.error(`[${this.config.name}] Gas estimation failed:`, error);
      // Return a high estimate to deprioritize this chain
      return BigInt(10) ** BigInt(18); // 1 ETH
    }
  }

  async getCurrentGasPrice(): Promise<bigint> {
    if (!this.provider) {
      throw new Error(`${this.config.name} adapter not connected`);
    }

    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  async lockTokens(
    token: string,
    amount: bigint,
    recipient: string
  ): Promise<string> {
    // TODO: Implement bridge lock functionality
    throw new Error("Bridge functionality not yet implemented");
  }

  async unlockTokens(
    token: string,
    amount: bigint,
    recipient: string,
    proof: string
  ): Promise<string> {
    // TODO: Implement bridge unlock functionality
    throw new Error("Bridge functionality not yet implemented");
  }

  async getBlockTime(): Promise<number> {
    // Ethereum average block time: 12 seconds
    return 12;
  }

  async getFinalizationTime(): Promise<number> {
    // Time for required confirmations
    return this.config.requiredConfirmations * 12;
  }

  async getChainLoad(): Promise<number> {
    if (!this.provider) {
      throw new Error(`${this.config.name} adapter not connected`);
    }

    try {
      const block = await this.provider.getBlock("latest");
      if (!block) return 50; // Default medium load

      const gasUsedPercent = Number((block.gasUsed * 100n) / block.gasLimit);
      return gasUsedPercent;
    } catch (error) {
      console.error(`[${this.config.name}] Failed to get chain load:`, error);
      return 50; // Default medium load
    }
  }
}
