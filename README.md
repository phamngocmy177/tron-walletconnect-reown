# Tron + Reown AppKit Multi-Chain Wallet Connect

A Next.js app demonstrating how to integrate **Tron WalletConnect** alongside **Reown AppKit** (EVM, Solana, Bitcoin) without conflicts.

## The Problem

Reown AppKit's `createAppKit()` and `@tronweb3/tronwallet-adapter-walletconnect`'s `WalletConnectAdapter` both internally create their own AppKit instances. Running both causes:

- Duplicate web component registration (`<w3m-modal>`)
- Conflicting modal state
- If sharing a single provider, wagmi crashes trying to parse Tron addresses as EVM addresses (`toLowerCase` error)

## The Solution

Instead of using `WalletConnectAdapter`, this project uses `@walletconnect/universal-provider` directly for Tron connections:

1. **Single `createAppKit()`** in `app/context/index.tsx` handles EVM, Solana, and Bitcoin via Reown AppKit
2. **Separate `UniversalProvider`** in `app/components/TronConnectButton.tsx` handles Tron with its own `SignClient` and isolated storage (`name: 'tron-wc-provider'`)
3. **Reuses AppKit's modal** for displaying the WalletConnect QR code via `appKit.open({ uri, view: 'ConnectingWalletConnectBasic' })`

This gives us:

- No duplicate AppKit instances
- Fully isolated sessions (wagmi never sees Tron addresses)
- A single QR code modal for all chains
- The harmless "WalletConnect Core is already initialized" console warning (two Core instances coexist fine)

## Architecture

```
app/
  config/index.tsx          # Wagmi, Solana, Bitcoin adapters + project config
  context/index.tsx         # createAppKit() + AppKitProvider (exports appKit instance)
  components/
    ReownConnectButton.tsx  # <appkit-button /> for EVM/Solana/Bitcoin
    TronConnectButton.tsx   # Independent UniversalProvider for Tron
  page.tsx                  # Main page with both connect buttons
  layout.tsx                # Root layout with AppKitProvider
```

### Key Flow (Tron Connection)

1. User clicks "Connect Tron Wallet"
2. `getTronProvider()` lazily initializes an independent `UniversalProvider`
3. `provider.connect()` starts WC pairing and emits `display_uri`
4. The URI is passed to `appKit.open({ uri, view: 'ConnectingWalletConnectBasic' })` to show the QR code
5. User scans with a Tron-compatible wallet
6. Session is established, Tron address is extracted

## Getting Started

### Prerequisites

- Node.js 18+
- A [Reown](https://cloud.reown.com) project ID

### Setup

```bash
npm install
```

Update the project ID in `app/config/index.tsx`:

```ts
export const projectId = 'your-project-id-here';
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Supported Chains

| Chain | Method |
|-------|--------|
| EVM (Ethereum, Arbitrum, Polygon, Optimism, BSC) | Reown AppKit + Wagmi |
| Solana | Reown AppKit + Solana Adapter |
| Bitcoin | Reown AppKit + Bitcoin Adapter |
| Tron | Independent UniversalProvider + AppKit modal |

## Dependencies

- `@reown/appkit` - Multi-chain wallet modal
- `@reown/appkit-adapter-wagmi` - EVM adapter
- `@reown/appkit-adapter-solana` - Solana adapter
- `@reown/appkit-adapter-bitcoin` - Bitcoin adapter
- `@walletconnect/universal-provider` - Direct WC provider for Tron (transitive dep, no extra install needed)
- `next` - React framework
- `wagmi` / `viem` - EVM tooling
- `@tanstack/react-query` - Async state management
