import { ConnectedWallet } from '@privy-io/react-auth';
import {
  Address,
  createPublicClient,
  custom,
  encodeFunctionData,
  parseUnits,
} from 'viem';
import WETH from './WETH.json';
import { NATIVE_TOKEN } from '../constants';
import { getERC20Balance } from './erc20Utils';

const weth = JSON.parse(JSON.stringify(WETH));

interface WrapNativeArgs {
  walletClient: ConnectedWallet;
  chainId: number;
  amount: string;
}

const wrappedAbi = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    payable: true,
    inputs: [],
    outputs: [],
  },
];

export async function wrapNative({
  walletClient,
  chainId,
  amount,
}: WrapNativeArgs): Promise<void> {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    chainId.toString()
  ) {
    await walletClient.switchChain(chainId);
  }

  const userAddr = walletClient.address as Address;
  const provider = await walletClient.getEthereumProvider();
  const publicClient = createPublicClient({
    transport: custom(provider),
  });

  const wrappedToken = weth[chainId.toString()];
  if (!wrappedToken) {
    throw new Error('Wrapped token not found');
  }

  const parsedAmount = parseUnits(amount, 18);
  const userBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: NATIVE_TOKEN,
  });
  if (userBalance < parsedAmount) {
    console.log('User ETH Balance: ', userBalance);
    console.log('Amount In: ', amount);
    throw new Error('Insufficient balance to wrap');
  }

  const transactionData = encodeFunctionData({
    abi: wrappedAbi,
    functionName: 'deposit',
    args: [],
  });

  const transactionRequest = {
    to: wrappedToken,
    data: transactionData,
    value: parsedAmount,
  };

  try {
    const transactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionRequest],
    });

    return transactionHash;
  } catch (error) {
    throw new Error('Failed to wrap native token: ' + error);
  }
}
