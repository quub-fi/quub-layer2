# 🧪 Testing Guide for Quub Layer 2

This guide will walk you through testing the Layer 2 blockchain project.

## 📋 Prerequisites

Before running tests, ensure you have:
- Node.js v24.10.0 (installed ✅)
- npm dependencies (installed ✅)

## 🚀 Quick Start

### 1. Run All Tests

```bash
cd contracts
npx hardhat test
```

### 2. Run Specific Test Files

```bash
# Test only OptimisticRollup
npx hardhat test test/OptimisticRollup.test.js

# Test only L1Bridge
npx hardhat test test/L1Bridge.test.js
```

### 3. Run Tests with Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

### 4. Run Tests with Coverage

```bash
npx hardhat coverage
```

## 📊 Test Structure

### OptimisticRollup Tests

Located in: `contracts/test/OptimisticRollup.test.js`

**Test Suites:**
1. **Initialization** - Verifies contract setup
2. **State Commitment** - Tests state root submissions
3. **Fraud Proofs** - Tests challenge mechanism
4. **State Finalization** - Tests finalization after challenge period
5. **Bond Management** - Tests bond deposits and withdrawals

**Key Test Cases:**
- ✅ Sequencer can commit state with sufficient bond
- ✅ Non-sequencer cannot commit state
- ✅ Challenge can be submitted during challenge period
- ✅ Challenge rejected after challenge period expires
- ✅ State finalizes after challenge period
- ✅ Bond management (deposit/withdraw)

### L1Bridge Tests

Located in: `contracts/test/L1Bridge.test.js`

**Test Suites:**
1. **Initialization** - Verifies bridge setup
2. **ETH Deposits** - Tests ETH deposits to L2
3. **Token Support** - Tests ERC20 token deposits
4. **Withdrawals** - Tests withdrawal mechanism
5. **Access Control** - Tests permission system

**Key Test Cases:**
- ✅ Users can deposit ETH
- ✅ Zero deposits are rejected
- ✅ Owner can add supported tokens
- ✅ Users can deposit supported ERC20 tokens
- ✅ Unsupported tokens are rejected
- ✅ Only rollup can initiate withdrawals
- ✅ Access control enforced

## 🔍 Expected Test Output

When all tests pass, you should see:

```
OptimisticRollup
  Initialization
    ✓ Should set the correct sequencer
    ✓ Should set the correct challenge period
    ✓ Should set the correct bond amount
    ✓ Should set the correct owner
  State Commitment
    ✓ Should allow sequencer to commit state
    ✓ Should reject commitment from non-sequencer
    ✓ Should reject commitment without sufficient bond
  Fraud Proofs
    ✓ Should allow challenging a state commitment
    ✓ Should reject challenge without sufficient bond
    ✓ Should reject challenge after challenge period
  State Finalization
    ✓ Should finalize state after challenge period
    ✓ Should not finalize state before challenge period
  Bond Management
    ✓ Should allow depositing bond
    ✓ Should allow withdrawing bond

L1Bridge
  Initialization
    ✓ Should set the correct rollup contract
    ✓ Should set the correct withdrawal delay
    ✓ Should set the correct owner
  ETH Deposits
    ✓ Should allow depositing ETH
    ✓ Should reject zero ETH deposits
    ✓ Should increment deposit counter
  Token Support
    ✓ Should allow owner to add supported token
    ✓ Should allow depositing supported tokens
    ✓ Should reject unsupported tokens
  Withdrawals
    ✓ Should allow rollup contract to initiate withdrawal
    ✓ Should reject withdrawal from non-rollup address
  Access Control
    ✓ Should only allow owner to add supported tokens
    ✓ Should only allow owner to update rollup contract

26 passing (2s)
```

## 🐛 Debugging Failed Tests

### Common Issues and Solutions

#### 1. Contract Compilation Errors

```bash
# Clean and recompile
npx hardhat clean
npx hardhat compile
```

#### 2. Test Timeout

If tests timeout, increase the timeout in hardhat.config.js:

```javascript
mocha: {
  timeout: 100000 // 100 seconds
}
```

#### 3. Gas Estimation Errors

If gas estimation fails:

```bash
# Run with verbose logging
npx hardhat test --verbose
```

#### 4. Network Issues

If you see "network not found" errors:

```bash
# Make sure you're in the contracts directory
cd contracts
npx hardhat test
```

## 📈 Advanced Testing

### Test with Different Network Configurations

```bash
# Test on local Hardhat network (default)
npx hardhat test

# Test with mainnet forking
npx hardhat test --network hardhat-fork
```

### Generate Test Report

```bash
# Install reporter
npm install --save-dev hardhat-gas-reporter

# Run with report
REPORT_GAS=true npx hardhat test
```

### Coverage Report

```bash
npx hardhat coverage

# View coverage report
open coverage/index.html
```

## 🏗️ Local Deployment Testing

### 1. Start Local Node

```bash
# Terminal 1
npx hardhat node
```

### 2. Deploy Contracts

```bash
# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Test Deployed Contracts

```bash
# Interact with deployed contracts
npx hardhat console --network localhost
```

Example interaction:

```javascript
const OptimisticRollup = await ethers.getContractFactory("OptimisticRollup");
const rollup = await OptimisticRollup.attach("YOUR_DEPLOYED_ADDRESS");

// Check sequencer
await rollup.sequencer();

// Deposit bond
await rollup.depositBond({ value: ethers.parseEther("1.0") });
```

## 🔐 Security Testing Checklist

- ✅ Reentrancy protection tested
- ✅ Access control enforced
- ✅ Integer overflow/underflow (Solidity 0.8+)
- ✅ SafeERC20 for token transfers
- ✅ State validation before mutations
- ✅ Event emissions verified
- ✅ Gas optimization checked

## 📝 Test Development Guidelines

### Writing New Tests

1. **Follow AAA Pattern:**
   - **Arrange**: Set up test conditions
   - **Act**: Execute the function being tested
   - **Assert**: Verify expected outcomes

2. **Use Descriptive Names:**
   ```javascript
   it("Should reject withdrawal without sufficient delay", async function () {
     // Test code
   });
   ```

3. **Test Edge Cases:**
   - Zero values
   - Maximum values
   - Boundary conditions
   - Permission checks
   - Invalid inputs

4. **Use Helper Functions:**
   ```javascript
   async function deployContracts() {
     // Deployment logic
     return { rollup, bridge };
   }
   ```

## 🎯 Next Steps

After all tests pass:

1. **Review Coverage Report**
   ```bash
   npx hardhat coverage
   ```

2. **Run Gas Analysis**
   ```bash
   REPORT_GAS=true npx hardhat test
   ```

3. **Deploy to Testnet**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **Verify Contracts**
   ```bash
   npx hardhat verify --network sepolia DEPLOYED_ADDRESS
   ```

## 🆘 Getting Help

If tests fail or you encounter issues:

1. Check the error message carefully
2. Review the contract code for the failing function
3. Check test setup in `beforeEach` hooks
4. Verify all dependencies are installed
5. Ensure you're using the correct Node.js version

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- [OpenZeppelin Test Helpers](https://docs.openzeppelin.com/test-helpers)
- [Ethers.js Documentation](https://docs.ethers.org)

---

**Happy Testing! 🎉**
