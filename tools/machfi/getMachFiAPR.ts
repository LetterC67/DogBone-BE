import { Address, formatEther, http } from 'viem';
import { createPublicClient } from 'viem';
import { sonic } from 'viem/chains';
import MachFiNativeAbi from './machFiNative.abi.json';
import VaultList from './machFiVaultList.json';

interface VaultConfig {
  name: string;
  vault: Address;
  token: Address;
}

const SECONDS_PER_YEAR = 31536000;
const machFiNativeAbi = JSON.parse(JSON.stringify(MachFiNativeAbi));
const vaultList: VaultConfig[] = JSON.parse(JSON.stringify(VaultList));

export async function getMachFiAPR(vaultAddress: Address) {
  const vaultConfig = vaultList.find(
    (vault: VaultConfig) => vault.vault === vaultAddress
  );

  if (!vaultConfig) {
    throw new Error('Vault either not found or not supported');
  }

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

  const rewardPerSecond = (await publicClient.readContract({
    address: vaultAddress,
    abi: machFiNativeAbi,
    functionName: 'supplyRatePerTimestamp',
    args: [],
  })) as bigint;

  const depositAPY =
    ((1 + Number(formatEther(rewardPerSecond))) ** SECONDS_PER_YEAR - 1) * 100;
  console.log('Deposit APY: ', depositAPY.toFixed(2));
  return Number(depositAPY.toFixed(2));
}
