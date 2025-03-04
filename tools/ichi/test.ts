import { Address, createPublicClient, http } from "viem";
import TokenList from "../tokenList.json";
import IchiVaultList from "./ichiVaultList.json"
import IchiGaugeAbi from "./ichiGauge.abi.json"
import IchiVaultAbi from "./ichiVault.abi.json"
import { sonic } from "viem/chains";

const tokenList = JSON.parse(JSON.stringify(TokenList));
const ichiVaultList: IchiVaultConfig[] = JSON.parse(JSON.stringify(IchiVaultList));

interface IchiVaultConfig {
  vault: Address;
  token: Address;
  gauge: Address;
  tokenPosition: number;
}

interface TokenConfig {
    name: string;
    symbol: string;
    address: Address;
    chainId: number;
}


export function dak() {
    const list = []
    const ap = []
    ichiVaultList.map((vault: IchiVaultConfig) => {
        const token = tokenList.tokens.find((token: TokenConfig) => token.address.toLowerCase() === vault.token.toLowerCase());
    
        if (!token) {
            if (!list.includes(vault.token)) list.push(vault.token)
            
            console.log(`Token ${vault.token} not found`);
        } else {
            ap.push(vault)
        }
    });

    console.log(list);
    console.log(ap)
}

const ichiGaugeAbi = JSON.parse(JSON.stringify(IchiGaugeAbi));
const ichiVaultAbi = JSON.parse(JSON.stringify(IchiVaultAbi));

export async function dakmim() {
    const publicClient = createPublicClient({
        chain: sonic,
        transport: http(),
    });
    const list = []
    for (const vault of ichiVaultList) {
        const tokenIn = tokenList.tokens.find((token: TokenConfig) => token.address.toLowerCase() === vault.token.toLowerCase());
        let tokenDak;
        if (vault.tokenPosition == 0) {
            tokenDak = await publicClient.readContract({
                address: vault.vault,
                abi: ichiVaultAbi,
                functionName: "token1",
                args: []
            }) as Address;
        } else {
            tokenDak = await publicClient.readContract({
                address: vault.vault,
                abi: ichiVaultAbi,
                functionName: "token0",
                args: []
            }) as Address;
        }

        const tokenDakConfig = tokenList.tokens.find((token: TokenConfig) => token.address.toLowerCase() === tokenDak.toLowerCase());
        if (tokenDakConfig) {
            list.push({
                name: `SWAPX Ichi ${tokenIn.symbol}-${tokenDakConfig.symbol} (${tokenIn.symbol} deposit)`,
                vault: vault.vault,
                token: vault.token,
                gauge: vault.gauge
            });
        }

    };

    console.log(list)
    
}