import { Address } from 'viem';

export async function getSonicPoints(userAddress: Address) {
  const URL = `https://www.data-openblocklabs.com/sonic/user-points-stats?wallet_address=${userAddress}`;

  const response = await fetch(URL);

  if (!response) {
    return 0;
  }

  const data = await response.json();
  console.log('User Sonic Points: ', Number(data.sonic_points).toFixed(2));
  return Number(data.sonic_points).toFixed(2);
}
