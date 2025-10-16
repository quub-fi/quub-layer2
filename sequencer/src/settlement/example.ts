/**
 * Example: Multi-Chain Settlement
 * Demonstrates how to use the settlement router with multiple chains
 */

import { SettlementRouter, BalancedStrategy } from "./SettlementRouter";
import { EthereumAdapter } from "./EthereumAdapter";
import { BSCAdapter } from "./BSCAdapter";
import { PolygonAdapter } from "./PolygonAdapter";
import { ChainId, ChainConfig, BatchSubmission } from "./IChainAdapter";

async function main() {
  console.log("=== Multi-Chain Settlement Example ===\n");

  // Initialize settlement router with balanced strategy
  const router = new SettlementRouter(new BalancedStrategy());

  // Configure Ethereum
  const ethConfig: ChainConfig = {
    chainId: ChainId.ETHEREUM,
    name: "Ethereum (Sepolia)",
    rpcUrl: process.env.ETH_RPC_URL || "http://localhost:8545",
    settlementContract:
      process.env.ETH_SETTLEMENT_CONTRACT ||
      "0x0000000000000000000000000000000000000000",
    bridgeContract:
      process.env.ETH_BRIDGE_CONTRACT ||
      "0x0000000000000000000000000000000000000000",
    gasLimit: 500000,
    requiredConfirmations: 2,
  };

  // Configure BSC
  const bscConfig: ChainConfig = {
    chainId: ChainId.BSC,
    name: "BSC (Testnet)",
    rpcUrl:
      process.env.BSC_RPC_URL ||
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
    settlementContract:
      process.env.BSC_SETTLEMENT_CONTRACT ||
      "0x0000000000000000000000000000000000000000",
    bridgeContract:
      process.env.BSC_BRIDGE_CONTRACT ||
      "0x0000000000000000000000000000000000000000",
    gasLimit: 500000,
    requiredConfirmations: 1,
  };

  // Configure Polygon
  const polygonConfig: ChainConfig = {
    chainId: ChainId.POLYGON,
    name: "Polygon (Mumbai)",
    rpcUrl: process.env.POLYGON_RPC_URL || "https://rpc-mumbai.maticvigil.com/",
    settlementContract:
      process.env.POLYGON_SETTLEMENT_CONTRACT ||
      "0x0000000000000000000000000000000000000000",
    bridgeContract:
      process.env.POLYGON_BRIDGE_CONTRACT ||
      "0x0000000000000000000000000000000000000000",
    gasLimit: 500000,
    requiredConfirmations: 1,
  };

  // Register adapters
  router.registerAdapter(new EthereumAdapter(ethConfig));
  router.registerAdapter(new BSCAdapter(bscConfig));
  router.registerAdapter(new PolygonAdapter(polygonConfig));

  // Connect to all chains
  await router.connect();

  // Create a test batch
  const testBatch: BatchSubmission = {
    batchIndex: 1,
    batchRoot: "0x" + "1".repeat(64),
    transactions: [
      "0x" + "a".repeat(64),
      "0x" + "b".repeat(64),
      "0x" + "c".repeat(64),
    ],
    stateRoot: "0x" + "2".repeat(64),
    timestamp: Date.now(),
  };

  console.log("\n--- Analyzing Batch ---");
  const decisions = await router.analyzeBatch(testBatch);

  console.log("\n--- Settlement Options ---");
  decisions.forEach((decision, index) => {
    console.log(`${index + 1}. ${decision.chainName}`);
    console.log(`   Score: ${decision.score.toFixed(2)}/100`);
    console.log(`   Estimated Cost: ${decision.estimatedCost.toString()}`);
    console.log(`   Estimated Time: ${decision.estimatedTime}s`);
    console.log(`   Reason: ${decision.reason}`);
    console.log();
  });

  // Uncomment to actually submit (requires valid contracts and funded account)
  /*
  console.log('--- Submitting Batch ---');
  const result = await router.submitBatch(testBatch);

  console.log('\n--- Settlement Result ---');
  console.log(`Success: ${result.success}`);
  console.log(`Transaction: ${result.txHash}`);
  console.log(`Block: ${result.blockNumber}`);
  console.log(`Gas Used: ${result.gasUsed}`);
  console.log(`Cost: ${result.cost}`);
  console.log(`Time: ${result.finalizationTime}ms`);
  */

  // Display statistics
  console.log("\n--- Router Statistics ---");
  const stats = router.getStats();
  console.log(`Total Batches: ${stats.totalBatches}`);
  console.log(`Average Cost: ${stats.averageCost}`);
  console.log(`Average Time: ${stats.averageTime.toFixed(2)}ms`);

  const usage = router.getChainUsagePercentage();
  console.log("\nChain Usage:");
  for (const [chainName, percentage] of usage) {
    console.log(`  ${chainName}: ${percentage.toFixed(2)}%`);
  }

  // Disconnect
  await router.disconnect();

  console.log("\n=== Example Complete ===");
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export { main };
