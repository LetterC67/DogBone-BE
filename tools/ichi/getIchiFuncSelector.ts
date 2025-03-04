import { Address, toFunctionSelector } from "viem";

export async function getIchiFuncSelector(vaultAddress: Address) {
    const selector = toFunctionSelector('function depositIchi(address vault, address token, address receiver, uint256 amount)');
    return selector;
}