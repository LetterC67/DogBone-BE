import AaveList from './AaveList.json';
import AaveAbi from './aave.abi.json';
import { sonic } from 'viem/chains';
import { Address, formatUnits, createPublicClient, http } from 'viem';
interface AaveVaultConfig {
    name: string;
    vault: Address;
    token: Address;
}

const aaveVaultList = JSON.parse(JSON.stringify(AaveList));
const aaveAbi = JSON.parse(JSON.stringify(AaveAbi));
const AAVE_DATA_PROVIDER: Address = '0x306c124fFba5f2Bc0BcAf40D249cf19D492440b9';

export async function getAaveAPY(vaultAddress: Address) {
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
    console.log('Deposit APY: ', Number(formatUnits(contractCall[5] as bigint, 25)));
    return Number(formatUnits(contractCall[5] as bigint, 25));
}