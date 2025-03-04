import { Address, toFunctionSelector } from "viem";

export async function getRingsFuncSelector(vaultAddress: Address) {
    const selector = toFunctionSelector('function depositRings(address vault, address token, address receiver, uint256 amount)');
    return selector;
}