import { Address, createPublicClient, formatUnits, http } from 'viem';
import VaultList from './pendleVaultList.json';
import { sonic } from 'viem/chains';
import { getERC20Balance, getERC20Decimals } from '../utils/erc20Utils';

const vaultList = JSON.parse(JSON.stringify(VaultList));

interface VaultConfig {
  name: string;
  vault: Address;
  expiry: string;
  pt: Address;
  yt: Address;
  sy: Address;
  token: Address;
}

interface ViewPendlePositionArgs {
  vaultAddress: Address;
  userAddress: Address;
}

export async function viewPendlePosition({
  vaultAddress,
  userAddress,
}: ViewPendlePositionArgs) {
  // Check if vault address is in vault list
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

  const PENDLE_API_URL = 'https://api-v2.pendle.finance/core';
  const repsonse = await fetch(
    `${PENDLE_API_URL}/v1/sdk/146/markets/${vaultAddress}/swapping-prices`
  );

  if (!repsonse.ok) {
    throw new Error('Failed to fetch Pendle data');
  }

  const data = await repsonse.json();

  const { ptToUnderlyingTokenRate } = data;

  const userPtBalance = (await getERC20Balance({
    publicClient,
    account: userAddress,
    tokenAddress: vaultConfig.pt,
  })) as bigint;

  const underlyingDecimal = await getERC20Decimals({
    publicClient,
    tokenAddress: vaultConfig.token,
  });

  const userUnderlyingTokenBalance =
    Number(formatUnits(userPtBalance, underlyingDecimal)) *
    ptToUnderlyingTokenRate;
  console.log('Pendle balance: ', userUnderlyingTokenBalance);
  return userUnderlyingTokenBalance;
}
