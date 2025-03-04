import { Address, createPublicClient, formatUnits, http } from 'viem';
import LTokenList from './LTokenList.json';
import LTokenAbi from './LToken.abi.json';
import { sonic } from 'viem/chains';
import { getERC20Balance, getERC20Decimals } from '../utils/erc20Utils';

interface LTokenConfig {
  name: string;
  vault: Address;
  token: Address;
}

interface ViewLTokenPositionArgs {
  vaultAddress: Address;
  userAddress: Address;
}

const lTokenList = JSON.parse(JSON.stringify(LTokenList));
const lTokenAbi = JSON.parse(JSON.stringify(LTokenAbi));
const FIXED_POINT_Q96 = BigInt('79228162514264337593543950336');
const DEN = BigInt(10000);

export async function viewLTokenPosition({
  vaultAddress,
  userAddress,
}: ViewLTokenPositionArgs) {
  const lConfig = lTokenList.find(
    (l: LTokenConfig) => l.vault === vaultAddress
  );
  if (!lConfig) {
    throw new Error('LToken either not found or not supported');
  }

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

  const lTokenContract = {
    address: vaultAddress,
    abi: lTokenAbi,
  } as const;

  const results = await publicClient.multicall({
    contracts: [
      {
        ...lTokenContract,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        ...lTokenContract,
        functionName: 'totalSupply',
        args: [],
      },
      {
        ...lTokenContract,
        functionName: 'DEBOND_FEE',
        args: [],
      },
    ],
  });

  const userShareBalance = results[0].result as bigint;
  const vaultSupply = results[1].result as bigint;
  const debondFee = results[2].result as bigint;

  const vaultBalance = (await getERC20Balance({
    publicClient,
    account: vaultAddress,
    tokenAddress: lConfig.token,
  })) as bigint;

  const perc =
    (((userShareBalance * (DEN - debondFee)) / DEN) * FIXED_POINT_Q96) /
    vaultSupply;
  const userUnderlyingBalance = (vaultBalance * perc) / FIXED_POINT_Q96;

  const formattedUserUnderlyingBalance = formatUnits(
    userUnderlyingBalance,
    await getERC20Decimals({
      publicClient,
      tokenAddress: lConfig.token,
    })
  );

  console.log('User LToken Position: ', formattedUserUnderlyingBalance);

  return formattedUserUnderlyingBalance;
}
