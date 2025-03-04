import { Address } from 'viem';

// get api key from .env
const apiKey = import.meta.env.VITE_COINGECKO_API_KEY || '';

export async function getTokenPriceByAddresses(tokenAddresses: Address[]) {
  const url =
    'https://api.coingecko.com/api/v3/simple/token_price/sonic?contract_addresses=' +
    tokenAddresses.join('%2C') +
    '&vs_currencies=usd';
  console.log(url);
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', 'x-cg-demo-api-key': apiKey },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return tokenAddresses.map((address) => data[address.toLowerCase()]?.usd);
}

export async function getTokenPriceByAddressesAndChain(tokenAddresses: Address[], chain: string) {
  const url =
    `https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=` +
    tokenAddresses.join('%2C') +
    '&vs_currencies=usd';
  console.log(url);
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', 'x-cg-demo-api-key': apiKey },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return tokenAddresses.map((address) => data[address.toLowerCase()]?.usd);
}