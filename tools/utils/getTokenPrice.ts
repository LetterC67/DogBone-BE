import { Address, createPublicClient, http, parseUnits, PublicClient } from "viem";
import TokenList from "../tokenList.json";
import { mainnet, arbitrum, polygon, bsc, base, sonic } from "viem/chains";
import { getOdosSwapQuote } from "../swap/odos";
import { getERC20Decimals } from "./erc20Utils";

interface TokenConfig {
    name: string;
    symbol: string;
    address: Address;
    chainId: number;
}

const ETH_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address;
const ARB_USDT = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as Address;
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;
const POLYGON_USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as Address;
const BSC_USDT = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as Address;
const SONIC_USDC = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894" as Address;

// Create a mapping between chain id and its stablecoin
const stablecoinMapping: Record<number, Address> = {
    1: ETH_USDT,
    42161: ARB_USDT,
    137: POLYGON_USDT,
    56: BSC_USDT,
    8453: BASE_USDC,
    146: SONIC_USDC
}

// create a mapping betwwen chain id and its viem config
const chainMapping = {
    1: mainnet,
    42161: arbitrum,
    137: polygon,
    56: bsc,
    8453: base,
    146: sonic
}


const tokenList = JSON.parse(JSON.stringify(TokenList))


export async function getTokenPriceBySymbol(tokenSymbol: string) {
    const token = tokenList.tokens.find((token: TokenConfig) => token.symbol === tokenSymbol);
    
    if (!token) {
        throw new Error(`Token ${tokenSymbol} not found`);
    }

    return await getTokenPriceByAddress(token.address, token.chainId);  
}

export async function getTokenPriceByAddress(token: Address, chainId: number) {
    if (token === stablecoinMapping[chainId]) {
        return String(1);
    }

    const publicClient = createPublicClient({
        chain: chainMapping[chainId as keyof typeof chainMapping],
        transport: http()
    }) as PublicClient;

    const decimal = await getERC20Decimals({publicClient, tokenAddress: token});

    const parsedAmount = parseUnits("1", decimal);

    const getQuote = await getOdosSwapQuote({
        receiver: "0x4393B9f79ab8E2e683F693E8aAD971814bf0d572",
        chainId: chainId,
        tokenIn: token,
        tokenOut: stablecoinMapping[chainId],  
        amountIn: parsedAmount
    });
    
    return String(getQuote.outValues[0]);
}


export async function getTokenPriceByAddresses(tokenAddresses: Address[], chainId: number) {
    const result = [];
    for (const address of tokenAddresses) {
        result.push(await getTokenPriceByAddress(address, chainId));
    }
    return result;
}