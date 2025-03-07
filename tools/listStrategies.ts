import { Address } from 'viem';
import { getBeefyIchiAPR } from './beefy/getBeefyIchiAPR';
import { getIchiAPR } from './ichi/getIchiAPR';
import { getLSTAPY } from './lst/getLSTAPY';
import { getMachFiAPR } from './machfi/getMachFiAPR';
import { getSiloAPR } from './silo/getSiloAPR';
import strategies from './strategies.json';
import { getLTokenAPY } from './yel/getLTokenAPY';;
import { viewRingsAPR } from './rings/viewRingsAPR';
import { NATIVE_TOKEN } from './constants';
import { getBone1APY } from './dogbone/dogbone_silo_st_s_st_looping/getBone1APY';
import { getBone2APY } from './dogbone/dogbone_silo_wos_s_wos_looping/getBone2APY';
import { viewPendleAPY } from './pendle/viewPendleAPR';
import { getAaveAPY } from './aave/getAaveAPY';
import { getVicunaAPY } from './vicuna/getVicunaAPY';

export const notLeveraged = (strategy: string, amount: string) => {
  return {
    leverage: BigInt(0),
    flashAmount: BigInt(0),
    isProtected: false,
    swapFlashloan: {
      fromToken: NATIVE_TOKEN,
      fromAmount: BigInt(0),
      router: NATIVE_TOKEN,
      data: NATIVE_TOKEN,
      value: BigInt(0)
    }
  };
}

export const strategyFunctions = {
  beefy: {
    viewAPR: getBeefyIchiAPR,
    leverage: notLeveraged
  },
  ichi: {
    viewAPR: getIchiAPR,
    leverage: notLeveraged
  },
  beets: {
    viewAPR: getLSTAPY,
    leverage: notLeveraged,
  },
  origin: {
    viewAPR: getLSTAPY,
    leverage: notLeveraged,
  },
  ans: {
    viewAPR: getLSTAPY,
    leverage: notLeveraged,
  },
  MachFi: {
    viewAPR: getMachFiAPR,
    leverage: notLeveraged
  },
  rings: {
    viewAPR: viewRingsAPR,
    leverage: notLeveraged
  },
  silo: {
    viewAPR: getSiloAPR,
    leverage: notLeveraged
  },
  yel: {
    viewAPR: getLTokenAPY,
    leverage: notLeveraged
  },
  Bone1: {
    viewAPR: getBone1APY,
    leverage: notLeveraged
  },
  Bone2: {
    viewAPR: getBone2APY,
    leverage: notLeveraged
  },
  pendle: {
    viewAPR: viewPendleAPY,
    leverage: notLeveraged
  },
  aave: {
    viewAPR: getAaveAPY,
    leverage: notLeveraged
  },
  vicuna: {
    viewAPR: getVicunaAPY,
    leverage: notLeveraged
  }
};

export const nameToTypeMapping: Record<string, string> = {};

strategies.forEach((strat) => {
  strat.lists.forEach((item: { name?: string }) => {
    if (item.name) {
      nameToTypeMapping[item.name] = strat.type;
    }
  });
});

// Also add name to strategy config mapping
export const nameToConfigMapping: Record<
  string,
  { vault: Address; token: Address, points: number }
> = {};

strategies.forEach((strat) => {
  strat.lists.forEach(
    (item: { name: string; vault: string; token: string; points: number }) => {
      if (item.name) {
        nameToConfigMapping[item.name] = {
          vault: item.vault as Address,
          token: item.token as Address,
          points: item.points
        };
      }
    }
  );
});
