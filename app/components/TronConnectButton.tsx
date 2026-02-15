'use client';

import { useState, useCallback, useRef } from 'react';
import UniversalProvider from '@walletconnect/universal-provider';
import { appKit } from '../context';
import { projectId } from '../config';

const TRON_CHAIN_ID = 'tron:0x2b6653dc';
const TRON_METHODS = ['tron_signTransaction', 'tron_signMessage'];

// Fully independent Tron provider — separate SignClient & Core from AppKit.
// The "Core already initialized" console warning is harmless (just informational).
// What matters is: no shared sessions, so wagmi never sees Tron addresses.
let tronProviderPromise: Promise<InstanceType<typeof UniversalProvider>> | null = null;

async function getTronProvider() {
    if (tronProviderPromise) return tronProviderPromise;

    tronProviderPromise = UniversalProvider.init({
        projectId,
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
            name: 'Tron Reown Wallet Connect',
            description: 'Multi-chain wallet connection app',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://yourdapp-url.com',
            icons: ['https://yourdapp-url.com/icon.png'],
        },
        // Use a separate storage key so Tron sessions don't collide with AppKit's
        name: 'tron-wc-provider',
    }).catch((err) => {
        tronProviderPromise = null;
        throw err;
    });

    return tronProviderPromise;
}

export default function TronConnectButton() {
    const [address, setAddress] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [signing, setSigning] = useState(false);
    const [sending, setSending] = useState(false);
    const sessionTopicRef = useRef<string | null>(null);

    const connect = useCallback(async () => {
        setConnecting(true);
        setError(null);
        try {
            const provider = await getTronProvider();
            const client = provider.client;

            // Check for existing Tron sessions
            const existingSessions = client.find({
                requiredNamespaces: {
                    tron: {
                        chains: [TRON_CHAIN_ID],
                        methods: TRON_METHODS,
                        events: [],
                    },
                },
            }).filter((s: { acknowledged: boolean }) => s.acknowledged);
            let session;
            if (existingSessions.length) {
                session = existingSessions[existingSessions.length - 1];
            } else {
                // Listen for the WC URI, then open AppKit directly to QR code view
                const uriPromise = new Promise<string>((resolve) => {
                    provider.once('display_uri', (uri: string) => {
                        resolve(uri);
                    });
                });

                // Start WC pairing — this triggers the display_uri event
                const connectPromise = provider.connect({
                    optionalNamespaces: {
                        tron: {
                            chains: [TRON_CHAIN_ID],
                            methods: TRON_METHODS,
                            events: [],
                        },
                    },
                });

                // Wait for URI, then open modal directly to QR code view
                const uri = await uriPromise;
                await appKit.open({ uri, view: 'ConnectingWalletConnectBasic' });

                // Detect if user closes modal before connecting
                const modalClosePromise = new Promise<never>((_, reject) => {
                    let isOpen = true;
                    const unsubscribe = appKit.subscribeState((state: { open: boolean }) => {
                        if (isOpen && !state.open) {
                            unsubscribe();
                            reject(new Error('User closed the connection modal'));
                        }
                        isOpen = state.open;
                    });
                });

                session = await Promise.race([connectPromise, modalClosePromise]);
                await appKit.close();
            }

            if (!session) {
                throw new Error('No session returned');
            }

            sessionTopicRef.current = session.topic;

            // Extract address from session (format: "tron:0x2b6653dc:Txxxxxxx")
            const accounts = Object.values(session.namespaces)
                .flatMap((ns: { accounts: string[] }) => ns.accounts);
            const tronAccount = accounts[0];
            const addr = tronAccount?.split(':')[2];

            if (addr) {
                setAddress(addr);
            } else {
                throw new Error('No Tron address found in session');
            }
        } catch (err) {
            if (err instanceof Error && err.message.includes('closed')) {
                setError(null);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to connect');
                console.error('Connection error:', err);
            }
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        try {
            if (sessionTopicRef.current) {
                const provider = await getTronProvider();
                await provider.client.disconnect({
                    topic: sessionTopicRef.current,
                    reason: { code: 6000, message: 'User disconnected' },
                });
            }
        } catch (err) {
            console.error('Disconnect error:', err);
        } finally {
            sessionTopicRef.current = null;
            setAddress(null);
            setResult(null);
        }
    }, []);

    const handleSignMessage = useCallback(async () => {
        if (!sessionTopicRef.current || !address) return;
        setSigning(true);
        setResult(null);
        try {
            const provider = await getTronProvider();
            const signature = await provider.client.request({
                chainId: TRON_CHAIN_ID,
                topic: sessionTopicRef.current,
                request: {
                    method: 'tron_signMessage',
                    params: {
                        address,
                        message: 'Hello from Tron WalletConnect!',
                    },
                },
            });
            setResult(`Signature: ${JSON.stringify(signature)}`);
        } catch (err) {
            setResult(`Error: ${err instanceof Error ? err.message : 'Sign failed'}`);
        } finally {
            setSigning(false);
        }
    }, [address]);

    const handleSignTransaction = useCallback(async () => {
        if (!sessionTopicRef.current || !address) return;
        setSending(true);
        setResult(null);
        try {
            const provider = await getTronProvider();
            // Minimal TRX transfer (1 SUN = 0.000001 TRX) to self
            const transaction = {
                visible: true,
                txID: '',
                raw_data: {
                    contract: [
                        {
                            parameter: {
                                value: {
                                    amount: 1,
                                    owner_address: address,
                                    to_address: address,
                                },
                                type_url: 'type.googleapis.com/protocol.TransferContract',
                            },
                            type: 'TransferContract',
                        },
                    ],
                    ref_block_bytes: '',
                    ref_block_hash: '',
                    expiration: Date.now() + 60000,
                    timestamp: Date.now(),
                },
                raw_data_hex: '',
            };
            const signedTx = await provider.client.request({
                chainId: TRON_CHAIN_ID,
                topic: sessionTopicRef.current,
                request: {
                    method: 'tron_signTransaction',
                    params: {
                        address,
                        transaction: { transaction },
                    },
                },
            });
            setResult(`Signed Tx: ${JSON.stringify(signedTx).slice(0, 200)}...`);
        } catch (err) {
            setResult(`Error: ${err instanceof Error ? err.message : 'Sign tx failed'}`);
        } finally {
            setSending(false);
        }
    }, [address]);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (address) {
        return (
            <div className="flex flex-col items-center gap-3">
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

                <div className="flex gap-2">
                    <button
                        onClick={handleSignMessage}
                        disabled={signing}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {signing ? 'Signing...' : 'Sign Message'}
                    </button>
                    <button
                        onClick={handleSignTransaction}
                        disabled={sending}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {sending ? 'Signing...' : 'Sign Transaction'}
                    </button>
                </div>

                {result && (
                    <p className={`text-sm max-w-md break-all text-center ${result.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                        {result}
                    </p>
                )}
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
