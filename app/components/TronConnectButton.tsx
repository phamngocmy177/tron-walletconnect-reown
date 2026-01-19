'use client';

import { useState, useCallback } from 'react';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';

const adapter = new WalletConnectAdapter({
    network: 'Mainnet',
    options: {
        relayUrl: 'wss://relay.walletconnect.com',
        projectId: 'c47dba8edb6a441868226b639c3a2a93', // Add your WalletConnect project ID here
        metadata: {
            name: 'Example App',
            description: 'Example App',
            url: 'https://yourdapp-url.com',
            icons: ['https://yourdapp-url.com/icon.png'],
        },
    },
    themeMode: 'dark',
    themeVariables: {
        '--w3m-z-index': 1000,
    },
});

export default function TronConnectButton() {
    const [address, setAddress] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = useCallback(async () => {
        setConnecting(true);
        setError(null);
        try {
            await adapter.connect();
            setAddress(adapter.address);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to connect');
            console.error('Connection error:', err);
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        try {
            await adapter.disconnect();
            setAddress(null);
        } catch (err) {
            console.error('Disconnect error:', err);
        }
    }, []);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (address) {
        return (
            <div className="flex items-center gap-3">
                <span className="px-3 py-2 bg-green-500/10 text-green-500 rounded-lg text-sm font-mono">
                    {formatAddress(address)}
                </span>
                <button
                    onClick={disconnect}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={connect}
                disabled={connecting}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
                {connecting ? 'Connecting...' : 'Connect Tron Wallet'}
            </button>
            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
        </div>
    );
}
