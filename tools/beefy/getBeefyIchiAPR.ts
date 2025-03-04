import { Address } from 'viem';
import BeefyIchiLPList from './beefyIchiLPList.json';

interface BeefyIchiLPConfig {
  name: string;
  vault: Address;
  lpToken: Address;
  token: Address;
}

const beefyIchiLPList = JSON.parse(JSON.stringify(BeefyIchiLPList));

export async function getBeefyIchiAPR(vaultAddress: Address) {
  const beefyLPConfig = beefyIchiLPList.find(
    (lst: BeefyIchiLPConfig) => lst.vault === vaultAddress
  );

  if (!beefyLPConfig) {
    throw new Error('Beefy Ichi LP either not found or not supported');
  }

  const URL = 'https://api.beefy.finance/apy';
  const response = await fetch(URL);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("APY: ", data[beefyLPConfig.name] * 100);
  return Number(data[beefyLPConfig.name]) * 100;
}
