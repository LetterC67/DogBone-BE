
import { Address, createPublicClient, http } from "viem";
import IchiGaugeAbi from "./ichiGauge.abi.json"
import IchiVaultAbi from "./ichiVault.abi.json"
import { sonic } from "viem/chains";
import { getIchiTVL } from "./getIchiAPR.ts";

const ichiGaugeAbi = JSON.parse(JSON.stringify(IchiGaugeAbi));
const ichiVaultAbi = JSON.parse(JSON.stringify(IchiVaultAbi));

const GAUGE_FACTORY = "0x0326Bc059CbeeEd569f285Fdeb7365ff6369b120";

const gaugeFactoryAbi = [
    // have a single function gauges that returns address array
    {
        "inputs":[],
        "name":"gauges",
        "outputs":[{
            "internalType":"address[]",
            "name":"",
            "type":"address[]"
        }],
        "stateMutability":"view",
        "type":"function"
    }
]

export async function generateIchiGauge() {
    const publicClient = createPublicClient({
        chain: sonic,
        transport: http(),
    });

    const listGauge = await publicClient.readContract({
        address: GAUGE_FACTORY,
        abi: gaugeFactoryAbi,
        functionName: "gauges",
        args: []
    }) as Address[];

    const vaultList = []
    let cnt = 0
    for (const gauge of listGauge) {
        ++cnt;
        console.log("Cnt: ", cnt);
        const ichiVault = await publicClient.readContract({
            address: gauge,
            abi: ichiGaugeAbi,
            functionName: "TOKEN",
            args: []
        }) as Address;

        const token0 = await publicClient.readContract({
            address: ichiVault,
            abi: ichiVaultAbi,
            functionName: "token0",
            args: []
        });

        const token1 = await publicClient.readContract({
            address: ichiVault,
            abi: ichiVaultAbi,
            functionName: "token1",
            args: []
        });

        const allowToken0 = await publicClient.readContract({
            address: ichiVault,
            abi: ichiVaultAbi,
            functionName: "allowToken0",
            args: []
        });
        
        try {
            const tvl = await getIchiTVL(ichiVault);
            console.log("Ichi Vault: %s TVL is: %s", ichiVault, await getIchiTVL(ichiVault));

            if (tvl < 50000) {
                continue;
            }

            if (allowToken0) {
                vaultList.push({
                    vault: ichiVault,
                    gauge: gauge,
                    token: token0,
                    tokenPosition: 0
                });
            } else {
                vaultList.push({
                    vault: ichiVault,
                    gauge: gauge,
                    token: token1,
                    tokenPosition: 1
                });
            }
        } catch (error) {
            console.log("Error: ", error);
            continue;
        }
    }

    console.log("Vault List: ", vaultList);
}