from time import time
from typing import Any, Dict, List, Optional
from block import Block


class Blockchain:
    """
    The quub blockchain implementation.
    
    Attributes:
        chain: List of blocks in the blockchain
        difficulty: Mining difficulty (number of leading zeros in hash)
        pending_transactions: Transactions waiting to be mined
    """
    
    def __init__(self, difficulty: int = 2):
        self.chain: List[Block] = []
        self.difficulty = difficulty
        self.pending_transactions: List[Dict[str, Any]] = []
        self._create_genesis_block()
    
    def _create_genesis_block(self) -> None:
        """Create the first block in the chain (genesis block)."""
        genesis_block = Block(
            index=0,
            timestamp=time(),
            data=[{"message": "Genesis Block"}],
            previous_hash="0"
        )
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
    
    def get_latest_block(self) -> Block:
        """
        Get the most recent block in the chain.
        
        Returns:
            The latest block
        """
        return self.chain[-1]
    
    def add_transaction(self, transaction: Dict[str, Any]) -> None:
        """
        Add a transaction to the pending transactions list.
        
        Args:
            transaction: Transaction data to add
        """
        self.pending_transactions.append(transaction)
    
    def mine_pending_transactions(self) -> Block:
        """
        Mine all pending transactions into a new block.
        
        Returns:
            The newly mined block
        """
        if not self.pending_transactions:
            raise ValueError("No transactions to mine")
        
        latest_block = self.get_latest_block()
        new_block = Block(
            index=len(self.chain),
            timestamp=time(),
            data=self.pending_transactions.copy(),
            previous_hash=latest_block.hash
        )
        
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        self.pending_transactions = []
        
        return new_block
    
    def is_chain_valid(self) -> bool:
        """
        Validate the integrity of the blockchain.
        
        Returns:
            True if the chain is valid, False otherwise
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check if the current block's hash is correct
            if current_block.hash != current_block.calculate_hash():
                return False
            
            # Check if the previous hash matches
            if current_block.previous_hash != previous_block.hash:
                return False
            
            # Check if the block meets the mining difficulty
            if not current_block.hash.startswith('0' * self.difficulty):
                return False
        
        return True
    
    def get_chain_length(self) -> int:
        """
        Get the number of blocks in the chain.
        
        Returns:
            Chain length
        """
        return len(self.chain)
    
    def get_block(self, index: int) -> Optional[Block]:
        """
        Get a block by its index.
        
        Args:
            index: Block index
            
        Returns:
            Block at the given index, or None if not found
        """
        if 0 <= index < len(self.chain):
            return self.chain[index]
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the blockchain to dictionary representation.
        
        Returns:
            Dictionary containing the chain data
        """
        return {
            'chain': [block.to_dict() for block in self.chain],
            'difficulty': self.difficulty,
            'chain_length': len(self.chain)
        }
