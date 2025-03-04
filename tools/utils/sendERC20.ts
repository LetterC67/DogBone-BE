import { ConnectedWallet } from '@privy-io/react-auth';
import { Address, createPublicClient, custom, parseUnits } from 'viem';
import { sonic } from 'viem/chains';
import { NATIVE_TOKEN } from '../constants';
import { getERC20Decimals, transferERC20 } from './erc20Utils';

/// Supports ERC20 and Native token
/// For Native token, please provide the tokenAddress as address(0)
export async function sendToken(
  walletClient: ConnectedWallet,
  tokenAddress: Address,
  recipient: Address,
  value: string
) {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    sonic.id.toString()
  ) {
    await walletClient.switchChain(sonic.id);
  }

  const provider = await walletClient.getEthereumProvider();
  const publicClient = createPublicClient({
    chain: sonic,
    transport: custom(provider),
  });

  const decimals = await getERC20Decimals({ publicClient, tokenAddress });
  const parsedValue = parseUnits(value, decimals);

  if (tokenAddress === NATIVE_TOKEN) {
    const txRequest = {
      to: recipient,
      value: parsedValue,
    };

    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [txRequest],
    });
    return txHash;
  }

  return await transferERC20({
    provider,
    tokenAddress,
    recipient,
    amount: parsedValue,
  });
}
