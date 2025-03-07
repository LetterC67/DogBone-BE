import {
  strategyFunctions,
  nameToTypeMapping,
  nameToConfigMapping
} from './listStrategies';
import {  SONIC_POINTS_APR } from './constants';

export async function getVaultAPR(strategyName: string): Promise<number> {
  console.log(nameToTypeMapping[strategyName] + " " + strategyName + " " + strategyFunctions[nameToTypeMapping[strategyName] as keyof typeof strategyFunctions]);
  const strategy = nameToTypeMapping[strategyName];
  if (!strategy) {
    throw new Error('Strategy not found');
  }

  const strategyFunction =
    strategyFunctions[strategy as keyof typeof strategyFunctions];
  const { vault } = nameToConfigMapping[strategyName];

  return strategyFunction.viewAPR(vault);
}

export function getVaultPointsAPR(strategyName: string) {
  const { points } = nameToConfigMapping[strategyName];
  return points * SONIC_POINTS_APR;
}

export async function getVaultTotalAPR(strategyName: string) {
  return (await getVaultAPR(strategyName)) + getVaultPointsAPR(strategyName);
}