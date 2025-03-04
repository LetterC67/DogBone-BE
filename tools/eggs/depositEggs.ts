import { ConnectedWallet } from '@privy-io/react-auth';
import {
  Address,
  createPublicClient,
  custom,
  encodeFunctionData,
  parseUnits,
} from 'viem';
import { sonic } from 'viem/chains';
import { getERC20Balance } from '../utils/erc20Utils';
import { NATIVE_TOKEN } from '../constants';
import EggAbi from './Eggs.abi.json';

const eggAbi = JSON.parse(JSON.stringify(EggAbi));
const EGGS_ADDRESS = '0xf26Ff70573ddc8a90Bd7865AF8d7d70B8Ff019bC';

interface DepositEggsArgs {
  walletClient: ConnectedWallet;
  vaultAddress?: Address;
  amount: string;
  isCollateral?: boolean;
}

export async function depositEggs({ walletClient, amount }: DepositEggsArgs) {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    sonic.id.toString()
  ) {
    await walletClient.switchChain(sonic.id);
  }

  const userAddr = walletClient.address as Address;
  const provider = await walletClient.getEthereumProvider();
  const publicClient = createPublicClient({
    transport: custom(provider),
  });

  const parsedAmountIn = parseUnits(amount, 18);
  const userBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: NATIVE_TOKEN,
  });

  if (userBalance < parsedAmountIn) {
    throw new Error('Insufficient balance');
  }

  const transactionData = encodeFunctionData({
    abi: eggAbi,
    functionName: 'buy',
    args: [userAddr],
  });

  const transactionRequest = {
    to: EGGS_ADDRESS,
    data: transactionData,
    value: parsedAmountIn,
  };

  try {
    const transactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionRequest],
    });

    return transactionHash;
  } catch (error) {
    throw new Error('Failed to deposit eggs: ' + error);
  }
}
