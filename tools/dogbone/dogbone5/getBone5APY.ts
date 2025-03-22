import { Address, createPublicClient, formatUnits, http, parseUnits } from "viem";
import { sonic } from "viem/chains";
import SiloLensAbi from "../../silo/abi/SiloLens.abi.json"
import { getLSTAPY } from "../../lst/getLSTAPY";
import { viewPendleAPY } from "../../pendle/viewPendleAPR";

const PT_VAULT: Address = '0x3f5ea53d1160177445b1898afbb16da111182418';
const LEVERAGE: number = 12;
const SILO_VAULT: Address = '0x558d6D6D53270ae8ba622daF123983D9F3c21792';
const TOKEN: Address = '0x930441Aa7Ab17654dF5663781CA0C02CC17e6643';
const BORROW_VAULT: Address = '0xe6605932e4a686534D19005BB9dB0FBA1F101272';
const SILO_LENS = '0xE05966aee69CeCD677a30f469812Ced650cE3b5E';

const siloLensAbi = JSON.parse(JSON.stringify(SiloLensAbi));

export async function getBone5APY() {
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

export async function getBone5LeverageAPY({
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

export async function getBone5_DepositBorrowAPR() { 
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