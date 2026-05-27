import { ethers } from "ethers";
import { CONFIG, CONTRACTS, LZ_ENDPOINTS } from "../config";
import { OVERLAYER_WRAP_ABI } from "../abi/overlayer";
import {
  getWallet,
  parseAmount,
  formatAmount,
  addressToBytes32,
  log,
  logError,
  sleep,
} from "../utils/helpers";

/**
 * Bridge C+ or T+ tokens from ETH Sepolia to Base Sepolia via LayerZero OFT
 *
 * Based on actual TX: 0x80a2c0180221e98c2a7260e7c22479c657b544a40a0ce55abe49f69098a303c8
 * Function: send(tuple _sendParam, tuple _fee, address _refundAddress)
 * MethodID: 0xc7c7f5b3
 *
 * The T+/C+ token contract itself IS the OFT.
 * It burns tokens on source chain and mints on destination chain.
 * Requires ETH for LayerZero messaging fee (sent as msg.value).
 */
export async function bridgeTokens(
  fromChain: "eth_sepolia" | "base_sepolia",
  tokenType: "USDT" | "USDC",
  amount: number,
  txCount: number = 1
): Promise<number> {
  const wallet = getWallet(fromChain);
  const address = await wallet.getAddress();
  const contracts =
    fromChain === "eth_sepolia"
      ? CONTRACTS.ETH_SEPOLIA
      : CONTRACTS.BASE_SEPOLIA;
  const tokenContracts =
    tokenType === "USDT" ? contracts.USDT : contracts.USDC;
  const tokenName = tokenType === "USDT" ? "T+" : "C+";

  // Destination LayerZero Endpoint ID
  const dstEid =
    fromChain === "eth_sepolia"
      ? LZ_ENDPOINTS.BASE_SEPOLIA
      : LZ_ENDPOINTS.ETH_SEPOLIA;

  log(
    "BRIDGE",
    `Bridging ${amount} ${tokenName} from ${fromChain} to ${fromChain === "eth_sepolia" ? "Base Sepolia" : "ETH Sepolia"} via OFT (${txCount} tx)`
  );

  // The T+/C+ token contract IS the OFT (OverlayerWrapCore extends OFT)
  const oftContract = new ethers.Contract(
    tokenContracts.TOKEN,
    OVERLAYER_WRAP_ABI,
    wallet
  );

  // Get token decimals
  const decimals = await oftContract.decimals();

  let successCount = 0;
  const amountPerTx = Math.ceil(amount / txCount);

  for (let i = 0; i < txCount; i++) {
    try {
      const bridgeAmount =
        i === txCount - 1 ? amount - amountPerTx * (txCount - 1) : amountPerTx;
      if (bridgeAmount <= 0) break;

      const parsedAmount = parseAmount(bridgeAmount, decimals);

      // Check token balance
      const balance = await oftContract.balanceOf(address);
      if (balance < parsedAmount) {
        log(
          "BRIDGE",
          `Insufficient ${tokenName} balance: ${formatAmount(balance, decimals)} < ${bridgeAmount}`
        );
        break;
      }

      // Build SendParam struct
      const sendParam = {
        dstEid: dstEid,
        to: addressToBytes32(address), // receive to same address on dest chain
        amountLD: parsedAmount,
        minAmountLD: (parsedAmount * 99n) / 100n, // 1% slippage tolerance
        extraOptions: "0x00030100110100000000000000000000000000030d40", // lzReceive gas: 200000
        composeMsg: "0x",
        oftCmd: "0x",
      };

      // Quote the messaging fee
      log("BRIDGE", `Quoting fee for ${bridgeAmount} ${tokenName}...`);
      const quotedFee = await oftContract.quoteSend(sendParam, false);
      const nativeFee = quotedFee.nativeFee || quotedFee[0];
      log("BRIDGE", `Messaging fee: ${ethers.formatEther(nativeFee)} ETH`);

      // Build fee struct
      const messagingFee = {
        nativeFee: nativeFee,
        lzTokenFee: 0n,
      };

      // Execute bridge (send with ETH value for LZ fee)
      const tx = await oftContract.send(
        sendParam,
        messagingFee,
        address, // refund address for excess fee
        { value: nativeFee }
      );
      const receipt = await tx.wait();
      log(
        "BRIDGE",
        `Bridged ${bridgeAmount} ${tokenName} → ${fromChain === "eth_sepolia" ? "Base Sepolia" : "ETH Sepolia"} (tx ${i + 1}/${txCount})`,
        receipt.hash
      );
      successCount++;

      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    } catch (error: any) {
      logError("BRIDGE", error);
      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    }
  }

  log(
    "BRIDGE",
    `Completed: ${successCount}/${txCount} successful bridge transactions`
  );
  return successCount;
}

// Run standalone
if (require.main === module) {
  bridgeTokens("eth_sepolia", "USDC", CONFIG.MIN_BRIDGE_AMOUNT, 8)
    .then((count) => console.log(`Done. ${count} bridges completed.`))
    .catch(console.error);
}
