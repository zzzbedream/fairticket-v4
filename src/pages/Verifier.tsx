"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

type ScanResult = {
    status: "valid" | "expired" | "invalid";
    message: string;
    ticketId?: string;
    owner?: string;
};

export default function Verifier() {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(true);

    const handleScan = (detectedCodes: any[]) => {
        if (detectedCodes.length === 0 || !isScanning) return;

        const rawValue = detectedCodes[0].rawValue;
        setIsScanning(false); // Stop scanning to avoid multiple reads

        try {
            // Parse QR JSON payload
            const payload = JSON.parse(rawValue);
            const { ticketId, owner, timestamp } = payload;

            if (!ticketId || !owner || !timestamp) {
                setScanResult({
                    status: "invalid",
                    message: "QR Inválido: Datos incompletos",
                });
                return;
            }

            // ANTI-FRAUD: Timestamp validation (60 second window)
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const timeDifference = Math.abs(currentTimestamp - timestamp);

            if (timeDifference > 60) {
                setScanResult({
                    status: "expired",
                    message: "TICKET EXPIRADO O CAPTURA",
                    ticketId,
                    owner,
                });
            } else {
                setScanResult({
                    status: "valid",
                    message: "ACCESO AUTORIZADO",
                    ticketId,
                    owner,
                });
            }
        } catch (error) {
            setScanResult({
                status: "invalid",
                message: "ERROR: QR No Válido",
            });
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setIsScanning(true);
    };

    // Result Display Screen
    if (scanResult) {
        const bgColor =
            scanResult.status === "valid" ? "bg-green-600" :
                scanResult.status === "expired" ? "bg-red-600" :
                    "bg-orange-600";

        const icon =
            scanResult.status === "valid" ? "✓" :
                scanResult.status === "expired" ? "✗" :
                    "⚠";

        return (
            <div className={`min-h-screen ${bgColor} flex flex-col items-center justify-center p-8 text-white`}>
                <div className="text-center space-y-8 max-w-md">
                    <div className="text-9xl font-black animate-pulse">
                        {icon}
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight">
                        {scanResult.message}
                    </h1>

                    {scanResult.ticketId && (
                        <div className="bg-black/30 p-4 rounded-lg text-sm font-mono space-y-1">
                            <p><span className="text-white/60">Ticket ID:</span> {scanResult.ticketId}</p>
                            <p><span className="text-white/60">Owner:</span> {scanResult.owner?.slice(0, 10)}...</p>
                        </div>
                    )}

                    <button
                        onClick={resetScanner}
                        className="w-full py-6 px-8 bg-white text-slate-900 rounded-xl font-bold text-xl hover:bg-slate-100 transition-all shadow-2xl"
                    >
                        ESCANEAR SIGUIENTE
                    </button>
                </div>
            </div>
        );
    }

    // Scanner Screen
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-6">
                <h1 className="text-2xl font-bold text-white text-center">
                    🔍 FairTicket Verifier
                </h1>
                <p className="text-slate-400 text-center text-sm mt-1">
                    Escanea el código QR del ticket
                </p>
            </div>

            {/* Scanner */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-green-500">
                        <Scanner
                            onScan={handleScan}
                            styles={{
                                container: { width: "100%", aspectRatio: "1/1" },
                            }}
                            components={{
                                audio: false,
                                finder: true,
                            }}
                        />
                    </div>

                    <div className="mt-6 p-4 bg-slate-800 rounded-lg text-center">
                        <p className="text-sm text-slate-300">
                            ⏱️ Validación Anti-Fraude Activa
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Los tickets expiran 60s después de su timestamp
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
