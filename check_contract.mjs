// Script de diagnóstico con RPC CORRECTA
import { createPublicClient, http, formatEther } from 'viem';
import { defineChain } from 'viem';

const CONTRACT_ADDRESS = '0xF3FE049713Ef283Aea459BEF2b501A0599c45418';
const RPC_URL = 'https://dev-rpc.codenut.dev'; // ✅ RPC CORRECTA

const codeNutChain = defineChain({
    id: 20258,
    name: 'CodeNut Devnet',
    network: 'codenut-devnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: [RPC_URL] },
    },
    testnet: true,
});

const CONTRACT_ABI = [
    {
        inputs: [],
        name: 'name',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'ticketPrice',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getTotalTicketsMinted',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [{ type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
];

console.log('\n🔬 PRUEBA FINAL - CODENUT DEVNET');
console.log('=================================\n');
console.log(`📡 RPC: ${RPC_URL}`);
console.log(`📍 Contrato: ${CONTRACT_ADDRESS}\n`);

try {
    const client = createPublicClient({
        chain: codeNutChain,
        transport: http(RPC_URL, { timeout: 10000 }),
    });

    // Test 1: Chain ID
    console.log('🌐 [1/6] Verificando Chain ID...');
    const chainId = await client.getChainId();
    console.log(`   ✅ Chain ID: ${chainId}\n`);

    // Test 2: Bytecode
    console.log('📦 [2/6] Verificando contrato desplegado...');
    const bytecode = await client.getBytecode({ address: CONTRACT_ADDRESS });

    if (!bytecode || bytecode === '0x') {
        console.log('   ❌ CONTRATO NO ENCONTRADO\n');
        process.exit(1);
    }
    console.log(`   ✅ Contrato desplegado (${bytecode.length} chars)\n`);

    // Test 3: Name
    console.log('🏷️  [3/6] Leyendo nombre...');
    const name = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'name',
    });
    console.log(`   ✅ Nombre: "${name}"\n`);

    // Test 4: Symbol
    console.log('🔤 [4/6] Leyendo símbolo...');
    const symbol = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'symbol',
    });
    console.log(`   ✅ Símbolo: "${symbol}"\n`);

    // Test 5: Ticket Price
    console.log('💰 [5/6] Leyendo precio del ticket...');
    const price = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'ticketPrice',
    });
    console.log(`   ✅ Precio: ${formatEther(price)} ETH\n`);

    // Test 6: Owner
    console.log('👤 [6/6] Leyendo owner...');
    const owner = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'owner',
    });
    console.log(`   ✅ Owner: ${owner}\n`);

    console.log('=================================');
    console.log('🎉 TODOS LOS TESTS PASARON');
    console.log('=================================\n');
    console.log('✅ El contrato está listo para compras!');
    console.log(`   Precio: ${formatEther(price)} ETH`);
    console.log(`   Owner: ${owner}\n`);

} catch (error) {
    console.log(`\n❌ ERROR: ${error.message}\n`);
    process.exit(1);
}
