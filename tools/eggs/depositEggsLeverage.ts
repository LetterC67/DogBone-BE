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
const NUMBER_OF_DAYS = 30;
const FACTOR = parseUnits(
  (0.021 + (0.039 / 365) * NUMBER_OF_DAYS).toString(),
  18
);
const ETHER = parseUnits('1', 18);

interface DepositEggsLeverageArgs {
  walletClient: ConnectedWallet;
  vaultAddress?: Address;
  amount: string;
  isCollateral?: boolean;
}

export async function depositEggsLeverage({
  walletClient,
  amount,
}: DepositEggsLeverageArgs) {
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

  const sonicToDeposit = (parsedAmountIn * ETHER) / FACTOR;

  const transactionData = encodeFunctionData({
    abi: eggAbi,
    functionName: 'leverage',
    args: [sonicToDeposit, NUMBER_OF_DAYS],
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
