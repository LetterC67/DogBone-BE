import { Address, createPublicClient, formatUnits, http, parseUnits } from "viem";
import { sonic } from "viem/chains";
import SiloLensAbi from "../../silo/abi/SiloLens.abi.json"
import { getLSTAPY } from "../../lst/getLSTAPY";
import { viewPendleAPY } from "../../pendle/viewPendleAPR";

const LEVERAGE: number = 10;
const PT_VAULT: Address = '0x4e82347bc41cfd5d62cef483c7f0a739a8158963';
const SILO_VAULT: Address = '0x7dB82f430f333Ac5D93963e0a93FAfEF7061F998';
// const SILO_CONFIG: Address = "0x78C246f67c8A6cE03a1d894d4Cf68004Bd55Deea";
const TOKEN: Address = '0x46eb02b9F47634c4fab3110CC7ADc1C6311DfAC1';
const BORROW_VAULT: Address = '0xE75B0B3d24B988Ada7136F6b8D491b727c36c27F';
const SILO_LENS = '0xE05966aee69CeCD677a30f469812Ced650cE3b5E';

const siloLensAbi = JSON.parse(JSON.stringify(SiloLensAbi));

export async function getBone6APY() {
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

export async function getBone6LeverageAPY({
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

export async function getBone6_DepositBorrowAPR() { 
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