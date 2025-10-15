# quub-layer2

A Layer 2 blockchain implementation with proof-of-work consensus mechanism.

## Features

- **Block Structure**: Robust block implementation with SHA-256 hashing
- **Proof-of-Work**: Configurable mining difficulty for consensus
- **Chain Validation**: Automatic integrity checking to detect tampering
- **Transaction Management**: Pending transaction pool and batch mining
- **Genesis Block**: Automatic creation of the initial blockchain state

## Installation

Clone the repository:

```bash
git clone https://github.com/quub-fi/quub-layer2.git
cd quub-layer2
```

No external dependencies required - uses Python standard library only.

## Usage

### Basic Example

```python
from blockchain import Blockchain

# Create a new blockchain with difficulty 2
quub_chain = Blockchain(difficulty=2)

# Add transactions
quub_chain.add_transaction({
    "from": "Alice",
    "to": "Bob",
    "amount": 50
})

# Mine pending transactions
block = quub_chain.mine_pending_transactions()

# Validate the chain
is_valid = quub_chain.is_chain_valid()
print(f"Chain valid: {is_valid}")
```

### Running the Example

```bash
python quub_chain.py
```

## API Reference

### Block Class

```python
Block(index, timestamp, data, previous_hash, nonce=0)
```

**Methods:**
- `calculate_hash()`: Calculate SHA-256 hash of the block
- `mine_block(difficulty)`: Mine the block with proof-of-work
- `to_dict()`: Convert block to dictionary
- `from_dict(block_dict)`: Create block from dictionary

### Blockchain Class

```python
Blockchain(difficulty=2)
```

**Methods:**
- `add_transaction(transaction)`: Add transaction to pending pool
- `mine_pending_transactions()`: Mine all pending transactions
- `get_latest_block()`: Get the most recent block
- `is_chain_valid()`: Validate blockchain integrity
- `get_chain_length()`: Get number of blocks
- `get_block(index)`: Get block by index
- `to_dict()`: Convert blockchain to dictionary

## Testing

Run the test suite:

```bash
# Test Block class
python -m unittest test_block.py -v

# Test Blockchain class
python -m unittest test_blockchain.py -v

# Run all tests
python -m unittest discover -v
```

## Architecture

### Block Structure

Each block contains:
- `index`: Position in the chain
- `timestamp`: Block creation time
- `data`: Transaction data
- `previous_hash`: Hash of previous block
- `nonce`: Proof-of-work nonce
- `hash`: SHA-256 hash of block contents

### Proof-of-Work

The blockchain uses proof-of-work consensus where miners must find a hash that starts with a specific number of zeros (difficulty). This ensures computational effort is required to add blocks, preventing tampering.

### Chain Validation

The blockchain validates:
1. Each block's hash matches its contents
2. Each block's previous_hash links to the actual previous block
3. Each block meets the mining difficulty requirement

## License

See LICENSE file for details.