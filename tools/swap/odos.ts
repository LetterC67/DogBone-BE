import { Address } from 'viem';

interface OdosSwapArgs {
  receiver: Address
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
}

export async function getOdosSwapQuote({
  receiver,
  chainId,
  tokenIn,
  tokenOut,
  amountIn,
}: OdosSwapArgs) {
  const quoteUrl = 'https://api.odos.xyz/sor/quote/v2';

  const quoteRequestBody = {
    chainId: chainId,
    inputTokens: [
      {
        tokenAddress: tokenIn,
        amount: amountIn.toString(),
      },
    ],
    outputTokens: [
      {
        tokenAddress: tokenOut,
        proportion: 1,
      },
    ],
    userAddr: receiver,
    slippageLimitPercent: 1,
    referralCode: 0,
    disableRFQs: true,
    compact: true,
  };

  const response = await fetch(quoteUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quoteRequestBody),
  });

  if (response.status === 200) {
    const quote = await response.json();
    return quote;
  } else {
    throw new Error(
      'Error in getting Odos Swap Quote to swap ' +
        amountIn +
        ' ' +
        tokenIn +
        ' to ' +
        tokenOut
    );
  }
}

export async function odosAssemble(
  receiver: Address,
  pathId: string
) {
  const assembleUrl = 'https://api.odos.xyz/sor/assemble';

  console.log('Path ID:', pathId);

  const assembleRequestBody = {
    userAddr: receiver,
    pathId: pathId,
    simulate: false,
  };

  const response = await fetch(assembleUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assembleRequestBody),
  });

  if (response.status === 200) {
    const assembledTransaction = await response.json();
    return assembledTransaction;
  } else {
    throw new Error('Error in assembling Odos Transaction');
  }
}

export async function odosExecute({
  receiver,
  chainId,
  tokenIn,
  tokenOut,
  amountIn,
}: OdosSwapArgs) {
  const { pathId } = await getOdosSwapQuote({
    receiver,
    chainId,
    tokenIn,
    tokenOut,
    amountIn,
  });
  const assembledTransaction = await odosAssemble(receiver, pathId);
  console.log('assembled tx: ', assembledTransaction);
  return assembledTransaction;
}
