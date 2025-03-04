import { ConnectedWallet } from '@privy-io/react-auth';
import {
  Address,
  createPublicClient,
  custom,
  encodeFunctionData,
  parseUnits,
} from 'viem';
import { sonic } from 'viem/chains';
import { NATIVE_TOKEN } from '../constants';
import MachFiNativeAbi from './machFiNative.abi.json';
import MachFiERC20Abi from './machFiERC20.abi.json';
import MachFiVaultList from './machFiVaultList.json';
import {
  approveERC20,
  checkNeedApproval,
  getERC20Decimals,
} from '../utils/erc20Utils';

const machFiNativeAbi = JSON.parse(JSON.stringify(MachFiNativeAbi));
const machFiERC20Abi = JSON.parse(JSON.stringify(MachFiERC20Abi));
const machFiVaultList = JSON.parse(JSON.stringify(MachFiVaultList));

interface VaultConfig {
  name: string;
  vault: Address;
  token: Address;
}

interface DepositMachFiArgs {
  walletClient: ConnectedWallet;
  vaultAddress: Address;
  amount: string;
  isCollateral?: boolean;
}

export async function depositMachFi({
  walletClient,
  vaultAddress,
  amount,
}: DepositMachFiArgs) {
  const vaultConfig = machFiVaultList.find(
    (vault: VaultConfig) => vault.vault === vaultAddress
  );

  if (!vaultConfig) {
    throw new Error('Vault either not found or not supported');
  }

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

  const token = vaultConfig.token;
  const parsedAmount = parseUnits(
    amount,
    await getERC20Decimals({ publicClient, tokenAddress: token })
  );

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
      throw new Error('Failed to approve token: ' + error);
    }
  }

  const transactionRequest =
    token === NATIVE_TOKEN
      ? getNativeTransactionRequest(vaultAddress, parsedAmount)
      : getERC20TransactionRequest(vaultAddress, parsedAmount);

  try {
    const transactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionRequest],
    });

    return transactionHash;
  } catch (error) {
    throw new Error('Failed to deposit token into Silo: ' + error);
  }
}

function getNativeTransactionRequest(vaultAddress: Address, amount: bigint) {
  const transactionData = encodeFunctionData({
    abi: machFiNativeAbi,
    functionName: 'mintAsCollateral',
    args: [],
  });

  const transactionRequest = {
    to: vaultAddress,
    data: transactionData,
    value: amount,
  };

  return transactionRequest;
}

function getERC20TransactionRequest(vaultAddress: Address, amount: bigint) {
  const transactionData = encodeFunctionData({
    abi: machFiERC20Abi,
    functionName: 'mintAsCollateral',
    args: [amount],
  });

  const transactionRequest = {
    to: vaultAddress,
    data: transactionData,
    value: 0,
  };

  return transactionRequest;
}
