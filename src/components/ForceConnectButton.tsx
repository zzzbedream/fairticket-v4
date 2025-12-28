import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useState } from 'react';

export function ForceConnectButton() {
    const [isConnecting, setIsConnecting] = useState(false);

    const connectWallet = async () => {
        // Event Handling: debug log
        console.log('Force Connect: Button clicked');
        setIsConnecting(true);

        try {
            // Direct Injection Check
            const ethereum = (window as any).ethereum;

            if (!ethereum) {
                alert('MetaMask not found');
                setIsConnecting(false);
                return;
            }

            // Force Request: Bypass library latency
            await ethereum.request({ method: 'eth_requestAccounts' });

        } catch (error) {
            console.error('Force Connect Error:', error);
            // Error Catching: Alert user
            alert('Please open MetaMask manually');
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <Button onClick={connectWallet} disabled={isConnecting} className="bg-blue-600 hover:bg-blue-700">
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? 'Opening MetaMask...' : 'Connect Wallet'}
        </Button>
    );
}
