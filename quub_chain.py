"""
Quub Chain - A Layer 2 Blockchain Implementation

This module provides a simple blockchain implementation with proof-of-work
consensus mechanism for the quub Layer 2 solution.
"""

from blockchain import Blockchain
from block import Block

__version__ = "0.1.0"
__all__ = ['Blockchain', 'Block']


def main():
    """Example usage of the quub blockchain."""
    print("Initializing Quub Chain...")
    quub_chain = Blockchain(difficulty=2)
    
    print(f"\nGenesis block created!")
    print(f"Genesis block hash: {quub_chain.get_latest_block().hash}")
    
    # Add some transactions
    print("\n--- Adding transactions ---")
    quub_chain.add_transaction({
        "from": "Alice",
        "to": "Bob",
        "amount": 50
    })
    quub_chain.add_transaction({
        "from": "Bob",
        "to": "Charlie",
        "amount": 25
    })
    
    print("Mining block 1...")
    block1 = quub_chain.mine_pending_transactions()
    print(f"Block 1 mined! Hash: {block1.hash}")
    
    # Add more transactions
    quub_chain.add_transaction({
        "from": "Charlie",
        "to": "Alice",
        "amount": 10
    })
    
    print("\nMining block 2...")
    block2 = quub_chain.mine_pending_transactions()
    print(f"Block 2 mined! Hash: {block2.hash}")
    
    # Validate the chain
    print(f"\n--- Chain Validation ---")
    print(f"Is chain valid? {quub_chain.is_chain_valid()}")
    print(f"Chain length: {quub_chain.get_chain_length()}")
    
    # Display the entire chain
    print("\n--- Complete Blockchain ---")
    for block in quub_chain.chain:
        print(f"\nBlock #{block.index}")
        print(f"  Timestamp: {block.timestamp}")
        print(f"  Data: {block.data}")
        print(f"  Hash: {block.hash}")
        print(f"  Previous Hash: {block.previous_hash}")
        print(f"  Nonce: {block.nonce}")


if __name__ == "__main__":
    main()
