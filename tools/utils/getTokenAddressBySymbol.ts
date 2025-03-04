import { Address } from 'viem';
import TokenList from '../tokenList.json';

const tokenList = JSON.parse(JSON.stringify(TokenList));

interface TokenConfig {
  name: string;
  symbol: string;
  address: Address;
  chainId: number;
}

const t = TokenList.tokens.filter((token) => (token.chainId == 146));
let p = "";
for (const x of t) {
  p += x.name + " " + x.symbol + "\n";
}
console.log(p);

export function getTokenAddressBySymbol(tokenName: string, chainId: number) {
  const token = tokenList.tokens.find(
    (token: TokenConfig) =>
      (token.symbol === tokenName || token.address === tokenName || token.name == tokenName) && token.chainId === chainId
  );

  if (!token) {
    return null;
  }

  return token.address;
}
