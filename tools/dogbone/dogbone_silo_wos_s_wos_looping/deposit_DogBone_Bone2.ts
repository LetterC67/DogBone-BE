import { ConnectedWallet } from '@privy-io/react-auth';
import {
  Address,
  createPublicClient,
  custom,
  encodeFunctionData,
  parseUnits,
} from 'viem';
import { sonic } from 'viem/chains';
import { ZAP_CONTRACT } from '../../constants';
import {
  approveERC20,
  checkNeedApproval,
  getERC20Balance,
  getERC20Decimals,
} from '../../utils/erc20Utils';
import ZapAbi from '../../zap.abi.json';
import { getTokenPriceByAddresses } from '../../coingecko/getTokenPriceByAddresses';
import { odosExecute } from '../../swap/odos';

const zapAbi = JSON.parse(JSON.stringify(ZapAbi));

console.log('Zap abi is: ', zapAbi);

const LEVERAGE: number = 9;
const SILO_VAULT: Address = '0x1d7E3726aFEc5088e11438258193A199F9D5Ba93';
// const SILO_CONFIG: Address = "0x78C246f67c8A6cE03a1d894d4Cf68004Bd55Deea";
const TOKEN: Address = '0x9F0dF7799f6FDAd409300080cfF680f5A23df4b1';
const BORROW_TOKEN: Address = '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38';
const SHARE_DEBT_TOKEN: Address = '0xb8abA7c4e192De20e67D4229326C92ADC5f664ea';

interface DepositDogBone {
  walletClient: ConnectedWallet;
  vault?: Address;
  amount: string;
}

export async function depositDogBone_Bone2({
  walletClient,
  amount,
}: DepositDogBone) {
  console.log(walletClient);
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

  const parsedAmountIn = parseUnits(
    amount,
    await getERC20Decimals({ publicClient, tokenAddress: TOKEN })
  );

  const [TOKEN_PRICE, BORROW_TOKEN_PRICE] = await getTokenPriceByAddresses([
    TOKEN,
    BORROW_TOKEN,
  ]);

  const flashAmount =
    (Number(amount) * (LEVERAGE - 1) * TOKEN_PRICE) / BORROW_TOKEN_PRICE;

  const parsedFlashAmount = parseUnits(
    flashAmount.toString(),
    await getERC20Decimals({ publicClient, tokenAddress: BORROW_TOKEN })
  );

  const { transaction } = await odosExecute({
    receiver: ZAP_CONTRACT,
    chainId: sonic.id,
    tokenIn: BORROW_TOKEN,
    tokenOut: TOKEN,
    amountIn: parsedFlashAmount,
  });

  const userBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: TOKEN,
  });

  if (userBalance < parsedAmountIn) {
    throw new Error('Insufficient balance');
  }

  if (
    await checkNeedApproval({
      publicClient,
      account: userAddr,
      tokenAddress: TOKEN,
      spender: ZAP_CONTRACT,
      amount: parsedAmountIn,
    })
  ) {
    try {
      const approveTx = await approveERC20({
        provider,
        tokenAddress: TOKEN,
        spender: ZAP_CONTRACT,
        amount: parsedAmountIn,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    } catch (error) {
      throw new Error('Failed to approve token: ' + error);
    }
  }

  if (
    await checkNeedApproval({
      publicClient,
      account: userAddr,
      tokenAddress: SHARE_DEBT_TOKEN,
      spender: ZAP_CONTRACT,
      amount: parsedFlashAmount * BigInt(2),
    })
  ) {
    try {
      const approveTx = await approveERC20({
        provider,
        tokenAddress: SHARE_DEBT_TOKEN,
        spender: ZAP_CONTRACT,
        amount: parsedFlashAmount * BigInt(2),
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    } catch (error) {
      throw new Error('Failed to approve token: ' + error);
    }
  }

  const transactionData = encodeFunctionData({
    abi: zapAbi,
    functionName: 'doStrategy',
    args: [
      {
        vault: SILO_VAULT,
        token: TOKEN,
        amount: parsedAmountIn,
        receiver: userAddr,
        funcSelector: '0xa7377f92',
        leverage: LEVERAGE,
        flashAmount: parsedFlashAmount,
        isProtected: false,
        swapFlashloan: {
          fromToken: BORROW_TOKEN,
          fromAmount: parsedFlashAmount,
          router: transaction.to as Address,
          data: transaction.data as Address,
          value: BigInt(transaction.value),
        },
      },
    ],
  });

  const transactionRequest = {
    to: ZAP_CONTRACT,
    data: transactionData,
    value: BigInt(0),
  };

  try {
    const transactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionRequest],
    });

    return transactionHash;
  } catch (error) {
    throw new Error('Failed to deposit token into Bone1: ' + error);
  }
}
