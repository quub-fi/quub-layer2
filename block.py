import hashlib
import json
from time import time
from typing import Any, Dict, List, Optional


class Block:
    """
    A block in the quub blockchain.
    
    Attributes:
        index: Position of the block in the chain
        timestamp: Time when the block was created
        data: Transactions or data stored in the block
        previous_hash: Hash of the previous block in the chain
        nonce: Number used for proof-of-work
        hash: Hash of the current block
    """
    
    def __init__(
        self,
        index: int,
        timestamp: float,
        data: List[Dict[str, Any]],
        previous_hash: str,
        nonce: int = 0
    ):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """
        Calculate the hash of the block using SHA-256.
        
        Returns:
            The hexadecimal hash string
        """
        block_string = json.dumps({
            'index': self.index,
            'timestamp': self.timestamp,
            'data': self.data,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int) -> None:
        """
        Mine the block by finding a hash that starts with the required number of zeros.
        
        Args:
            difficulty: Number of leading zeros required in the hash
        """
        target = '0' * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert block to dictionary representation.
        
        Returns:
            Dictionary containing all block attributes
        """
        return {
            'index': self.index,
            'timestamp': self.timestamp,
            'data': self.data,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce,
            'hash': self.hash
        }
    
    @staticmethod
    def from_dict(block_dict: Dict[str, Any]) -> 'Block':
        """
        Create a Block instance from a dictionary.
        
        Args:
            block_dict: Dictionary containing block attributes
            
        Returns:
            Block instance
        """
        block = Block(
            index=block_dict['index'],
            timestamp=block_dict['timestamp'],
            data=block_dict['data'],
            previous_hash=block_dict['previous_hash'],
            nonce=block_dict['nonce']
        )
        block.hash = block_dict['hash']
        return block
