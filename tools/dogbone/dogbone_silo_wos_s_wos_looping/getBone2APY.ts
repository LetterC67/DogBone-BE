import { Address, createPublicClient, formatUnits, http, parseUnits } from "viem";
import { sonic } from "viem/chains";
import SiloLensAbi from "../../silo/abi/SiloLens.abi.json"
import { getLSTAPY } from "../../lst/getLSTAPY";

const LEVERAGE: bigint = BigInt(9);
const SILO_VAULT: Address = '0x1d7E3726aFEc5088e11438258193A199F9D5Ba93';
const OS_VAULT: Address = '0xe25A2B256ffb3AD73678d5e80DE8d2F6022fAb21';
const BORROW_VAULT: Address = '0x112380065A2cb73A5A429d9Ba7368cc5e8434595';
const SILO_LENS = '0xE05966aee69CeCD677a30f469812Ced650cE3b5E';

const siloLensAbi = JSON.parse(JSON.stringify(SiloLensAbi));

export async function getBone2APY() {
      const publicClient = createPublicClient({
        chain: sonic,
        transport: http(),
      });
    const depositAPR = (await publicClient.readContract({
        address: SILO_LENS,
        abi: siloLensAbi,
        functionName: 'getDepositAPR',
        args: [SILO_VAULT],
      })) as bigint;

      console.log("deposit APR: ", formatUnits(depositAPR, 16));

    const wOSAPR = parseUnits((await getLSTAPY(OS_VAULT)).toString(), 16);
    console.log("wOS APR: ", formatUnits(wOSAPR, 16));

    const borrowAPR = (await publicClient.readContract({
        address: SILO_LENS,
        abi: siloLensAbi,
        functionName: 'getBorrowAPR',
        args: [BORROW_VAULT],
    })) as bigint;

    return Number(formatUnits((depositAPR + wOSAPR) * LEVERAGE - borrowAPR * (LEVERAGE - BigInt(1)), 16));
}