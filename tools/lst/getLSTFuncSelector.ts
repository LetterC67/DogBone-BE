import { Address, toFunctionSelector } from "viem";

const STS_VAULT: Address = "0xE5DA20F15420aD15DE0fa650600aFc998bbE3955";
const OS_VAULT: Address = "0xe25A2B256ffb3AD73678d5e80DE8d2F6022fAb21";
export async function getLSTFuncSelector(vaultAddress: Address) {
    if (vaultAddress === STS_VAULT) {
        return toFunctionSelector('function depositStS(address vault, address token, address receiver, uint256 amount)');
    }
    else if (vaultAddress === OS_VAULT) {
        return toFunctionSelector('function depositOS(address vault, address, address receiver, uint256 amount)');
    }
    else {
        return toFunctionSelector('function depositANS(address vault, address, address receiver, uint256 amount)');
    }
}