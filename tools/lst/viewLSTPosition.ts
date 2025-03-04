import { Address, formatEther, http } from 'viem';
import { getERC20Balance } from '../utils/erc20Utils';
import { createPublicClient } from 'viem';
import { sonic } from 'viem/chains';
import LSTList from './lstList.json';

interface LstConfig {
  name: string;
  vault: Address;
}

interface ViewLSTPositionArgs {
  vaultAddress: Address;
  userAddress: Address;
}

const lstList = JSON.parse(JSON.stringify(LSTList));

export async function viewLSTPosition({
  vaultAddress,
  userAddress,
}: ViewLSTPositionArgs) {
  const lstConfig = lstList.find(
    (lst: LstConfig) => lst.vault === vaultAddress
  );
  if (!lstConfig) {
    throw new Error('LST either not found or not supported');
  }

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

  const userBalance = (await getERC20Balance({
    publicClient,
    account: userAddress,
    tokenAddress: lstConfig.lpToken,
  })) as bigint;

  console.log('USER LST BALANCE: ', formatEther(userBalance));

  return formatEther(userBalance);
}
