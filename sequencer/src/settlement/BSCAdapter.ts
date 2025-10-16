/**
 * BSC (Binance Smart Chain) Adapter
 * Extends EthereumAdapter with BSC-specific configurations
 */

import { EthereumAdapter } from './EthereumAdapter';
import { ChainId } from './IChainAdapter';

export class BSCAdapter extends EthereumAdapter {
  readonly chainId: ChainId = ChainId.BSC;
  
  async getBlockTime(): Promise<number> {
    // BSC average block time: 3 seconds
    return 3;
  }
  
  async getFinalizationTime(): Promise<number> {
    // BSC finalization is faster due to shorter block time
    return this.config.requiredConfirmations * 3;
  }
}
