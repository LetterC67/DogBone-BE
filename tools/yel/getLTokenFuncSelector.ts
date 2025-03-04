import { Address, toFunctionSelector } from "viem";

export async function getLTokenFuncSelector(vaultAddress: Address) {
    const selector = toFunctionSelector('function depositYels(address vault, address token, address receiver, uint256 amount)');
    return selector;
}