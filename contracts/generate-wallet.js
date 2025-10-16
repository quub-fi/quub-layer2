#!/usr/bin/env node

/**
 * Generate a test wallet for multi-chain deployment
 * This creates a new Ethereum wallet with a private key
 * 
 * ⚠️  IMPORTANT: Only use this wallet for testing!
 */

const { ethers } = require('ethers');

console.log('🔐 Generating Test Wallet...\n');

// Generate a random wallet
const wallet = ethers.Wallet.createRandom();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Wallet Generated Successfully!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Wallet Details:\n');
console.log(`Address: ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 Next Steps:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('1. Add private key to .env:');
console.log(`   PRIVATE_KEY=${wallet.privateKey.slice(2)}\n`);

console.log('2. Fund your wallet with testnet tokens:\n');
console.log(`   📍 Your Address: ${wallet.address}\n`);
console.log('   BSC Testnet Faucet:');
console.log('   → https://testnet.bnbchain.org/faucet-smart\n');
console.log('   Polygon Amoy Faucet:');
console.log('   → https://faucet.polygon.technology/\n');

console.log('3. Verify setup:');
console.log('   ./verify-setup.sh\n');

console.log('4. Deploy contracts:');
console.log('   ./deploy-multichain.sh\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  Security Warnings:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('• This is a TEST wallet - do not use for real funds');
console.log('• Never commit .env file to git');
console.log('• Keep your private key secure');
console.log('• Only use testnet tokens\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Save to temporary file for easy copying
const fs = require('fs');
const walletInfo = `
# Generated Wallet - ${new Date().toISOString()}
# ⚠️ TEST WALLET ONLY - DO NOT USE FOR REAL FUNDS

Address: ${wallet.address}
Private Key (with 0x): ${wallet.privateKey}
Private Key (no 0x): ${wallet.privateKey.slice(2)}

# Add to .env:
PRIVATE_KEY=${wallet.privateKey.slice(2)}
`;

fs.writeFileSync('.wallet-temp.txt', walletInfo);
console.log('💾 Wallet info saved to: .wallet-temp.txt');
console.log('   (This file will be auto-deleted after you update .env)\n');
