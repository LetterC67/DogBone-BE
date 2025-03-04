import { Address, createPublicClient, formatUnits, http, PublicClient } from "viem";
import { mainnet, arbitrum, polygon, bsc, base, sonic } from "viem/chains";
import { getERC20Balance, getERC20Decimals } from "./erc20Utils";
// create a mapping betwwen chain id and its viem config
const chainMapping = {
    1: mainnet,
    42161: arbitrum,
    137: polygon,
    56: bsc,
    8453: base,
    146: sonic
}

export async function getTokenBalance(chainId: number, tokenAddress: Address, userAddress: Address) {
    const publicClient = createPublicClient({
        chain: chainMapping[chainId as keyof typeof chainMapping],
        transport: http()
    }) as PublicClient;

    const decimals = await getERC20Decimals({publicClient, tokenAddress});
    const balance = await getERC20Balance({publicClient, account: userAddress, tokenAddress});
    return formatUnits(balance, decimals);
}
