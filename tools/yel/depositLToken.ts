import { ConnectedWallet } from '@privy-io/react-auth';
import { Address, createPublicClient, custom, encodeFunctionData, parseUnits } from 'viem';
import { sonic } from 'viem/chains';
import LTokenList from './LTokenList.json';
import LTokenAbi from "./LToken.abi.json"
import { approveERC20, checkNeedApproval, getERC20Balance, getERC20Decimals } from '../utils/erc20Utils';

const lTokenList = JSON.parse(JSON.stringify(LTokenList));
const lTokenAbi = JSON.parse(JSON.stringify(LTokenAbi));

interface LTokenConfig {
    name: string;
    vault: Address;
    token: Address;
}

interface DepositLToken {
  walletClient: ConnectedWallet;
  vaultAddress: Address;
  amount: string;
  isCollateral?: boolean;
}

export async function DepositLToken({
  walletClient,
  vaultAddress,
  amount,
}: DepositLToken) {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    sonic.id.toString()
  ) {
    await walletClient.switchChain(sonic.id);
  }

  const lConfig = lTokenList.find((l: LTokenConfig) => l.vault === vaultAddress);
  if (!lConfig) {
    throw new Error('LToken either not found or not supported');
  }

    const userAddr = walletClient.address as Address;
    const provider = await walletClient.getEthereumProvider();
    const publicClient = createPublicClient({
        transport: custom(provider),
    });

    const parsedAmountIn = parseUnits(amount, await getERC20Decimals({
        publicClient, tokenAddress: lConfig.token
    }));

    const userBalance = await getERC20Balance({
        publicClient,
        account: userAddr,
        tokenAddress: lConfig.token,
    });

    if (userBalance < parsedAmountIn) {
        throw new Error('Insufficient balance');
    }

    if (await checkNeedApproval({publicClient, account: userAddr, tokenAddress: lConfig.token, spender: vaultAddress, amount: parsedAmountIn})) {
        try {
            const approveTx = await approveERC20({
                provider,
                tokenAddress: lConfig.token,
                spender: vaultAddress,
                amount: parsedAmountIn
            });
    
            await publicClient.waitForTransactionReceipt({hash: approveTx});
        } catch (error) {
            throw new Error('Failed to approve token: ' + error);
        }
    }

    const transactionData = encodeFunctionData({
        abi: lTokenAbi,
        functionName: 'bond',
        args: [lConfig.token, parsedAmountIn, 0]
    });
    
    const transactionRequest = {
        to: vaultAddress,
        data: transactionData,
        value: 0
    };

    try {
        const transactionHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [transactionRequest],
        });

        return transactionHash;
    } catch (error) {
        throw new Error('Failed to deposit token: ' + error);
    }
}

