import TronConnectButton from "./components/TronConnectButton";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Tron Wallet Connect
        </h1>
        <TronConnectButton />
      </main>
    </div>
  );
}
