import AaveList from './VicunaList.json';
import AaveAbi from './aave.abi.json';
import { sonic } from 'viem/chains';
import { Address, formatUnits, createPublicClient, http } from 'viem';
interface AaveVaultConfig {
    name: string;
    vault: Address;
    token: Address;
    identifier: Address;
}

const aaveVaultList = JSON.parse(JSON.stringify(AaveList));
const aaveAbi = JSON.parse(JSON.stringify(AaveAbi));
const AAVE_DATA_PROVIDER: Address = '0xc67850eCd0EC9dB4c0fD65C1Ad43a53025e6d54D';

export async function getVicunaAPY(vaultAddress: Address) {
    const vaultConfig = aaveVaultList.find(
        (vault: AaveVaultConfig) => vault.vault === vaultAddress
      );
      if (!vaultConfig) {
        throw new Error('Aave vault either not found or not supported');
      }

    const publicClient = createPublicClient({
        chain: sonic,
        transport: http()
    });

    const contractCall = await publicClient.readContract({
        address: AAVE_DATA_PROVIDER,
        abi: aaveAbi,
        functionName: 'getReserveData',
        args: [vaultConfig.token]
    }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]; 
    
    const getMerkleAPYList = await fetch("https://api.merkl.xyz/v4/opportunities?name=Vicuna&items=1000");
    const merkleAPYList = await getMerkleAPYList.json();
    
    const merkleAPY = merkleAPYList.find((item: any) => item.identifier === vaultConfig.identifier);
    console.log('Deposit APY: ', Number(formatUnits(contractCall[5] as bigint, 25)) + merkleAPY.apr);
    return Number(formatUnits(contractCall[5] as bigint, 25)) + merkleAPY.apr;
}