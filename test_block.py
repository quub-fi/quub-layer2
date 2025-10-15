import unittest
from time import time
from block import Block


class TestBlock(unittest.TestCase):
    """Test cases for the Block class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_data = [{"from": "Alice", "to": "Bob", "amount": 50}]
        self.block = Block(
            index=1,
            timestamp=time(),
            data=self.test_data,
            previous_hash="previous_hash_123"
        )
    
    def test_block_creation(self):
        """Test that a block is created with correct attributes."""
        self.assertEqual(self.block.index, 1)
        self.assertEqual(self.block.data, self.test_data)
        self.assertEqual(self.block.previous_hash, "previous_hash_123")
        self.assertEqual(self.block.nonce, 0)
        self.assertIsNotNone(self.block.hash)
    
    def test_calculate_hash(self):
        """Test that hash calculation is consistent."""
        hash1 = self.block.calculate_hash()
        hash2 = self.block.calculate_hash()
        self.assertEqual(hash1, hash2)
    
    def test_hash_changes_with_data(self):
        """Test that hash changes when block data changes."""
        original_hash = self.block.hash
        self.block.data = [{"from": "Charlie", "to": "Dave", "amount": 100}]
        new_hash = self.block.calculate_hash()
        self.assertNotEqual(original_hash, new_hash)
    
    def test_mine_block(self):
        """Test that mining produces a hash with required difficulty."""
        difficulty = 2
        self.block.mine_block(difficulty)
        self.assertTrue(self.block.hash.startswith('0' * difficulty))
    
    def test_to_dict(self):
        """Test conversion to dictionary."""
        block_dict = self.block.to_dict()
        self.assertEqual(block_dict['index'], self.block.index)
        self.assertEqual(block_dict['data'], self.block.data)
        self.assertEqual(block_dict['previous_hash'], self.block.previous_hash)
        self.assertEqual(block_dict['nonce'], self.block.nonce)
        self.assertEqual(block_dict['hash'], self.block.hash)
    
    def test_from_dict(self):
        """Test creation from dictionary."""
        block_dict = self.block.to_dict()
        restored_block = Block.from_dict(block_dict)
        self.assertEqual(restored_block.index, self.block.index)
        self.assertEqual(restored_block.data, self.block.data)
        self.assertEqual(restored_block.previous_hash, self.block.previous_hash)
        self.assertEqual(restored_block.nonce, self.block.nonce)
        self.assertEqual(restored_block.hash, self.block.hash)
    
    def test_nonce_increments_during_mining(self):
        """Test that nonce increments during mining."""
        initial_nonce = self.block.nonce
        self.block.mine_block(2)
        self.assertGreater(self.block.nonce, initial_nonce)


if __name__ == '__main__':
    unittest.main()
