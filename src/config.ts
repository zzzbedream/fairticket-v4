import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

// CodeNut Devnet (Polygon Amoy Fork) - Chain personalizada
export const codeNutChain = defineChain({
    id: 20258,
    name: 'CodeNut Devnet',
    network: 'codenut-devnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['https://dev-rpc.codenut.dev'] },
        public: { http: ['https://dev-rpc.codenut.dev'] },
    },
    blockExplorers: {
        default: { name: 'CodeNut Explorer', url: 'https://explorer.codenut.dev' },
    },
    testnet: true,
})

// Configuración de Wagmi con CodeNut Devnet
export const config = createConfig({
    chains: [codeNutChain],
    connectors: [
        injected(), // MetaMask
    ],
    transports: {
        [codeNutChain.id]: http('https://dev-rpc.codenut.dev'),
    },
})
