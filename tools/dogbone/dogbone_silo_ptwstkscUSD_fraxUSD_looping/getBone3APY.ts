import { Address, createPublicClient, formatUnits, http, parseUnits } from "viem";
import { sonic } from "viem/chains";
import SiloLensAbi from "../../silo/abi/SiloLens.abi.json"
import { getLSTAPY } from "../../lst/getLSTAPY";
import { viewPendleAPY } from "../../pendle/viewPendleAPR";

const PT_VAULT: Address = '0x6e4e95fab7db1f0524b4b0a05f0b9c96380b7dfa';
const LEVERAGE: number = 6;
const SILO_VAULT: Address = '0x854475b78880767e246163031b5bE44f14426c26';
const TOKEN: Address = '0xBe27993204Ec64238F71A527B4c4D5F4949034C3';
const BORROW_VAULT: Address = '0xdA14A41DbdA731F03A94cb722191639DD22b35b2';
const SILO_LENS = '0xE05966aee69CeCD677a30f469812Ced650cE3b5E';

const siloLensAbi = JSON.parse(JSON.stringify(SiloLensAbi));

export async function getBone3APY() {
      const publicClient = createPublicClient({
        chain: sonic,
        transport: http(),
      });

    const ptAPY = await viewPendleAPY(PT_VAULT);

    const borrowAPR = (await publicClient.readContract({
        address: SILO_LENS,
        abi: siloLensAbi,
        functionName: 'getBorrowAPR',
        args: [BORROW_VAULT],
    })) as bigint;

    console.log("APY: ", ptAPY * LEVERAGE - Number(formatUnits(borrowAPR, 16)) * (LEVERAGE - 1));
    return ptAPY * LEVERAGE - Number(formatUnits(borrowAPR, 16)) * (LEVERAGE - 1);
}

export async function getBone3_DepositBorrowAPR() { 
  const publicClient = createPublicClient({
    chain: sonic,
    transport: http(),
  });

const ptAPY = await viewPendleAPY(PT_VAULT);

const borrowAPR = (await publicClient.readContract({
    address: SILO_LENS,
    abi: siloLensAbi,
    functionName: 'getBorrowAPR',
    args: [BORROW_VAULT],
})) as bigint;

return {
  depositAPR: BigInt(parseUnits(ptAPY.toString(), 16)),
  borrowAPR: borrowAPR,
}
}