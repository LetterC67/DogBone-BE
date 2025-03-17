import express, { Request, Response } from 'express';
import { getVaultAPR, getVaultPointsAPR } from './tools/ToolAPI';
import Strategies from './tools/strategies.json';
import Providers from './tools/providers.json';
import sampleToTokens from './tools/sampleToTokens.json';
import { getBone1_DepositBorrowAPR } from './tools/dogbone/dogbone_silo_st_s_st_looping/getBone1APY';
import { getBone2_DepositBorrowAPR } from './tools/dogbone/dogbone_silo_wos_s_wos_looping/getBone2APY';

const app = express();
const cors = require('cors');
app.use(cors());
const PORT = 3000;

interface APRData {
  type: string;
  name: string;
  vault: string;
  token: any;
  apr: number;
  point_apr: number;
  provider: any;
  risk: string;
  defaultLeverage: number;
  borrowAPR: string;
  depositAPR: string;
}

let cachedAPRData: APRData[] = [];
let lastUpdated: Date | null = null;

async function fetchApr(
  type: string,
  address: string,
  name: string,
  provider: any,
  strategy: any,
  risk: string,
  defaultLeverage: number = 0
): Promise<APRData> {
  let apr = 0, point_apr = 0, depositBorrowAPR = null;

  try {
    apr = await getVaultAPR(name);
    point_apr = getVaultPointsAPR(name);
  } catch (error) {
    console.error(`Error fetching APR for ${name}:`, error);
  }

  try {
    if (provider.type === "Bone1") {
      depositBorrowAPR = await getBone1_DepositBorrowAPR();
    } else if (provider.type  === 'Bone2') {
      depositBorrowAPR = await getBone2_DepositBorrowAPR();
    }
    if (depositBorrowAPR != null)
    console.log(`Deposit APR: ${depositBorrowAPR.depositAPR}, Borrow APR: ${depositBorrowAPR.borrowAPR}`);
  } catch (error) {
    console.error(`Error fetching depositBorrowAPR for ${name}:`, error);
  }

  return {
    type,
    name: strategy.name,
    vault: strategy.vault,
    token: sampleToTokens.find(
      (token) => token.address.toLowerCase() === address.toLowerCase()
    ),
    apr,
    point_apr,
    provider: Providers.find((p) => p.name === provider.type),
    defaultLeverage: defaultLeverage,
    risk: risk,
    borrowAPR: depositBorrowAPR != null ? depositBorrowAPR.borrowAPR.toString() : "0",
    depositAPR: depositBorrowAPR != null ? depositBorrowAPR.depositAPR.toString() : "0"
  };
}

async function fetchAPRData() {
  const promises: Promise<APRData>[] = [];

  for (const provider of Strategies) {
    for (const strategy of provider.lists) {
      promises.push(fetchApr(provider.type, strategy.token, strategy.name, provider, strategy, provider.risk, 'defaultLeverage' in strategy ? strategy.defaultLeverage : 0));
    }
  }

  try {
    cachedAPRData = await Promise.all(promises);
    lastUpdated = new Date();
    console.log(`✅ APR data updated at ${lastUpdated}`);
    //console.log(cachedAPRData);
  } catch (error) {
    console.error('❌ Error updating APR data:', error);
  }
}

fetchAPRData();
setInterval(fetchAPRData, 5 * 60 * 1000);

// Routes to get APR data
app.get('/apr', async (req: Request, res: Response) => {
  res.json({
    lastUpdated,
    data: cachedAPRData
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
