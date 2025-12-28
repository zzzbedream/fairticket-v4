import { useReadContract, useAccount } from "wagmi";
import { formatEther } from "viem";

// Nuevo contrato desplegado
const CONTRACT_ADDRESS = "0xF3FE049713Ef283Aea459BEF2b501A0599c45418";

const DIAGNOSTIC_ABI = [
    {
        "inputs": [],
        "name": "name",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
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
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const ContractDiagnostic = () => {
    const { address, isConnected } = useAccount();

    // Test 1: Read contract name
    const { data: contractName, isLoading: nameLoading, error: nameError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: DIAGNOSTIC_ABI,
        functionName: "name",
    });

    // Test 2: Read contract symbol
    const { data: symbol, isLoading: symbolLoading, error: symbolError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: DIAGNOSTIC_ABI,
        functionName: "symbol",
    });

    // Test 3: Read ticket price
    const { data: ticketPrice, isLoading: priceLoading, error: priceError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: DIAGNOSTIC_ABI,
        functionName: "ticketPrice",
    });

    // Test 4: Read total tickets
    const { data: totalTickets, isLoading: ticketsLoading, error: ticketsError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: DIAGNOSTIC_ABI,
        functionName: "getTotalTicketsMinted",
    });

    // Test 5: Read owner
    const { data: owner, isLoading: ownerLoading, error: ownerError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: DIAGNOSTIC_ABI,
        functionName: "owner",
    });

    const getStatusIcon = (isLoading: boolean, error: any, data: any) => {
        if (isLoading) return "🔄";
        if (error) return "❌";
        if (data !== undefined) return "✅";
        return "⏳";
    };

    const getStatusColor = (isLoading: boolean, error: any, data: any) => {
        if (isLoading) return "text-yellow-400";
        if (error) return "text-red-400";
        if (data !== undefined) return "text-green-400";
        return "text-gray-400";
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-slate-900 rounded-xl border border-slate-700 my-8">
            <h2 className="text-2xl font-bold text-white mb-4">🔬 Diagnóstico del Contrato</h2>

            <div className="mb-4 p-3 bg-slate-800 rounded text-xs font-mono break-all">
                <span className="text-gray-400">Dirección:</span>{" "}
                <span className="text-cyan-400">{CONTRACT_ADDRESS}</span>
            </div>

            {isConnected && (
                <div className="mb-4 p-3 bg-slate-800 rounded text-xs font-mono break-all">
                    <span className="text-gray-400">Tu wallet:</span>{" "}
                    <span className="text-purple-400">{address}</span>
                </div>
            )}

            <div className="space-y-3">
                {/* Test 1: Name */}
                <div className="p-3 bg-slate-800 rounded">
                    <div className={`font-bold ${getStatusColor(nameLoading, nameError, contractName)}`}>
                        {getStatusIcon(nameLoading, nameError, contractName)} Contract Name
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                        {nameLoading ? "Cargando..." :
                            nameError ? `Error: ${nameError.message.slice(0, 60)}...` :
                                contractName || "Sin datos"}
                    </div>
                </div>

                {/* Test 2: Symbol */}
                <div className="p-3 bg-slate-800 rounded">
                    <div className={`font-bold ${getStatusColor(symbolLoading, symbolError, symbol)}`}>
                        {getStatusIcon(symbolLoading, symbolError, symbol)} Contract Symbol
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                        {symbolLoading ? "Cargando..." :
                            symbolError ? `Error: ${symbolError.message.slice(0, 60)}...` :
                                symbol || "Sin datos"}
                    </div>
                </div>

                {/* Test 3: Ticket Price */}
                <div className="p-3 bg-slate-800 rounded">
                    <div className={`font-bold ${getStatusColor(priceLoading, priceError, ticketPrice)}`}>
                        {getStatusIcon(priceLoading, priceError, ticketPrice)} Ticket Price
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                        {priceLoading ? "Cargando..." :
                            priceError ? `Error: ${priceError.message.slice(0, 60)}...` :
                                ticketPrice !== undefined ? `${formatEther(ticketPrice)} ETH` : "Sin datos"}
                    </div>
                </div>

                {/* Test 4: Total Tickets */}
                <div className="p-3 bg-slate-800 rounded">
                    <div className={`font-bold ${getStatusColor(ticketsLoading, ticketsError, totalTickets)}`}>
                        {getStatusIcon(ticketsLoading, ticketsError, totalTickets)} Total Tickets Minted
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                        {ticketsLoading ? "Cargando..." :
                            ticketsError ? `Error: ${ticketsError.message.slice(0, 60)}...` :
                                totalTickets !== undefined ? totalTickets.toString() : "Sin datos"}
                    </div>
                </div>

                {/* Test 5: Owner */}
                <div className="p-3 bg-slate-800 rounded">
                    <div className={`font-bold ${getStatusColor(ownerLoading, ownerError, owner)}`}>
                        {getStatusIcon(ownerLoading, ownerError, owner)} Contract Owner
                    </div>
                    <div className="text-sm text-gray-300 mt-1 break-all">
                        {ownerLoading ? "Cargando..." :
                            ownerError ? `Error: ${ownerError.message.slice(0, 60)}...` :
                                owner || "Sin datos"}
                    </div>
                    {isConnected && owner && address && owner.toLowerCase() === address.toLowerCase() && (
                        <div className="mt-2 text-xs text-green-400">
                            ✅ ¡Eres el dueño del contrato!
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500 rounded text-sm">
                <div className="font-bold text-blue-300 mb-2">📋 Interpretación:</div>
                <ul className="text-blue-200 space-y-1 text-xs">
                    <li>✅ = Función funciona correctamente</li>
                    <li>❌ = Error al leer (el contrato puede no estar desplegado o la función no existe)</li>
                    <li>🔄 = Cargando datos de la blockchain</li>
                </ul>
            </div>
        </div>
    );
};
