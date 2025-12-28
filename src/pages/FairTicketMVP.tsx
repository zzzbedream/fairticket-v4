"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import WalletConnect from "@/components/WalletConnect";
import { BuyTicket } from "@/components/BuyTicket";
import DynamicTicketQR from "@/components/DynamicTicketQR";

export default function FairTicketMVP() {
    const { isConnected, address } = useAccount();
    const [mintedHash, setMintedHash] = useState<string | null>(null);

    const handleMintSuccess = (hash: string) => {
        setMintedHash(hash);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-green-500 selection:text-slate-900">

            {/* Header */}
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">🎟️</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                            FairTicket <span className="text-xs font-mono text-slate-500">MVP</span>
                        </span>
                    </div>
                    <WalletConnect />
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">

                {/* Connection State Handling */}
                {!isConnected ? (
                    <div className="text-center space-y-6 mt-12">
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Decentralized <span className="text-green-500">Ticketing</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-md mx-auto">
                            Please connect your wallet to access the secure ticket purchasing terminal.
                        </p>
                        <div className="flex justify-center">
                            <WalletConnect />
                        </div>
                    </div>
                ) : (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">

                        {/* Left Column: Purchase / Status */}
                        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <span className="mr-2">💳</span> Purchase Ticket
                            </h2>

                            <div className="space-y-6">
                                <div className="p-4 bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-400">Event</p>
                                    <p className="font-semibold text-lg">Golden Crypto Night</p>
                                </div>

                                <div className="p-4 bg-slate-800 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-slate-400">Price (Native)</p>
                                        <p className="font-semibold text-lg text-green-400">0.00001 ETH</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400 text-right">Protection</p>
                                        <p className="font-semibold text-xs text-green-500 bg-green-900/30 px-2 py-1 rounded border border-green-500/30">
                                            ANTI-SCALP
                                        </p>
                                    </div>
                                </div>

                                {/* BUY BUTTON COMPONENT */}
                                <BuyTicket onMintSuccess={handleMintSuccess} />

                                {mintedHash && (
                                    <p className="text-xs text-slate-500 text-center mt-4">
                                        Ticket generated securely on-chain.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Ticket / QR */}
                        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
                            {mintedHash ? (
                                <div className="w-full">
                                    <h2 className="text-xl font-bold mb-6 text-center text-green-400">
                                        Your Secure Ticket
                                    </h2>
                                    {/* DYNAMIC QR COMPONENT */}
                                    <DynamicTicketQR
                                        ticketId={mintedHash.slice(0, 10)} // Using hash fragment as ID for demo
                                        ownerAddress={address || ""}
                                    />
                                    <p className="mt-6 text-center text-sm text-slate-500">
                                        This QR code is valid for entry. <br />Do not share screenshots.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center opacity-50">
                                    <div className="text-6xl mb-4">🔒</div>
                                    <p className="text-slate-400 font-medium">Ticket Locked</p>
                                    <p className="text-xs text-slate-600 mt-2">
                                        Complete purchase to reveal<br />your dynamic QR code.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
}
