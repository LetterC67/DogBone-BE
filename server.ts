import express, { Request, Response } from 'express';
import { getVaultAPR, getVaultPointsAPR } from './tools/ToolAPI';
import Strategies from './tools/strategies.json';
import Providers from './tools/providers.json';
import sampleToTokens from './tools/sampleToTokens.json';

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
}

let cachedAPRData: APRData[] = [];
let lastUpdated: Date | null = null;

async function fetchApr(
  type: string,
  address: string,
  name: string,
  provider: any,
  strategy: any
): Promise<APRData> {
  let apr = 0, point_apr = 0;

  try {
    apr = await getVaultAPR(name);
    point_apr = getVaultPointsAPR(name);
  } catch (error) {
    console.error(`Error fetching APR for ${name}:`, error);
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
    provider: Providers.find((p) => p.name === provider.type)
  };
}

async function fetchAPRData() {
  const promises: Promise<APRData>[] = [];

  for (const provider of Strategies) {
    for (const strategy of provider.lists) {
      promises.push(fetchApr(provider.type, strategy.token, strategy.name, provider, strategy));
    }
  }

  try {
    cachedAPRData = await Promise.all(promises);
    lastUpdated = new Date();
    console.log(`✅ APR data updated at ${lastUpdated}`);
    console.log(cachedAPRData);
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
