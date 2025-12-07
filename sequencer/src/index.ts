import { SequencerService } from "./SequencerService";
import { ethers } from "ethers";

// Generate a random wallet if no private key is provided (for development only)
const getPrivateKey = (): string => {
  if (process.env.PRIVATE_KEY) {
    return process.env.PRIVATE_KEY;
  }
  // Use a well-known test private key for development
  // WARNING: Never use this in production!
  return "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
};

const config = {
  port: parseInt(process.env.SEQUENCER_PORT || "3000"),
  rpcUrl: process.env.RPC_URL || "http://localhost:8545",
  privateKey: getPrivateKey(),
  rollupContractAddress: process.env.ROLLUP_CONTRACT_ADDRESS || "0x" + "0".repeat(40),
  batchSize: parseInt(process.env.BATCH_SIZE || "100"),
};

// Set WebSocket port to avoid conflict with verifier
if (!process.env.WS_PORT) {
  process.env.WS_PORT = "3002";
}

const sequencer = new SequencerService(config);

sequencer
  .start()
  .then(() => {
    console.log("Sequencer service started successfully");
    console.log(`HTTP API: http://localhost:${config.port}`);
    console.log(`WebSocket: ws://localhost:${process.env.WS_PORT || config.port + 1}`);
  })
  .catch((error) => {
    console.error("Failed to start sequencer:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down sequencer...");
  await sequencer.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down sequencer...");
  await sequencer.stop();
  process.exit(0);
});
