"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

interface DynamicTicketQRProps {
    ticketId: string;
    ownerAddress: string;
}

export default function DynamicTicketQR({
    ticketId,
    ownerAddress,
}: DynamicTicketQRProps) {
    const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));

    // Rotate QR code payload every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setTimestamp(Math.floor(Date.now() / 1000));
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    const payload = JSON.stringify({
        ticketId,
        owner: ownerAddress,
        timestamp,
        // Salt/Signature could go here in production
    });

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg max-w-sm mx-auto">
            <div className="mb-4 text-center">
                <h3 className="text-lg font-bold text-slate-900">Entrance Ticket</h3>
                <p className="text-xs text-slate-500">Scan at potential entry point</p>
            </div>

            <div className="p-2 border-4 border-slate-900 rounded-lg">
                <QRCode
                    value={payload}
                    size={200}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                    level="H"
                />
            </div>

            <div className="mt-4 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-xs text-slate-400 font-mono">
                    Code rotates every 15s • {timestamp}
                </p>
            </div>
        </div>
    );
}
