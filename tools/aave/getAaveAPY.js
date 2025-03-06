"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAaveAPY = getAaveAPY;
const AaveList_json_1 = __importDefault(require("./AaveList.json"));
const aave_abi_json_1 = __importDefault(require("./aave.abi.json"));
const chains_1 = require("viem/chains");
const viem_1 = require("viem");
const aaveVaultList = JSON.parse(JSON.stringify(AaveList_json_1.default));
const aaveAbi = JSON.parse(JSON.stringify(aave_abi_json_1.default));
const AAVE_DATA_PROVIDER = '0x306c124fFba5f2Bc0BcAf40D249cf19D492440b9';
async function getAaveAPY(vaultAddress) {
    const vaultConfig = aaveVaultList.find((vault) => vault.vault === vaultAddress);
    if (!vaultConfig) {
        throw new Error('Aave vault either not found or not supported');
    }
    const publicClient = (0, viem_1.createPublicClient)({
        chain: chains_1.sonic,
        transport: (0, viem_1.http)()
    });
    const contractCall = await publicClient.readContract({
        address: AAVE_DATA_PROVIDER,
        abi: aaveAbi,
        functionName: 'getReserveData',
        args: [vaultConfig.token]
    });
    console.log('Deposit APY: ', Number((0, viem_1.formatUnits)(contractCall[5], 25)));
    return Number((0, viem_1.formatUnits)(contractCall[5], 25));
}
