# PlantUML Sequence Diagrams for Quub Layer 2

This directory contains comprehensive PlantUML sequence diagrams documenting all major use cases and flows in the Quub Layer 2 system.

## Diagrams Overview

### 1. **Deposit Flow** (`01_deposit_flow.puml`)

Shows how users deposit ETH from Ethereum L1 to Layer 2.

**Key Steps:**

- User initiates deposit on L1Bridge
- Transaction confirmed on Ethereum
- Sequencer detects deposit event
- User's L2 balance is credited

**Time:** ~15 seconds (L1 confirmation time)
**Cost:** ~$5 (one-time L1 gas fee)

---

### 2. **L2 Transaction Flow** (`02_l2_transaction_flow.puml`)

Details the complete lifecycle of a transaction on Layer 2.

**Key Steps:**

- User submits transaction to sequencer API
- Transaction added to pending pool
- Batch processor groups 100 transactions
- State manager executes all transactions
- New state root computed
- Batch submitted to L1 OptimisticRollup

**Time:** Instant confirmation, 10-second batching
**Cost:** ~$0.01 per transaction

---

### 3. **Fraud Detection Flow** (`03_fraud_detection_flow.puml`)

Illustrates the challenge and fraud proof mechanism.

**Key Steps:**

- Malicious sequencer submits fraudulent state
- Honest verifier re-executes transactions
- Fraud detected (state roots don't match)
- Verifier generates and submits fraud proof
- Contract verifies proof
- Attacker's bond is slashed
- Verifier receives reward

**Economic Security:**

- Sequencer bond: 10 ETH
- Challenge bond: 1 ETH
- Reward: 11 ETH (bond + challenge bond)
- Attack cost: Loses 10 ETH + gas fees

---

### 4. **Withdrawal Flow** (`04_withdrawal_flow.puml`)

Shows how users withdraw funds from L2 back to Ethereum L1.

**Key Steps:**

- User initiates withdrawal on L2
- Withdrawal included in batch
- State committed to L1
- 7-day challenge period begins
- If no fraud proven, state finalizes
- User claims funds on L1

**Time:** ~7 days (challenge period)
**Cost:** ~$5 (L1 gas for claiming)

---

### 5. **System Architecture** (`05_system_architecture.puml`)

Complete high-level architecture showing all components and their interactions.

**Components:**

- **User Layer**: Wallets, DApps
- **Layer 2**: Sequencer, Verifier, Data Availability
- **Layer 1**: L1Bridge, OptimisticRollup contracts
- **Developer Tools**: SDK, Explorer, Dashboard

---

### 6. **Token Swap Flow** (`06_token_swap_flow.puml`)

Real-world use case: Depositing ERC20 tokens and performing a DEX swap on L2.

**Key Steps:**

- User approves L1Bridge to spend tokens
- Deposits 100 USDC to L2
- Swaps 100 USDC → 0.03 ETH on L2 DEX
- Instant execution with minimal fees

**Cost Comparison:**

- L1 direct swap: ~$50+
- L2 deposit + swap: ~$5.001
- **Savings: 90%+**

---

## How to View the Diagrams

### Option 1: Online PlantUML Editor

1. Visit https://www.plantuml.com/plantuml/uml/
2. Copy the contents of any `.puml` file
3. Paste into the editor
4. View the rendered diagram

### Option 2: VS Code Extension

1. Install the PlantUML extension in VS Code
2. Open any `.puml` file
3. Press `Alt+D` to preview
4. Or right-click → "Preview Current Diagram"

### Option 3: Command Line

```bash
# Install PlantUML
brew install plantuml  # macOS
sudo apt-get install plantuml  # Linux

# Generate PNG images
plantuml diagrams/*.puml

# Generate SVG images
plantuml -tsvg diagrams/*.puml
```

### Option 4: Docker

```bash
docker run --rm -v $(pwd):/data \
  plantuml/plantuml:latest \
  -tpng /data/diagrams/*.puml
```

---

## Diagram Conventions

### Color Coding

- **Blue** boxes: Normal flow execution
- **Red** text: Error conditions or fraud
- **Green** checkmarks: Successful completions
- **Orange** notes: Important security considerations

### Actor Types

- 👤 **User**: End user interacting with the system
- 🤖 **Sequencer**: Automated transaction processor
- 🔍 **Verifier**: Fraud detection service
- 🏦 **Contracts**: Smart contracts on Ethereum

### Activation Bars

- Shows when a component is actively processing
- Helps visualize concurrent operations
- Indicates blocking vs non-blocking calls

### Notes

- Provide context and explanations
- Highlight security considerations
- Show timing and cost information

---

## Understanding Sequence Diagrams

### Reading Top to Bottom

Time flows from top to bottom. Earlier interactions appear higher in the diagram.

### Solid Arrows (→)

Synchronous calls that wait for a response.

### Dashed Arrows (-->)

Asynchronous responses or callbacks.

### Activation Boxes

Vertical rectangles showing when a component is active.

### Alt/Else Blocks

Show conditional logic and different execution paths.

### Loop Blocks

Indicate repeated operations.

---

## Key Timing Information

| Operation        | Time        | Cost          |
| ---------------- | ----------- | ------------- |
| L1 Deposit       | ~15 seconds | ~$5           |
| L2 Transaction   | Instant     | ~$0.01        |
| Batch Submission | ~10 seconds | Shared        |
| Challenge Period | 7 days      | 0 (if honest) |
| L1 Withdrawal    | ~15 seconds | ~$5           |
| **Total L2→L1**  | **~7 days** | **~$5**       |

---

## Security Highlights

### Economic Security

All diagrams emphasize the economic incentives:

- **Sequencer Bond**: 10 ETH locked
- **Challenge Cost**: 1 ETH to challenge
- **Fraud Penalty**: Complete bond slashed
- **Verifier Reward**: 11 ETH (bond + challenge)

### Challenge Period

Every state commitment includes a 7-day challenge window, shown in all relevant diagrams.

### Multiple Verifiers

System assumes multiple independent verifiers monitoring for fraud (decentralized security).

---

## Use Case Examples

### DeFi Trading

1. Deposit tokens once (L1 cost)
2. Perform hundreds of swaps (L2 cost)
3. Withdraw profits (L1 cost)

**Savings**: 99%+ on transaction fees

### NFT Minting

1. Deposit ETH to L2
2. Mint 100 NFTs for $0.01 each
3. Transfer ownership on L2
4. Bridge valuable NFTs back to L1

### Gaming

1. Deposit tokens for in-game currency
2. Thousands of micro-transactions
3. Withdraw winnings periodically

---

## Customization

Feel free to modify these diagrams for:

- Different parameter values (bond amounts, timing)
- Additional use cases (lending, NFTs, etc.)
- Integration with your specific application
- Presentation or documentation needs

---

## Questions or Issues?

If you need clarification on any diagram or want to request additional use cases:

1. **Open an issue** on GitHub
2. **Review the code** in `contracts/` directory
3. **Check the tests** in `contracts/test/`
4. **Read the blog post** in `docs/BLOG_POST.md`

---

## Related Documentation

- [`../BLOG_POST.md`](../BLOG_POST.md) - Comprehensive blog post
- [`../../TESTING.md`](../../TESTING.md) - Testing guide
- [`../../README.md`](../../README.md) - Project overview
- [`../../TODO.md`](../../TODO.md) - Development roadmap

---

**Generated**: October 16, 2025
**Version**: 1.0.0
**License**: MIT
