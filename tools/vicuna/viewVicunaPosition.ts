import { Address, createPublicClient, formatUnits, http } from 'viem';
import AaveList from './VicunaList.json';
import AaveAbi from './aave.abi.json';
import { sonic } from 'viem/chains';
import { getERC20Decimals } from '../utils/erc20Utils';

const aaveVaultList = JSON.parse(JSON.stringify(AaveList));
const aaveAbi = JSON.parse(JSON.stringify(AaveAbi));
const AAVE: Address = '0xaa1C02a83362BcE106dFf6eB65282fE8B97A1665';
const MAX_UINT256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
interface ViewAavePositionArgs {
    vaultAddress: Address;
    userAddress: Address;
}

interface AaveVaultConfig {
    name: string;
    vault: Address;
    token: Address;
  }

export async function viewVicunaPosition({
    vaultAddress,
    userAddress,
}: ViewAavePositionArgs) {
    const vaultConfig = aaveVaultList.find(
        (vault: AaveVaultConfig) => vault.vault === vaultAddress
      );
      if (!vaultConfig) {
        throw new Error('Aave vault either not found or not supported');
      }

    const publicClient = createPublicClient({
        chain: sonic,
        transport: http()
    })
    try {
        const { result } = await publicClient.simulateContract({
            address: AAVE,
            abi: aaveAbi,
            functionName: 'withdraw',
            args: [vaultConfig.token, MAX_UINT256, userAddress],
            account: userAddress,
        });
        const amount: any = result;
        const decimal = await getERC20Decimals({
            publicClient,
            tokenAddress: vaultConfig.token
        });
        console.log("Position: ", formatUnits(amount as bigint, decimal));
        return formatUnits(amount as bigint, decimal);
    } catch (error) {
        console.log("Position: ", 0);
        return 0;
    }
}