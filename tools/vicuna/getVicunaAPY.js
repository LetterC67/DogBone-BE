"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVicunaAPY = getVicunaAPY;
const VicunaList_json_1 = __importDefault(require("./VicunaList.json"));
const aave_abi_json_1 = __importDefault(require("./aave.abi.json"));
const chains_1 = require("viem/chains");
const viem_1 = require("viem");
const aaveVaultList = JSON.parse(JSON.stringify(VicunaList_json_1.default));
const aaveAbi = JSON.parse(JSON.stringify(aave_abi_json_1.default));
const AAVE_DATA_PROVIDER = '0xc67850eCd0EC9dB4c0fD65C1Ad43a53025e6d54D';
async function getVicunaAPY(vaultAddress) {
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
    const getMerkleAPYList = await fetch("https://api.merkl.xyz/v4/opportunities?name=Vicuna&items=1000");
    const merkleAPYList = await getMerkleAPYList.json();
    const merkleAPY = merkleAPYList.find((item) => item.identifier === vaultConfig.identifier);
    console.log('Deposit APY: ', Number((0, viem_1.formatUnits)(contractCall[5], 25)) + merkleAPY.apr);
    return Number((0, viem_1.formatUnits)(contractCall[5], 25)) + merkleAPY.apr;
}
