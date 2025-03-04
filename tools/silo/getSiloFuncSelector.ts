import { Address, toFunctionSelector } from "viem";

export async function getSiloFuncSelector(vaultAddress: Address) {
    const selector = toFunctionSelector('function depositSilo(address vault, address token, address receiver, uint256 amount)');
    return selector;
}