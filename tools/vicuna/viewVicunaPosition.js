"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewVicunaPosition = viewVicunaPosition;
const viem_1 = require("viem");
const VicunaList_json_1 = __importDefault(require("./VicunaList.json"));
const aave_abi_json_1 = __importDefault(require("./aave.abi.json"));
const chains_1 = require("viem/chains");
const erc20Utils_1 = require("../utils/erc20Utils");
const aaveVaultList = JSON.parse(JSON.stringify(VicunaList_json_1.default));
const aaveAbi = JSON.parse(JSON.stringify(aave_abi_json_1.default));
const AAVE = '0xaa1C02a83362BcE106dFf6eB65282fE8B97A1665';
const MAX_UINT256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
async function viewVicunaPosition({ vaultAddress, userAddress, }) {
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
        console.log("Position: ", (0, viem_1.formatUnits)(amount, decimal));
        return (0, viem_1.formatUnits)(amount, decimal);
    }
    catch (error) {
        console.log("Position: ", 0);
        return 0;
    }
}
