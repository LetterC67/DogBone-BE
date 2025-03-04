import { ConnectedWallet } from '@privy-io/react-auth';
import {
  getERC20Balance,
  getERC20Decimals,
  approveERC20,
  checkNeedApproval,
} from '../utils/erc20Utils.ts';

import { createPublicClient, custom, parseUnits, Address, formatUnits } from 'viem';
import { debridgeQuote } from './debridge.ts';
import supportedChains from './supportedChains.json';

const chainIdMapping: Record<string, string> = JSON.parse(
  JSON.stringify(supportedChains)
);

/**
 * Interface for the arguments required to bridge tokens between two chains
 * @param walletClient - The wallet client object
 * @param srcChainId - The source chain ID (eip155 chainId format, not the chainId specified by deBridge)
 * @param dstChainId - The destination chain ID (eip155 chainId format, not the chainId specified by deBridge)
 * @param srcChainTokenIn - The address of the token to be bridged
 * @param srcAmountIn - The amount of tokens to be bridged (in string format, not in wei, e.g "0.1", "100", etc.)
 * @param dstChainTokenOut - The address of the token to be received on the destination chain
 * @param externalCall - Optional object containing the address and data for an external call to be made after the bridge transaction is completed
 */
export interface BridgeArgs {
  walletClient: ConnectedWallet;
  srcChainId: number;
  dstChainId: number;
  srcChainTokenIn: Address;
  srcAmountIn: string;
  dstChainTokenOut: Address;
  externalCall?: {
    target: Address;  
    targetPayload: Address;
  };
}

export async function bridge({
  walletClient,
  srcChainId,
  dstChainId,
  srcChainTokenIn,
  srcAmountIn,
  dstChainTokenOut,
  externalCall,
}: BridgeArgs) {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    srcChainId.toString()
  ) {
    await walletClient.switchChain(Number(srcChainId));
  }

  const userAddr = walletClient.address as Address;
  const provider = await walletClient.getEthereumProvider();
  const publicClient = createPublicClient({
    transport: custom(provider),
  });

  const parsedAmountIn = parseUnits(
    srcAmountIn,
    await getERC20Decimals({ publicClient, tokenAddress: srcChainTokenIn })
  );

  const userBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: srcChainTokenIn,
  });

  if (userBalance < parsedAmountIn) {
    throw new Error('Insufficient balance to bridge');
  }

  const {transaction, amountOut} = await debridgeQuote({
    walletClient,
    srcChainId: Number(chainIdMapping[srcChainId]),
    dstChainId: Number(chainIdMapping[dstChainId]),
    srcChainTokenIn,
    srcAmountIn: parsedAmountIn,
    dstChainTokenOut,
    externalCall,
  });

  if (
    await checkNeedApproval({
      publicClient,
      account: userAddr,
      tokenAddress: srcChainTokenIn,
      spender: transaction.to,
      amount: parsedAmountIn,
    })
  ) {
    try {
      const approveTx = await approveERC20({
        provider,
        tokenAddress: srcChainTokenIn,
        spender: transaction.to,
        amount: parsedAmountIn,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    } catch (error) {
      throw new Error('Failed to approve transaction: ' + error);
    }
  }

  const transactionRequest = {
    to: transaction.to,
    value: transaction.value,
    data: transaction.data,
  };

  try {
    const transactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionRequest],
    });

    await publicClient.waitForTransactionReceipt({ hash: transactionHash });

    const tokenOutDecimal = await getERC20Decimals({
      publicClient,
      tokenAddress: dstChainTokenOut,
    });

    console.log({
      "txHash": transactionHash,
      "amountOut": formatUnits(amountOut, tokenOutDecimal),
    })

    return {
      "txHash": transactionHash,
      "amountOut": formatUnits(amountOut, tokenOutDecimal),
    }
  } catch (error) {
    throw new Error(`Failed to send transaction: ${error}`);
  }
}
