import { Address, formatUnits } from 'viem';

export async function getRingsPoints(userAddress: Address) {
  const URL = `https://points-api.rings.money/points/${userAddress}`;

  const response = await fetch(URL);

  if (!response) {
    return 0;
  }

  const data = await response.json();
  console.log("User Rings Points: ", formatUnits(BigInt(data.total), 36));
  return formatUnits(BigInt(data.total), 36);
}
