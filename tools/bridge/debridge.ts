import { ConnectedWallet } from '@privy-io/react-auth';
import { Address } from 'viem';

interface DebridgeArgs {
    walletClient: ConnectedWallet;
    srcChainId: number;
    dstChainId: number;
    srcChainTokenIn: Address;
    srcAmountIn: bigint;
    dstChainTokenOut: Address;
    externalCall?: {
        target: Address;  
        targetPayload: Address;
    };
}

export async function debridgeQuote({
    walletClient,
    srcChainId,
    dstChainId,
    srcChainTokenIn,
    srcAmountIn,
    dstChainTokenOut,
    externalCall
}: DebridgeArgs) {
    const debridgeAPI = "https://dln.debridge.finance/v1.0/dln/order/create-tx";
    const userAddress = walletClient.address;
    const params = new URLSearchParams({
        senderAddress: userAddress,
        srcChainId: srcChainId.toString(),
        srcChainTokenIn: srcChainTokenIn,
        srcChainTokenInAmount: srcAmountIn.toString(),
        dstChainId: dstChainId.toString(),
        dstChainTokenOut: dstChainTokenOut, 
        dstChainTokenOutAmount: "auto",
        prependOperatingExpense: "true",
        srcChainOrderAuthorityAddress: userAddress,
        dstChainOrderAuthorityAddress: userAddress,
        dstChainTokenOutRecipient: userAddress,
        enableEstimate: "false",
        dlnHook: externalCall
          ? JSON.stringify({
              type: "evm_hook_data_v1",
              data: {
                fallbackAddress: userAddress,
                target: externalCall.target,
                reward: "0",
                isNonAtomic: false,
                isSuccessRequired: true,
                targetPayload: externalCall.targetPayload,                
              },
            })
          : "",
    });

    const debridgeQuery = `${debridgeAPI}?${params.toString()}`;
    const debridgeResponse = await fetch(debridgeQuery, {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        },
    });
  
    if (debridgeResponse.status == 400) {
        throw new Error("Error in getting Debridge Quote");
    }

    const data = await debridgeResponse.json();
    if (!data.tx) {
        throw new Error("Error in getting Debridge Quote");
    }

    return {
        transaction: data.tx,
        amountOut: data.dstChainTokenOut.amount
    }
}