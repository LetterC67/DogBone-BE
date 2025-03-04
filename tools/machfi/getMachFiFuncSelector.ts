import { Address, toFunctionSelector } from "viem";

export async function getMachFiFuncSelector(vaultAddress: Address) {
    const selector = toFunctionSelector('function depositMachFi(address vault, address token, address receiver, uint256 amount)');
    return selector;
}