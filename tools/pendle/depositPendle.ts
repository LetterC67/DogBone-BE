import { Address, createPublicClient, custom, parseUnits } from 'viem';
import VaultList from './pendleVaultList.json';
import { sonic } from 'viem/chains';
import {
  approveERC20,
  checkNeedApproval,
  getERC20Balance,
  getERC20Decimals,
} from '../utils/erc20Utils';

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

export async function getPendleRoute(vaultAddress: Address, fromToken: Address, parsedAmount: bigint, receiver: Address) {
  console.log("parsedAmountdsd: ", parsedAmount);
  const vaultConfig = vaultList.find(
    (vault: VaultConfig) => vault.vault === vaultAddress
  );
  if (!vaultConfig) {
    throw new Error('Vault either not found or not supported');
  }

  const PENDLE_API_URL = 'https://api-v2.pendle.finance/core';

  const response = await fetch(
    `${PENDLE_API_URL}/v1/sdk/${sonic.id}/markets/${vaultConfig.name}/swap?receiver=${receiver}&slippage=0.01&enableAggregator=true&tokenIn=${fromToken}&tokenOut=${vaultConfig.pt}&amountIn=${parsedAmount}`
  );

  if (!response.ok) {
    throw new Error('Failed to finding route swap to Pendle PT' + await response.text());
  }

  const data = await response.json();
  const { tx } = data;

  return tx;
}
export async function getPricePendle(vaultAddress: Address, parsedAmount: bigint) {
  const vaultConfig = vaultList.find(
    (vault: VaultConfig) => vault.vault === vaultAddress
  );
  if (!vaultConfig) {
    throw new Error('Vault either not found or not supported');
  }

  const underlyingToken = vaultConfig.token;
  const PENDLE_API_URL = 'https://api-v2.pendle.finance/core';

  const response = await fetch(
    `${PENDLE_API_URL}/v1/sdk/${sonic.id}/markets/${vaultConfig.name}/swap?receiver=${"0x7aF234d569aB6360693806D7e7f439Ec2114F93c"}&slippage=0.01&enableAggregator=true&tokenIn=${vaultConfig.pt}&tokenOut=${"0x29219dd400f2bf60e5a23d13be72b486d4038894"}&amountIn=${parsedAmount}`
  );
  if (!response.ok) {
    throw new Error('Failed to swap');
  }

  const data = await response.json();

  return BigInt(data.data.amountOut);
}