"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function WalletConnect() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    const handleConnect = () => {
        connect({ connector: injected() });
    };

    if (isConnected) {
        return (
            <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 text-sm font-mono transition-colors"
            >
                {address?.slice(0, 6)}...{address?.slice(-4)} (Disconnect)
            </button>
        );
    }

    return (
        <button
            onClick={handleConnect}
            className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg font-bold hover:bg-white transition-colors"
        >
            Connect Wallet
        </button>
    );
}
