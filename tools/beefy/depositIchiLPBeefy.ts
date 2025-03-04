
import {
  getERC20Balance,
  approveERC20,
  checkNeedApproval,
} from '../utils/erc20Utils';

import { createPublicClient, custom, Address, encodeFunctionData } from 'viem';
import { sonic } from 'viem/chains';
import BeefyIchiLPList from './beefyIchiLPList.json';
import BeefyVaultAbi from './beefyVault.abi.json';
import { depositIchi } from '../ichi/depositIchi';

const beefyIchiLPList = JSON.parse(JSON.stringify(BeefyIchiLPList));
const beefyVaultAbi = JSON.parse(JSON.stringify(BeefyVaultAbi));

interface BeefyIchiLPConfig {
  name: string;
  vault: Address;
  lpToken: Address;
  token: Address;
}

interface DepositLPIchiBeefy {
  walletClient: ConnectedWallet;
  vaultAddress: Address;
  amount: string;
  isCollateral?: boolean;
}

export async function depositIchiLPBeefy({
  walletClient,
  vaultAddress,
  amount,
}: DepositLPIchiBeefy): Promise<void> {
  if (
    walletClient.chainId.slice(7, walletClient.chainId.length) !==
    sonic.id.toString()
  ) {
    await walletClient.switchChain(sonic.id);
  }

  const beefyLPConfig = beefyIchiLPList.find(
    (lst: BeefyIchiLPConfig) => lst.vault === vaultAddress
  );
  if (!beefyLPConfig) {
    throw new Error('Ichi LP either not found or not supported');
  }

  const userAddr = walletClient.address as Address;
  const provider = await walletClient.getEthereumProvider();
  const publicClient = createPublicClient({
    transport: custom(provider),
  });

  // DEPOSIT INTO ICHI VAULT TO GET ICHI LP
  const lpToken = beefyLPConfig.lpToken;
  const depositIchiTx = await depositIchi({
    walletClient,
    vaultAddress: lpToken,
    amount,
  });
  await publicClient.waitForTransactionReceipt({ hash: depositIchiTx });

  // DEPOSIT ICHI LP INTO BEEFY
  const shares = await getERC20Balance({
    publicClient,
    account: userAddr,
    tokenAddress: lpToken,
  });

  console.log('Share received: ', shares);

  if (
    await checkNeedApproval({
      publicClient,
      account: userAddr,
      tokenAddress: lpToken,
      spender: vaultAddress,
      amount: shares,
    })
  ) {
    try {
      const approveTx = await approveERC20({
        provider,
        tokenAddress: lpToken,
        spender: vaultAddress,
        amount: shares,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    } catch (error) {
      throw new Error('Failed to approve transaction: ' + error);
    }
  }

  const transactionData = encodeFunctionData({
    abi: beefyVaultAbi,
    functionName: 'deposit',
    args: [shares],
  });

  const transactionRequest = {
    to: vaultAddress,
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
    throw new Error('Failed to deposit ICHI LP into Beefy: ' + error);
  }
}
