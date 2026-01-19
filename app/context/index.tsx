'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider, type State } from 'wagmi';
import {
    projectId,
    wagmiAdapter,
    solanaAdapter,
    bitcoinAdapter,
    networks,
} from '../config';
import { AppKitNetwork } from '@reown/appkit/networks';

// Setup queryClient
const queryClient = new QueryClient();

// App metadata
const metadata = {
    name: 'Tron Reown Wallet Connect',
    description: 'Multi-chain wallet connection app',
    url: 'https://yourdapp-url.com',
    icons: ['https://yourdapp-url.com/icon.png'],
};

// Create modal
createAppKit({
    adapters: [wagmiAdapter, solanaAdapter, bitcoinAdapter],
    projectId,
    networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]],
    metadata,
    features: {
        analytics: true,
    },
    themeMode: 'dark',
});

interface AppKitProviderProps {
    children: ReactNode;
    initialState?: State;
}

export function AppKitProvider({ children, initialState }: AppKitProviderProps) {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
