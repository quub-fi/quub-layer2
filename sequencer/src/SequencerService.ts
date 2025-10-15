import express from "express";
import { ethers } from "ethers";
import WebSocket from "ws";
import { TransactionPool } from "./TransactionPool";
import { StateManager } from "./StateManager";
import { BatchProcessor } from "./BatchProcessor";
import { RollupSubmitter } from "./RollupSubmitter";

export class SequencerService {
  private app: express.Application;
  private server: any;
  private wss: WebSocket.Server;

  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private txPool: TransactionPool;
  private stateManager: StateManager;
  private batchProcessor: BatchProcessor;
  private rollupSubmitter: RollupSubmitter;

  private isRunning: boolean = false;
  private batchInterval: number = 10000; // 10 seconds

  constructor(
    private config: {
      port: number;
      rpcUrl: string;
      privateKey: string;
      rollupContractAddress: string;
      batchSize: number;
    }
  ) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();

    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);

    this.txPool = new TransactionPool();
    this.stateManager = new StateManager();
    this.batchProcessor = new BatchProcessor(config.batchSize);
    this.rollupSubmitter = new RollupSubmitter(
      this.wallet,
      config.rollupContractAddress
    );
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        isRunning: this.isRunning,
        poolSize: this.txPool.size(),
        currentBatch: this.batchProcessor.getCurrentBatchSize(),
      });
    });

    // Submit transaction
    this.app.post("/tx", async (req, res) => {
      try {
        const { to, value, data, gasLimit, gasPrice, nonce } = req.body;

        const tx = {
          to,
          value: ethers.parseEther(value || "0"),
          data: data || "0x",
          gasLimit: gasLimit || 21000,
          gasPrice: gasPrice || ethers.parseUnits("20", "gwei"),
          nonce:
            nonce || (await this.provider.getTransactionCount(req.body.from)),
        };

        const txHash = await this.txPool.addTransaction(tx);

        res.json({
          success: true,
          txHash,
          message: "Transaction added to pool",
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Get transaction status
    this.app.get("/tx/:hash", (req, res) => {
      const { hash } = req.params;
      const status = this.txPool.getTransactionStatus(hash);

      res.json({
        hash,
        status: status || "not_found",
      });
    });

    // Get current state
    this.app.get("/state", (req, res) => {
      res.json({
        stateRoot: this.stateManager.getCurrentStateRoot(),
        blockNumber: this.stateManager.getCurrentBlockNumber(),
        pendingTransactions: this.txPool.size(),
      });
    });

    // Force batch processing (for testing)
    this.app.post("/force-batch", async (req, res) => {
      try {
        await this.processBatch();
        res.json({
          success: true,
          message: "Batch processed",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocket.Server({ port: this.config.port + 1 });

    this.wss.on("connection", (ws) => {
      console.log("New WebSocket connection established");

      // Send current state
      ws.send(
        JSON.stringify({
          type: "state_update",
          data: {
            stateRoot: this.stateManager.getCurrentStateRoot(),
            blockNumber: this.stateManager.getCurrentBlockNumber(),
          },
        })
      );

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            })
          );
        }
      });

      ws.on("close", () => {
        console.log("WebSocket connection closed");
      });
    });
  }

  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case "subscribe_state":
        // Client wants to subscribe to state updates
        ws.send(
          JSON.stringify({
            type: "subscription_confirmed",
            message: "Subscribed to state updates",
          })
        );
        break;

      case "get_mempool":
        ws.send(
          JSON.stringify({
            type: "mempool_data",
            data: {
              size: this.txPool.size(),
              transactions: this.txPool.getPendingTransactions(),
            },
          })
        );
        break;

      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          })
        );
    }
  }

  private async processBatch(): Promise<void> {
    console.log("Processing batch...");

    const pendingTxs = this.txPool.getPendingTransactions();
    if (pendingTxs.length === 0) {
      console.log("No pending transactions");
      return;
    }

    try {
      // Create batch
      const batch = this.batchProcessor.createBatch(pendingTxs);

      // Execute transactions and update state
      const newStateRoot = await this.stateManager.processBatch(batch);

      // Submit to L1
      const txHash = await this.rollupSubmitter.submitStateCommitment(
        newStateRoot
      );

      // Mark transactions as processed
      this.txPool.markTransactionsProcessed(batch.map((tx) => tx.hash));

      // Broadcast state update
      this.broadcastStateUpdate(newStateRoot);

      console.log(`Batch processed successfully. L1 tx: ${txHash}`);
    } catch (error) {
      console.error("Error processing batch:", error);
    }
  }

  private broadcastStateUpdate(stateRoot: string): void {
    const message = JSON.stringify({
      type: "state_update",
      data: {
        stateRoot,
        blockNumber: this.stateManager.getCurrentBlockNumber(),
        timestamp: new Date().toISOString(),
      },
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private startBatchProcessing(): void {
    setInterval(async () => {
      if (this.isRunning) {
        await this.processBatch();
      }
    }, this.batchInterval);
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`Sequencer service started on port ${this.config.port}`);
        this.setupWebSocket();
        this.startBatchProcessing();
        this.isRunning = true;
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;

    if (this.wss) {
      this.wss.close();
    }

    if (this.server) {
      this.server.close();
    }

    console.log("Sequencer service stopped");
  }
}
