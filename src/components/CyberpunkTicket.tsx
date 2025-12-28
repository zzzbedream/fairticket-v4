"use client";

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { config } from '../config'; // Importa el archivo que creamos en el PASO 1

// TU CONTRATO REAL
const CONTRACT_ADDRESS = "0xa56F54a4239a958b33A9EE11f27384fC966e5f69";

// ABI Mínimo
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "buyTicket",
    "stateMutability": "payable",
    "type": "function",
    "outputs": []
  }
] as const;

export default function CyberpunkTicket() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, error: connectError } = useConnect(); // Capturamos error de conexión
  const { switchChain } = useSwitchChain(); // Para forzar cambio de red

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // PRECIO AJUSTADO: Bajísimo para testear (0.00001 ETH)
  const TICKET_PRICE = parseEther('0.00001');

  const handleConnect = () => {
    // Intentamos conectar con el primer conector (MetaMask)
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    } else {
      alert("No se detectó Wallet. Asegúrate de tener MetaMask instalado.");
    }
  };

  const handleBuy = () => {
    if (!isConnected) return alert("Conecta tu wallet primero");

    // Verificación de Red: Si no está en CodeNut DevNet (20258), intenta cambiar
    if (chainId !== 20258) {
      try {
        switchChain({ chainId: 20258 });
        return;
      } catch (e) {
        console.error(e);
        alert("Por favor cambia manualmente a CodeNut DevNet en MetaMask");
      }
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'buyTicket',
      value: TICKET_PRICE, // Usamos el precio bajo
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-green-400 font-mono p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full border border-green-500/50 p-8 rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.2)] bg-slate-900/80 backdrop-blur">

        <h1 className="text-3xl font-bold mb-2 text-white text-center">FAIRTICKET <span className="text-purple-500">V4</span></h1>
        <p className="text-xs text-center text-gray-500 mb-8">SECURE EVENT PROTOCOL // DEVNET BUILD</p>

        {/* SECCIÓN DE ESTADO DE CONEXIÓN */}
        <div className="mb-8 text-center">
          {!isConnected ? (
            <div>
              <button
                onClick={handleConnect}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-all"
              >
                CONNECT WALLET
              </button>
              {connectError && (
                <p className="text-red-500 text-xs mt-2">Error: {connectError.message}</p>
              )}
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-500/30 p-2 rounded">
              <p className="text-xs text-gray-400">Wallet Connected</p>
              <p className="text-sm font-bold text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
              {chainId !== 20258 && (
                <p className="text-red-400 text-xs mt-1 animate-pulse">⚠️ Wrong Network (Need ID 20258)</p>
              )}
            </div>
          )}
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Price:</span>
            <span className="text-white">0.00001 ETH (Test)</span>
          </div>

          <button
            onClick={handleBuy}
            disabled={!isConnected || isPending || isConfirming}
            className={`w-full font-bold py-4 rounded-lg text-lg transition-all ${!isConnected
                ? "bg-gray-700 cursor-not-allowed opacity-50"
                : isPending || isConfirming
                  ? "bg-yellow-600 cursor-wait text-white"
                  : "bg-green-500 hover:bg-green-400 text-black hover:shadow-[0_0_15px_rgba(74,222,128,0.6)]"
              }`}
          >
            {isPending ? 'FIRMA EN METAMASK...' : isConfirming ? 'CONFIRMANDO...' : 'BUY TICKET NOW'}
          </button>

          {writeError && (
            <div className="p-3 bg-red-900/40 border border-red-500/50 rounded text-xs text-red-300 break-words">
              ❌ {writeError.message.split('.')[0]}
            </div>
          )}
        </div>

        {/* ÉXITO */}
        {(hash || isConfirmed) && (
          <div className="mt-6 p-4 bg-green-900/20 border border-green-400 rounded-lg animate-bounce-in">
            <h3 className="text-green-400 font-bold text-center mb-2">✅ TICKET MINTED</h3>
            <div className="text-[10px] text-gray-400 break-all text-center">
              Hash: {hash}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
