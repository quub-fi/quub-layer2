const hre = require("hardhat");

async function main() {
    console.log("Starting deployment...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Deploy OptimisticRollup
    console.log("\n1. Deploying OptimisticRollup...");
    const OptimisticRollup = await hre.ethers.getContractFactory("OptimisticRollup");
    const rollup = await hre.upgrades.deployProxy(
        OptimisticRollup,
        [
            deployer.address, // sequencer address
            86400, // 1 day challenge period
            hre.ethers.parseEther("1") // 1 ETH bond
        ],
        { initializer: 'initialize' }
    );

    await rollup.waitForDeployment();
    const rollupAddress = await rollup.getAddress();
    console.log("OptimisticRollup deployed to:", rollupAddress);

    // Deploy L1Bridge
    console.log("\n2. Deploying L1Bridge...");
    const L1Bridge = await hre.ethers.getContractFactory("L1Bridge");
    const bridge = await L1Bridge.deploy(
        rollupAddress,
        3600 // 1 hour withdrawal delay
    );

    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log("L1Bridge deployed to:", bridgeAddress);

    // Summary
    console.log("\n=== Deployment Summary ===");
    console.log("OptimisticRollup:", rollupAddress);
    console.log("L1Bridge:", bridgeAddress);
    console.log("Deployer:", deployer.address);
    console.log("Network:", hre.network.name);

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        network: hre.network.name,
        contracts: {
            OptimisticRollup: rollupAddress,
            L1Bridge: bridgeAddress
        },
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
        `deployments-${hre.network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`\nDeployment info saved to deployments-${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
