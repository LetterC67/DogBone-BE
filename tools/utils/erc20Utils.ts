import { Address, encodeFunctionData, PublicClient } from 'viem';
import { erc20Abi } from 'viem';
import { NATIVE_TOKEN } from '../constants.ts';

interface GetERC20BalanceArgs {
  publicClient: PublicClient;
  account: Address;
  tokenAddress: Address;
}

interface GetERC20AllowanceArgs {
  publicClient: PublicClient;
  account: Address;
  tokenAddress: Address;
  spender: Address;
}

interface GetERC20DecimalsArgs {
  publicClient: PublicClient;
  tokenAddress: Address;
}

interface ApproveERC20Args {
  provider: any;
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
}

interface TransferERC20Args {
  provider: any;
  tokenAddress: Address;
  recipient: Address;
  amount: bigint;
}

interface CheckNeedApprovalArgs {
  publicClient: PublicClient;
  account: Address;
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
}

export async function getERC20Balance({
  publicClient,
  account,
  tokenAddress,
}: GetERC20BalanceArgs): Promise<bigint> {
  if (tokenAddress === NATIVE_TOKEN) {
    const balance = await publicClient.getBalance({ address: account });
    return balance;
  }

  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account],
  });
  return balance;
}

export async function getERC20Allowance({
  publicClient,
  account,
  tokenAddress,
  spender,
}: GetERC20AllowanceArgs): Promise<bigint> {
  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account, spender],
  });
  return allowance;
}

export async function getERC20Decimals({
  publicClient,
  tokenAddress,
}: GetERC20DecimalsArgs): Promise<number> {
  if (tokenAddress === NATIVE_TOKEN) return 18;

  const decimals = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    args: [],
  });
  return decimals;
}

export async function approveERC20({
  provider,
  tokenAddress,
  spender,
  amount,
}: ApproveERC20Args): Promise<Address> {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, amount],
  });

  const transactionRequest = {
    to: tokenAddress,
    value: 0,
    data: data,
  };

  const transactionHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [transactionRequest],
  });

  return transactionHash;
}

export async function transferERC20({
  provider,
  tokenAddress,
  recipient,
  amount,
}: TransferERC20Args): Promise<Address> {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [recipient, amount],
  });

  const transactionRequest = {
    to: tokenAddress,
    value: 0,
    data: data,
  };

  const transactionHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [transactionRequest],
  });

  return transactionHash;
}

export async function checkNeedApproval({
  publicClient,
  account,
  tokenAddress,
  spender,
  amount,
}: CheckNeedApprovalArgs): Promise<boolean> {
  if (tokenAddress === NATIVE_TOKEN) return false;
  const allowance = await getERC20Allowance({
    publicClient,
    account,
    tokenAddress,
    spender,
  });

  return allowance < amount;
}
