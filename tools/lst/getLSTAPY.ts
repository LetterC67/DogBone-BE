import { Address } from 'viem';
import LSTList from './lstList.json';

const lstList = JSON.parse(JSON.stringify(LSTList));

interface LstConfig {
  name: string;
  vault: Address;
}

export async function getLSTAPY(vaultAddress: Address) {
  const lstConfig = lstList.find(
    (lst: LstConfig) => lst.vault === vaultAddress
  );
  if (!lstConfig) {
    throw new Error('LST either not found or not supported');
  }

  if (lstConfig.name === 'stS') {
    return await getBeetsSTSAPY();
  } else if (lstConfig.name === 'OS') {
    return await getOriginOSAPY();
  } else if (lstConfig.name === 'ANS') {
    return await getAngelsANSAPY();
  }
}

async function getBeetsSTSAPY() {
  const query = `
    query {
      stsGetGqlStakedSonicData {
        stakingApr
      }
    }
  `;

  const response = await fetch('https://backend-v3.beets-ftm-node.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return Number(data.data.stsGetGqlStakedSonicData.stakingApr) * 100;
}

async function getOriginOSAPY() {
  const URL = 'https://api.originprotocol.com/api/v2/os/apr/trailing/14';
  const response = await fetch(URL);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return Number(data.apy);
}

async function getAngelsANSAPY() {
  const URL = 'https://be.angles.fi/api/v2/angles/apr/trailing/7';

  const response = await fetch(URL);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return Number(data.apy);
}