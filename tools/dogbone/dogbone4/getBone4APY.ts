import { Address, createPublicClient, formatUnits, http, parseUnits } from "viem";
import { sonic } from "viem/chains";
import SiloLensAbi from "../../silo/abi/SiloLens.abi.json"
import { getLSTAPY } from "../../lst/getLSTAPY";
import { viewPendleAPY } from "../../pendle/viewPendleAPR";

const PT_VAULT: Address = '0x3aef1d372d0a7a7e482f465bc14a42d78f920392';
const LEVERAGE: number = 10;
const SILO_VAULT: Address = '0x058766008d237faF3B05eeEebABc73C64d677bAE';
const TOKEN: Address = '0x420df605D062F8611EFb3F203BF258159b8FfFdE';
const BORROW_VAULT: Address = '0x24F7692af5231d559219d07c65276Ad8C8ceE9A3';
const SILO_LENS = '0xE05966aee69CeCD677a30f469812Ced650cE3b5E';

const siloLensAbi = JSON.parse(JSON.stringify(SiloLensAbi));

export async function getBone4APY() {
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

export async function getBone3LeverageAPY({
  depositAPR,
  borrowAPR,
  leverage
}: {
  depositAPR: bigint;
  borrowAPR: bigint;
  leverage: number;
}) {
  return Number(formatUnits(depositAPR, 16)) * leverage - Number(formatUnits(borrowAPR, 16)) * (leverage - 1);
}