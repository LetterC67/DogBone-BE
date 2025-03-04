import { Address, createPublicClient, formatUnits, http } from 'viem';
import RingsVaultList from './ringsVaultList.json';
import ScRingsWithdrawQueueAbi from './scRingsWithdrawQueue.abi.json';
import { sonic } from 'viem/chains';
import { getERC20Balance, getERC20Decimals } from '../utils/erc20Utils';

const ringsVaultList = JSON.parse(JSON.stringify(RingsVaultList));
const scRingsWithdrawQueueAbi = JSON.parse(
  JSON.stringify(ScRingsWithdrawQueueAbi)
);

interface RingsVaultConfig {
  underlyingToken: Address;
  scToken: Address;
  scTeller: Address;
  scWithdrawQueue: Address;
  stkscToken: Address;
  stkscTeller: Address;
  stkscWithdrawQueue: Address;
}

interface ViewRingsPositionArgs {
  vaultAddress: Address;
  userAddress: Address;
}

export async function viewRingsPosition({
  vaultAddress,
  userAddress,
}: ViewRingsPositionArgs) {
  const vaultConfig = ringsVaultList.find(
    (vault: RingsVaultConfig) => vault.stkscTeller === vaultAddress
  );
  if (!vaultConfig) {
    throw new Error('Vault either not found or not supported');
  }

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });
  const userShareBalance = (await getERC20Balance({
    publicClient,
    account: userAddress,
    tokenAddress: vaultConfig.stkscToken,
  })) as bigint;

  const tokenDecimal = await getERC20Decimals({
    publicClient,
    tokenAddress: vaultConfig.scToken,
  });

  const underlyingBalance = (await publicClient.readContract({
    address: vaultConfig.stkscWithdrawQueue,
    abi: scRingsWithdrawQueueAbi,
    functionName: 'previewAssetsOut',
    args: [vaultConfig.scToken, userShareBalance, 0],
  })) as bigint;

  console.log('Rings balance: ', formatUnits(underlyingBalance, tokenDecimal));
  return formatUnits(underlyingBalance, tokenDecimal);
}
