import unittest
from time import time
from blockchain import Blockchain
from block import Block


class TestBlockchain(unittest.TestCase):
    """Test cases for the Blockchain class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.blockchain = Blockchain(difficulty=2)
    
    def test_genesis_block_created(self):
        """Test that genesis block is automatically created."""
        self.assertEqual(len(self.blockchain.chain), 1)
        genesis = self.blockchain.chain[0]
        self.assertEqual(genesis.index, 0)
        self.assertEqual(genesis.previous_hash, "0")
    
    def test_get_latest_block(self):
        """Test getting the latest block."""
        latest = self.blockchain.get_latest_block()
        self.assertEqual(latest.index, 0)
        self.assertTrue(latest.hash.startswith('0' * self.blockchain.difficulty))
    
    def test_add_transaction(self):
        """Test adding a transaction to pending list."""
        transaction = {"from": "Alice", "to": "Bob", "amount": 50}
        self.blockchain.add_transaction(transaction)
        self.assertEqual(len(self.blockchain.pending_transactions), 1)
        self.assertEqual(self.blockchain.pending_transactions[0], transaction)
    
    def test_mine_pending_transactions(self):
        """Test mining pending transactions into a new block."""
        self.blockchain.add_transaction({"from": "Alice", "to": "Bob", "amount": 50})
        initial_length = len(self.blockchain.chain)
        
        new_block = self.blockchain.mine_pending_transactions()
        
        self.assertEqual(len(self.blockchain.chain), initial_length + 1)
        self.assertEqual(new_block.index, initial_length)
        self.assertEqual(len(self.blockchain.pending_transactions), 0)
        self.assertTrue(new_block.hash.startswith('0' * self.blockchain.difficulty))
    
    def test_mine_without_transactions_raises_error(self):
        """Test that mining without transactions raises an error."""
        with self.assertRaises(ValueError):
            self.blockchain.mine_pending_transactions()
    
    def test_is_chain_valid(self):
        """Test that a valid chain is recognized as valid."""
        self.blockchain.add_transaction({"from": "Alice", "to": "Bob", "amount": 50})
        self.blockchain.mine_pending_transactions()
        self.assertTrue(self.blockchain.is_chain_valid())
    
    def test_chain_invalid_after_tampering(self):
        """Test that tampering with a block invalidates the chain."""
        self.blockchain.add_transaction({"from": "Alice", "to": "Bob", "amount": 50})
        self.blockchain.mine_pending_transactions()
        
        # Tamper with the block data
        self.blockchain.chain[1].data = [{"from": "Hacker", "to": "Victim", "amount": 1000}]
        
        self.assertFalse(self.blockchain.is_chain_valid())
    
    def test_chain_invalid_with_broken_link(self):
        """Test that breaking the chain link invalidates it."""
        self.blockchain.add_transaction({"from": "Alice", "to": "Bob", "amount": 50})
        self.blockchain.mine_pending_transactions()
        
        # Break the link
        self.blockchain.chain[1].previous_hash = "tampered_hash"
        
        self.assertFalse(self.blockchain.is_chain_valid())
    
    def test_get_chain_length(self):
        """Test getting the chain length."""
        initial_length = self.blockchain.get_chain_length()
        self.assertEqual(initial_length, 1)
        
        self.blockchain.add_transaction({"from": "Alice", "to": "Bob", "amount": 50})
        self.blockchain.mine_pending_transactions()
        
        self.assertEqual(self.blockchain.get_chain_length(), initial_length + 1)
    
    def test_get_block(self):
        """Test getting a block by index."""
        genesis = self.blockchain.get_block(0)
        self.assertIsNotNone(genesis)
        self.assertEqual(genesis.index, 0)
        
        # Test invalid index
        self.assertIsNone(self.blockchain.get_block(100))
        self.assertIsNone(self.blockchain.get_block(-1))
    
    def test_to_dict(self):
        """Test conversion to dictionary."""
        chain_dict = self.blockchain.to_dict()
        self.assertIn('chain', chain_dict)
        self.assertIn('difficulty', chain_dict)
        self.assertIn('chain_length', chain_dict)
        self.assertEqual(chain_dict['difficulty'], self.blockchain.difficulty)
        self.assertEqual(chain_dict['chain_length'], len(self.blockchain.chain))
    
    def test_multiple_blocks_maintain_integrity(self):
        """Test that adding multiple blocks maintains chain integrity."""
        for i in range(5):
            self.blockchain.add_transaction({
                "from": f"User{i}",
                "to": f"User{i+1}",
                "amount": i * 10
            })
            self.blockchain.mine_pending_transactions()
        
        self.assertEqual(self.blockchain.get_chain_length(), 6)  # 1 genesis + 5 new
        self.assertTrue(self.blockchain.is_chain_valid())
        
        # Verify chain continuity
        for i in range(1, len(self.blockchain.chain)):
            self.assertEqual(
                self.blockchain.chain[i].previous_hash,
                self.blockchain.chain[i - 1].hash
            )


if __name__ == '__main__':
    unittest.main()
