"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewAavePosition = viewAavePosition;
const viem_1 = require("viem");
const AaveList_json_1 = __importDefault(require("./AaveList.json"));
const aave_abi_json_1 = __importDefault(require("./aave.abi.json"));
const chains_1 = require("viem/chains");
const erc20Utils_1 = require("../utils/erc20Utils");
const aaveVaultList = JSON.parse(JSON.stringify(AaveList_json_1.default));
const aaveAbi = JSON.parse(JSON.stringify(aave_abi_json_1.default));
const AAVE = '0x5362dBb1e601abF3a4c14c22ffEdA64042E5eAA3';
const MAX_UINT256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
async function viewAavePosition({ vaultAddress, userAddress, }) {
    const vaultConfig = aaveVaultList.find((vault) => vault.vault === vaultAddress);
    if (!vaultConfig) {
        throw new Error('Aave vault either not found or not supported');
    }
    const publicClient = (0, viem_1.createPublicClient)({
        chain: chains_1.sonic,
        transport: (0, viem_1.http)()
    });
    try {
        const { result } = await publicClient.simulateContract({
            address: AAVE,
            abi: aaveAbi,
            functionName: 'withdraw',
            args: [vaultConfig.token, MAX_UINT256, userAddress],
            account: userAddress,
        });
        const amount = result;
        const decimal = await (0, erc20Utils_1.getERC20Decimals)({
            publicClient,
            tokenAddress: vaultConfig.token
        });
        return (0, viem_1.formatUnits)(amount, decimal);
    }
    catch (error) {
        return 0;
    }
}
