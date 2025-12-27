/**
 * EVM Configuration for FairTicket V4 DApp
 * 
 * To build for different chains, set the VITE_CHAIN environment variable:
 * 
 * VITE_CHAIN=devnet pnpm run build    (for Polygon Amoy testnet - default)
 * VITE_CHAIN=mainnet pnpm run build   (for production when available)
 */

import metadata from '../metadata.json';

const targetChainName = import.meta.env.VITE_CHAIN || 'devnet';

// Find the chain configuration by network name
const evmConfig = metadata.chains.find(chain => chain.network === targetChainName);

if (!evmConfig) {
  throw new Error(`Chain '${targetChainName}' not found in metadata.json`);
}

// Get the FairTicketV4 contract
const contractInfo = evmConfig.contracts[0];

if (!contractInfo) {
  throw new Error(`No contract found for chain '${targetChainName}'`);
}

// Export chain configuration
export const selectedChain = evmConfig;
export const contractAddress = contractInfo.address as `0x${string}`;
export const contractABI = contractInfo.abi;
export const chainId = parseInt(evmConfig.chainId);
export const rpcUrl = evmConfig.rpc_url;
export const networkName = evmConfig.network;

// Custom chain definition for wagmi
export const fairTicketChain = {
  id: chainId,
  name: networkName === 'devnet' ? 'Polygon Amoy Testnet' : 'Polygon',
  network: networkName,
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { 
      name: 'PolygonScan', 
      url: networkName === 'devnet' ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com' 
    },
  },
  testnet: networkName === 'devnet',
} as const;
