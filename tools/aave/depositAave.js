"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositAave = depositAave;
const viem_1 = require("viem");
const AaveList_json_1 = __importDefault(require("./AaveList.json"));
const aave_abi_json_1 = __importDefault(require("./aave.abi.json"));
const chains_1 = require("viem/chains");
const erc20Utils_1 = require("../utils/erc20Utils");
const ethers_1 = require("ethers");
const aaveVaultList = JSON.parse(JSON.stringify(AaveList_json_1.default));
const aaveAbi = JSON.parse(JSON.stringify(aave_abi_json_1.default));
const AAVE = '0x5362dBb1e601abF3a4c14c22ffEdA64042E5eAA3';
async function depositAave({ walletClient, vaultAddress, amount, }) {
    const vaultConfig = aaveVaultList.find((vault) => vault.vault === vaultAddress);
    if (!vaultConfig) {
        throw new Error('Aave vault either not found or not supported');
    }
    if (walletClient.chainId.slice(7, walletClient.chainId.length) !==
        chains_1.sonic.id.toString()) {
        await walletClient.switchChain(chains_1.sonic.id);
    }
    const userAddr = walletClient.address;
    const provider = await walletClient.getEthereumProvider();
    const publicClient = (0, viem_1.createPublicClient)({
        chain: chains_1.sonic,
        transport: (0, viem_1.custom)(provider),
    });
    const parsedAmount = (0, ethers_1.parseUnits)(amount, await (0, erc20Utils_1.getERC20Decimals)({ publicClient, tokenAddress: vaultConfig.token }));
    const userBalance = await (0, erc20Utils_1.getERC20Balance)({
        publicClient,
        account: userAddr,
        tokenAddress: vaultConfig.token,
    });
    if (userBalance < parsedAmount) {
        throw new Error('Insufficient balance');
    }
    if (await (0, erc20Utils_1.checkNeedApproval)({
        publicClient,
        account: userAddr,
        tokenAddress: vaultConfig.token,
        spender: AAVE,
        amount: parsedAmount,
    })) {
        try {
            const approveTx = await (0, erc20Utils_1.approveERC20)({
                provider,
                tokenAddress: vaultConfig.token,
                spender: AAVE,
                amount: parsedAmount,
            });
            await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }
        catch (error) {
            throw new Error('Failed to approve token: ' + error);
        }
    }
    const transactionData = (0, viem_1.encodeFunctionData)({
        abi: aaveAbi,
        functionName: 'supply',
        args: [vaultConfig.token, parsedAmount, userAddr, BigInt(0)]
    });
    const transactionRequest = {
        to: AAVE,
        data: transactionData,
        value: BigInt(0)
    };
    try {
        const transactionHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [transactionRequest]
        });
        return transactionHash;
    }
    catch (error) {
        throw new Error('Failed to deposit Aave: ' + error);
    }
}
