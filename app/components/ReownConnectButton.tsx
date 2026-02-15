'use client';

import { useState } from 'react';
import { useSignTypedData, useSendTransaction } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { parseEther } from 'viem';

export default function ReownConnectButton() {
    const { address, isConnected } = useAppKitAccount();
    const [result, setResult] = useState<string | null>(null);

    const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
    const { sendTransactionAsync, isPending: isSending } = useSendTransaction();

    const handleSignMessage = async () => {
        setResult(null);
        try {
            // Use EIP-712 typed data signing (eth_signTypedData_v4)
            // More widely supported via WalletConnect than personal_sign
            const signature = await signTypedDataAsync({
                domain: {
                    name: 'Reown AppKit Test',
                    version: '1',
                },
                types: {
                    Message: [{ name: 'content', type: 'string' }],
                },
                primaryType: 'Message',
                message: {
                    content: 'Hello from Reown AppKit!',
                },
            });
            setResult(`Signature: ${signature}`);
        } catch (err) {
            setResult(`Error: ${err instanceof Error ? err.message : 'Sign failed'}`);
        }
    };

    const handleSendTransaction = async () => {
        setResult(null);
        try {
            const hash = await sendTransactionAsync({
                to: address as `0x${string}`,
                value: parseEther('0'),
            });
            setResult(`Tx Hash: ${hash}`);
        } catch (err) {
            setResult(`Error: ${err instanceof Error ? err.message : 'Send failed'}`);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <appkit-button />

            {isConnected && (
                <>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSignMessage}
                            disabled={isSigning}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {isSigning ? 'Signing...' : 'Sign Message'}
                        </button>
                        <button
                            onClick={handleSendTransaction}
                            disabled={isSending}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {isSending ? 'Sending...' : 'Send 0 ETH'}
                        </button>
                    </div>

                    {result && (
                        <p className={`text-sm max-w-md break-all text-center ${result.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                            {result}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
