import { ConnectedWallet } from '@privy-io/react-auth';
import {
  Address,
  createPublicClient,
  custom,
  encodeFunctionData,
  parseUnits,
} from 'viem';
import { sonic } from 'viem/chains';

import IchiVaultList from './ichiVaultList.json';
import IchiVaultAbi from './ichiVault.abi.json';
import {
  approveERC20,
  checkNeedApproval,
  getERC20Balance,
  getERC20Decimals,
} from '../utils/erc20Utils';

const ichiVaultList = JSON.parse(JSON.stringify(IchiVaultList));
const ichiVaultAbi = JSON.parse(JSON.stringify(IchiVaultAbi));

interface IchiVaultConfig {
  vault: Address;
  token: Address;
  tokenPosition: number;
}

interface DepositIchiArgs {
  walletClient: ConnectedWallet;
  vaultAddress: Address;
  amount: string;
  isCollateral?: boolean;
}

export async function depositIchi({
  walletClient,
  vaultAddress,
  amount,
}: DepositIchiArgs): Promise<Address> {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    sonic.id.toString()
  ) {
    await walletClient.switchChain(sonic.id);
  }

  const ichiVaultConfig = ichiVaultList.find(
    (vault: IchiVaultConfig) => vault.vault === vaultAddress
  );

  if (!ichiVaultConfig) {
    throw new Error('Ichi vault either not found or not supported');
  }

  const userAddr = walletClient.address as Address;
  const provider = await walletClient.getEthereumProvider();
  const publicClient = createPublicClient({
    transport: custom(provider),
  });

  const token = ichiVaultConfig.token;
  const parsedAmount = parseUnits(
    amount,
    await getERC20Decimals({ publicClient, tokenAddress: token })
  );

  const userBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: token,
  });

  if (userBalance < parsedAmount) {
    throw new Error('Insufficient balance');
  }

  if (
    await checkNeedApproval({
      publicClient,
      account: userAddr,
      tokenAddress: token,
      spender: vaultAddress,
      amount: parsedAmount,
    })
  ) {
    try {
      const approveTx = await approveERC20({
        provider,
        tokenAddress: token,
        spender: vaultAddress,
        amount: parsedAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    } catch (error) {
      throw new Error('Failed to approve transaction: ' + error);
    }
  }

  const transactionData = encodeFunctionData({
    abi: ichiVaultAbi,
    functionName: 'deposit',
    args: [
      ichiVaultConfig.tokenPosition === 0 ? parsedAmount : 0,
      ichiVaultConfig.tokenPosition === 1 ? parsedAmount : 0,
      userAddr,
    ],
  });

  const transactionRequest = {
    to: vaultAddress,
    data: transactionData,
    value: 0,
  };

  try {
    const transactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionRequest],
    });

    return transactionHash;
  } catch (error) {
    throw new Error('Failed to deposit Ichi: ' + error);
  }
}
