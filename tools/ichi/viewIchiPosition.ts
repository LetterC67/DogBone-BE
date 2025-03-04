import IchiVaultList from './ichiVaultList.json';
import IchiVaultAbi from './ichiVault.abi.json';
import IchiGaugeAbi from './ichiGauge.abi.json';
import { sonic } from 'viem/chains';
import { Address, createPublicClient, formatUnits, http } from 'viem';
import { getERC20Balance, getERC20Decimals } from '../utils/erc20Utils';
import { ZAP_CONTRACT } from '../constants';

const ichiVaultList = JSON.parse(JSON.stringify(IchiVaultList));
const ichiVaultAbi = JSON.parse(JSON.stringify(IchiVaultAbi));
const ichiGaugeAbi = JSON.parse(JSON.stringify(IchiGaugeAbi));

interface IchiVaultConfig {
  vault: Address;
  token: Address;
  gauge: Address;
  tokenPosition: number;
}

interface ViewIChiPositionArgs {
  vaultAddress: Address;
  userAddress: Address;
}
const SWPX_TOKEN: Address = "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70";
const WS_TOKEN: Address = "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38";
const QUOTER_ADDRESS = "0x05270FBbB6db1d8da76bBF70509eFa57971a7Ae5"
const quoterAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint160",
        "name": "limitSqrtPrice",
        "type": "uint160"
      }
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "fee",
        "type": "uint16"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }  
];

export async function viewBeefyIchiPosition(vaultAddress: Address, shares: bigint) {
  const ichiVaultConfig = ichiVaultList.find(
    (vault: IchiVaultConfig) => vault.vault === vaultAddress
  );

  if (!ichiVaultConfig) {
    throw new Error('Ichi vault either not found or not supported');
  }

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

  const token0 = (await publicClient.readContract({
    address: vaultAddress,
    abi: ichiVaultAbi,
    functionName: 'token0',
    args: [],
  })) as Address;

  const token1 = (await publicClient.readContract({
    address: vaultAddress,
    abi: ichiVaultAbi,
    functionName: 'token1',
    args: [],
  })) as Address;

  const token0Decimals = await getERC20Decimals({
    publicClient,
    tokenAddress: token0,
  });

  const token1Decimals = await getERC20Decimals({
    publicClient,
    tokenAddress: token1,
  });

  try {
    const { result } = await publicClient.simulateContract({
      address: vaultAddress,
      abi: ichiVaultAbi,
      functionName: 'withdraw',
      args: [shares, ichiVaultConfig.gauge],
      account: ichiVaultConfig.gauge,
    });

    const [total0, total1] = result;
    let currentTotal = token0 === ichiVaultConfig.token ? total0 : total1;
    currentTotal += token0 === ichiVaultConfig.token ? await getQuote(token1, token0, total1) : await getQuote(token0, token1, total0);
    return formatUnits(currentTotal, token0 === ichiVaultConfig.token ? token0Decimals : token1Decimals);
  } catch (error) {
    return String(0);
  }
}

export async function viewIchiPosition({
  vaultAddress,
  userAddress,
}: ViewIChiPositionArgs) {
  const ichiVaultConfig = ichiVaultList.find(
    (vault: IchiVaultConfig) => vault.vault === vaultAddress
  );

  if (!ichiVaultConfig) {
    throw new Error('Ichi vault either not found or not supported');
  }

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

  let userShareBalance = (await getERC20Balance({
    publicClient,
    account: userAddress,
    tokenAddress: vaultAddress,
  })) as bigint;

  userShareBalance += (await getERC20Balance({
    publicClient,
    account: userAddress,
    tokenAddress: ichiVaultConfig.gauge,
  })) as bigint;

  const token0 = (await publicClient.readContract({
    address: vaultAddress,
    abi: ichiVaultAbi,
    functionName: 'token0',
    args: [],
  })) as Address;

  const token1 = (await publicClient.readContract({
    address: vaultAddress,
    abi: ichiVaultAbi,
    functionName: 'token1',
    args: [],
  })) as Address;

  const token0Decimals = await getERC20Decimals({
    publicClient,
    tokenAddress: token0,
  });

  const token1Decimals = await getERC20Decimals({
    publicClient,
    tokenAddress: token1,
  });

  const reward = (await publicClient.readContract({
    address: ichiVaultConfig.gauge,
    abi: ichiGaugeAbi,
    functionName: 'rewards',
    args: [userAddress],
  })) as bigint;

  try {
    const { result } = await publicClient.simulateContract({
      address: vaultAddress,
      abi: ichiVaultAbi,
      functionName: 'withdraw',
      args: [userShareBalance, userAddress],
      account: userAddress,
    });

    const [total0, total1] = result;
    let currentTotal = token0 === ichiVaultConfig.token ? total0 : total1;
    currentTotal += token0 === ichiVaultConfig.token ? await getQuote(token1, token0, total1) : await getQuote(token0, token1, total0);

    if (reward > 0) {
      let swpxS = await getQuote(SWPX_TOKEN, WS_TOKEN, reward);
      swpxS = await getQuote(WS_TOKEN, ichiVaultConfig.token, swpxS);
      currentTotal += swpxS;
    }
    return formatUnits(currentTotal, token0 === ichiVaultConfig.token ? token0Decimals : token1Decimals);
  } catch (error) {
    return String(0);
  }
}

async function getQuote(tokenIn: Address, tokenOut: Address, amountIn: bigint) {
  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

  const { result } = await publicClient.simulateContract({
    address: QUOTER_ADDRESS,
    abi: quoterAbi,
    functionName: 'quoteExactInputSingle',
    args: [tokenIn, tokenOut, amountIn, BigInt(0)],
    account: ZAP_CONTRACT
  });

  const [amountOut, fee] = result;
  return amountOut;
}
