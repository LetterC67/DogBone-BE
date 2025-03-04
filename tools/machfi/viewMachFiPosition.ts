import { sonic } from 'viem/chains';
import { Address, createPublicClient, formatEther, http } from 'viem';

import MachFiNativeAbi from './machFiNative.abi.json';
import MachFiVaultList from './machFiVaultList.json';

interface VaultConfig {
  name: string;
  vault: Address;
  token: Address;
}

interface ViewMachFiPositionArgs {
  vaultAddress: Address;
  userAddress: Address;
}

const machFiNativeAbi = JSON.parse(JSON.stringify(MachFiNativeAbi));
const machFiVaultList = JSON.parse(JSON.stringify(MachFiVaultList));

export async function viewMachFiPosition({
  vaultAddress,
  userAddress,
}: ViewMachFiPositionArgs) {
  const vaultConfig = machFiVaultList.find(
    (vault: VaultConfig) => vault.vault === vaultAddress
  );

  if (!vaultConfig) {
    throw new Error('Vault either not found or not supported');
  }

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

  const txCall = await publicClient.readContract({
    address: vaultAddress,
    abi: machFiNativeAbi,
    functionName: 'getAccountSnapshot',
    args: [userAddress],
  }) as bigint[];

  const lpBalance = txCall[1];
  const rewardRate = txCall[3];
  const userUnderlyingBalance = lpBalance * rewardRate / BigInt(1e18);

  console.log('MachFi Position: ', formatEther(userUnderlyingBalance));
  return formatEther(userUnderlyingBalance);
}
