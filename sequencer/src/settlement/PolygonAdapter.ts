/**
 * Polygon Adapter
 * Extends EthereumAdapter with Polygon-specific configurations
 */

import { EthereumAdapter } from './EthereumAdapter';
import { ChainId } from './IChainAdapter';

export class PolygonAdapter extends EthereumAdapter {
  readonly chainId: ChainId = ChainId.POLYGON;
  
  async getBlockTime(): Promise<number> {
    // Polygon average block time: 2 seconds
    return 2;
  }
  
  async getFinalizationTime(): Promise<number> {
    // Polygon finalization
    return this.config.requiredConfirmations * 2;
  }
}
