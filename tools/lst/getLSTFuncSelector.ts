import { Address, toFunctionSelector } from "viem";

const STS_VAULT: Address = "0xE5DA20F15420aD15DE0fa650600aFc998bbE3955";

export async function getLSTFuncSelector(vaultAddress: Address) {
    if (vaultAddress === STS_VAULT) {
        return toFunctionSelector('function depositStS(address vault, address token, address receiver, uint256 amount)');
    }
    return toFunctionSelector('function depositOS(address vault, address, address receiver, uint256 amount)');
}