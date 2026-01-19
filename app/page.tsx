import TronConnectButton from "./components/TronConnectButton";
import ReownConnectButton from "./components/ReownConnectButton";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-12">
        <h1 className="text-3xl font-semibold text-black dark:text-white">
          Multi-Chain Wallet Connect
        </h1>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
            EVM / Solana / Bitcoin
          </h2>
          <ReownConnectButton />
        </div>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
            Tron Network
          </h2>
          <TronConnectButton />
        </div>
      </main>
    </div>
  );
}
