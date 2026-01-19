import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, polygon, optimism, bsc } from '@reown/appkit/networks';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { solana } from '@reown/appkit/networks';
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin';
import { bitcoin } from '@reown/appkit/networks';

// Get projectId from https://cloud.reown.com
export const projectId = 'c47dba8edb6a441868226b639c3a2a93';

if (!projectId) {
    throw new Error('Project ID is not defined');
}

// EVM Networks
export const evmNetworks = [mainnet, arbitrum, polygon, optimism, bsc];

// Solana Networks
export const solanaNetworks = [solana];

// Bitcoin Networks
export const bitcoinNetworks = [bitcoin];

// All networks combined
export const networks = [...evmNetworks, ...solanaNetworks, ...bitcoinNetworks];

// Wagmi Adapter for EVM
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage,
    }),
    ssr: true,
    projectId,
    networks: evmNetworks,
});

// Solana Adapter
export const solanaAdapter = new SolanaAdapter();

// Bitcoin Adapter
export const bitcoinAdapter = new BitcoinAdapter();

export const config = wagmiAdapter.wagmiConfig;
