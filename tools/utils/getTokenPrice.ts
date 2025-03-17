import { Address, createPublicClient, http, parseUnits, PublicClient, formatUnits } from "viem";
import TokenList from "../tokenList.json";
import { mainnet, arbitrum, polygon, bsc, base, sonic, optimism } from "viem/chains";
import { getOdosSwapQuote } from "../swap/odos";
import { getERC20Decimals } from "./erc20Utils";
import { getPricePendle } from "../pendle/depositPendle";

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
const SOLV_BTC_BBN = "0xCC0966D8418d412c599A6421b760a847eB169A8c" as Address;
const SOLV_BTC = "0x541FD749419CA806a8bc7da8ac23D346f2dF8B77" as Address;
const WSTK_SCUSD = "0x9fb76f7ce5fceaa2c42887ff441d46095e494206" as Address;
const WSTK_SCETH = "0xe8a41c62bb4d5863c6eadc96792cfe90a1f37c47" as Address;
const SCUSD = "0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE" as Address;
const SCETH = "0x3bcE5CB273F0F148010BbEa2470e7b5df84C7812" as Address;
const OPTIMISM_USDCE = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" as Address;
const PT_WSTKSCUSD = "0xbe27993204ec64238f71a527b4c4d5f4949034c3" as Address;
const PT_STS = "0x420df605d062f8611efb3f203bf258159b8fffde" as Address;


// Create a mapping between chain id and its stablecoin
const stablecoinMapping: Record<number, Address> = {
    1: ETH_USDT,
    42161: ARB_USDT,
    137: POLYGON_USDT,
    56: BSC_USDT,
    8453: BASE_USDC,
    146: SONIC_USDC,
    10: OPTIMISM_USDCE
}

// create a mapping betwwen chain id and its viem config
const chainMapping = {
    1: mainnet,
    42161: arbitrum,
    137: polygon,
    56: bsc,
    8453: base,
    146: sonic,
    10: optimism
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
    console.log("?????????????????????");
    console.log(token);
    console.log(stablecoinMapping[chainId]);
    if (token === stablecoinMapping[chainId]) {
        console.log("?????????????????????");
        console.log(token);
        console.log(stablecoinMapping[chainId]);
        return String(1);
    }

    if (token == SOLV_BTC || token == SOLV_BTC_BBN) {
        const getQuote = await getOdosSwapQuote({
            receiver: "0x4393B9f79ab8E2e683F693E8aAD971814bf0d572",
            chainId: 1,
            tokenIn: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
            tokenOut: stablecoinMapping[1],
            amountIn: parseUnits("1", 8)
        });

        return String(getQuote.outValues[0]);
    }
    else if (token == PT_STS || token == PT_WSTKSCUSD) {
        let PT_VAULT: Address = '0x3aef1d372d0a7a7e482f465bc14a42d78f920392';
        if (token == PT_WSTKSCUSD) PT_VAULT = "0x6e4e95fab7db1f0524b4b0a05f0b9c96380b7dfa";
        else PT_VAULT = '0x3aef1d372d0a7a7e482f465bc14a42d78f920392';

        console.log("TOKENRKENR?  ???: ", token);
        return formatUnits(await getPricePendle(PT_VAULT, parseUnits('1', token === PT_STS ? 18 : 6)), 6);
    }

    if (token == WSTK_SCUSD) {
        token = SCUSD;
    }

    if (token == WSTK_SCETH) {
        token = SCETH;
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