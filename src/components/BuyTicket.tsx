"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useEffect, useState } from "react";

// CONTRATO REAL EN CODENUT DEVNET (Nuevo deployment)
const CONTRACT_ADDRESS = "0xF3FE049713Ef283Aea459BEF2b501A0599c45418";

// ABI del contrato FairTicketV4 (usando mintTicket)
const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "mintTicket",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ticketPrice",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalTicketsMinted",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const BuyTicket = ({ onMintSuccess }: { onMintSuccess?: (hash: string) => void }) => {
    const { address, isConnected } = useAccount();
    const [isPurchasing, setIsPurchasing] = useState(false);

    // Leer el precio del contrato dinámicamente
    const { data: ticketPriceData, isLoading: isPriceLoading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "ticketPrice",
    });

    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isConfirmed && hash) {
            if (onMintSuccess) {
                onMintSuccess(hash);
            }
            alert(`¡Ticket Comprado! Hash: ${hash}`);
            setTimeout(() => window.location.reload(), 2000);
        }
    }, [isConfirmed, hash, onMintSuccess]);

    const handleBuy = async () => {
        if (!isConnected || !address) {
            alert("Conecta tu wallet primero");
            return;
        }

        if (!ticketPriceData) {
            alert("Error: No se pudo obtener el precio del ticket");
            return;
        }

        setIsPurchasing(true);

        try {
            // Llamar mintTicket con el precio exacto del contrato
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: "mintTicket",
                value: BigInt(ticketPriceData), // Usar el precio leído del contrato
            });
        } catch (error) {
            console.error("Error:", error);
            alert("Error al comprar. Revisa la consola (F12).");
            setIsPurchasing(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-gray-900 rounded-xl border border-gray-800">
            <div className="text-center">
                <h3 className="text-xl font-bold text-white">Entrada General NFT</h3>
                <p className="text-gray-400 text-sm mt-1">
                    Contrato: <span className="text-cyan-400 font-mono text-xs">
                        {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
                    </span>
                </p>
                {isPriceLoading ? (
                    <p className="text-yellow-400 text-sm mt-2">Cargando precio...</p>
                ) : ticketPriceData ? (
                    <p className="text-green-400 text-lg font-bold mt-2">
                        Precio: {formatEther(ticketPriceData)} ETH
                    </p>
                ) : (
                    <p className="text-red-400 text-sm mt-2">Error al cargar precio</p>
                )}
            </div>

            <button
                onClick={handleBuy}
                disabled={!isConnected || isPending || isConfirming || isPurchasing || isPriceLoading || !ticketPriceData}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${!isConnected || !ticketPriceData ? "bg-gray-700 opacity-50 cursor-not-allowed text-gray-400" :
                    isPending || isConfirming ? "bg-yellow-600 text-white cursor-wait animate-pulse" :
                        "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg"
                    }`}
            >
                {isPending ? "Confirma en tu Wallet..." :
                    isConfirming ? "Comprando Ticket..." :
                        isPriceLoading ? "Cargando..." :
                            "COMPRAR TICKET"}
            </button>

            {writeError && (
                <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 text-xs rounded w-full break-words">
                    ❌ Error: {writeError.message.split('.')[0]}
                </div>
            )}

            {isConfirmed && (
                <div className="p-3 bg-green-900/50 border border-green-500 text-green-200 text-sm rounded w-full text-center animate-pulse">
                    ✅ ¡Éxito! Recargando...
                </div>
            )}
        </div>
    );
};
