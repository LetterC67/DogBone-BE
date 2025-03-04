import { ConnectedWallet } from '@privy-io/react-auth';
import {
  Address,
  createPublicClient,
  custom,
  encodeFunctionData,
  formatUnits,
  parseUnits,
} from 'viem';
import { sonic } from 'viem/chains';
import RingsVaultList from './ringsVaultList.json';
import ScRingsAbi from './scRings.abi.json';
import {
  approveERC20,
  checkNeedApproval,
  getERC20Balance,
  getERC20Decimals,
} from '../utils/erc20Utils';

const ringsVaultList = JSON.parse(JSON.stringify(RingsVaultList));
const scRingsAbi = JSON.parse(JSON.stringify(ScRingsAbi));

interface RingsVaultConfig {
  underlyingToken: Address;
  scToken: Address;
  scTeller: Address;
  scWithdrawQueue: Address;
  stkscToken: Address;
  stkscTeller: Address;
  stkscWithdrawQueue: Address;
}

interface DepositRingsArgs {
  walletClient: ConnectedWallet;
  vaultAddress: Address;
  amount: string;
  isCollateral?: boolean;
}

export async function depositRingsSC({
  walletClient,
  vaultAddress,
  amount,
}: DepositRingsArgs) {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    sonic.id.toString()
  ) {
    await walletClient.switchChain(sonic.id);
  }

  const vaultConfig = ringsVaultList.find(
    (vault: RingsVaultConfig) => vault.stkscTeller === vaultAddress
  );
  if (!vaultConfig) {
    throw new Error('Vault either not found or not supported');
  }

  const userAddr = walletClient.address as Address;
  const provider = await walletClient.getEthereumProvider();
  const publicClient = createPublicClient({
    transport: custom(provider),
  });

  const scToken = vaultConfig.scToken;
  const parsedAmount = parseUnits(
    amount,
    await getERC20Decimals({ publicClient, tokenAddress: scToken })
  );
  const userBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: scToken,
  });

  if (userBalance < parsedAmount) {
    throw new Error('Insufficient SC balance');
  }

  if (
    await checkNeedApproval({
      publicClient,
      account: userAddr,
      tokenAddress: scToken,
      spender: vaultConfig.stkscToken,
      amount: parsedAmount,
    })
  ) {
    try {
      const approveTx = await approveERC20({
        provider,
        tokenAddress: scToken,
        spender: vaultConfig.stkscToken,
        amount: parsedAmount,
      });

      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    } catch (error) {
      throw new Error('Approval failed: ' + error);
    }
  }

  console.log('parsedAmount: ', parsedAmount);
  const transactionData = encodeFunctionData({
    abi: scRingsAbi,
    functionName: 'deposit',
    args: [scToken, parsedAmount, 0],
  });

  const transactionRequest = {
    to: vaultConfig.stkscTeller,
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
    throw new Error('Failed to deposit SC into StkSC Contract ' + error);
  }
}

export async function depositRingsNative({
  walletClient,
  vaultAddress,
  amount,
}: DepositRingsArgs) {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    sonic.id.toString()
  ) {
    await walletClient.switchChain(sonic.id);
  }

  const vaultConfig = ringsVaultList.find(
    (vault: RingsVaultConfig) => vault.stkscTeller === vaultAddress
  );
  if (!vaultConfig) {
    throw new Error('Vault either not found or not supported');
  }

  const userAddr = walletClient.address as Address;
  const provider = await walletClient.getEthereumProvider();
  const publicClient = createPublicClient({
    transport: custom(provider),
  });

  const underlyingToken = vaultConfig.underlyingToken;
  const scDecimal = await getERC20Decimals({
    publicClient,
    tokenAddress: underlyingToken,
  });
  const parsedAmount = parseUnits(amount, scDecimal);

  const userBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: underlyingToken,
  });

  if (userBalance < parsedAmount) {
    throw new Error('Insufficient balance');
  }

  if (
    await checkNeedApproval({
      publicClient,
      account: userAddr,
      tokenAddress: underlyingToken,
      spender: vaultConfig.scToken,
      amount: parsedAmount,
    })
  ) {
    try {
      const approveTx = await approveERC20({
        provider,
        tokenAddress: underlyingToken,
        spender: vaultConfig.scToken,
        amount: parsedAmount,
      });

      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    } catch (error) {
      throw new Error('Approval failed: ' + error);
    }
  }

  const transactionData = encodeFunctionData({
    abi: scRingsAbi,
    functionName: 'deposit',
    args: [underlyingToken, parsedAmount, 0],
  });

  const transactionRequest = {
    to: vaultConfig.scTeller,
    data: transactionData,
    value: 0,
  };

  const beforeSCBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: vaultConfig.scToken,
  });

  try {
    const transactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionRequest],
    });
    await publicClient.waitForTransactionReceipt({ hash: transactionHash });
  } catch (error) {
    throw new Error('Failed to deposit into SC Contract ' + error);
  }

  const afterScBalance = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: vaultConfig.scToken,
  });

  console.log('before sc balance: ', beforeSCBalance);
  console.log('after sc balance: ', afterScBalance);

  const scAmount = formatUnits(afterScBalance - beforeSCBalance, scDecimal);

  return await depositRingsSC({ walletClient, vaultAddress, amount: scAmount });
}
