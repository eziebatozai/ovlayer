import { ethers } from "ethers";
import { CONFIG, CONTRACTS, LZ_ENDPOINTS } from "../config";
import { OFT_ABI } from "../abi/overlayer";
import { ERC20_ABI } from "../abi/erc20";
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
 * Bridge C+ tokens from ETH Sepolia to Base Sepolia via LayerZero OFT
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

  const dstEid =
    fromChain === "eth_sepolia"
      ? LZ_ENDPOINTS.BASE_SEPOLIA
      : LZ_ENDPOINTS.ETH_SEPOLIA;

  log(
    "BRIDGE",
    `Bridging ${amount} ${tokenName} from ${fromChain} via OFT (${txCount} tx)`
  );

  // The token itself is the OFT (or there's an OFT adapter)
  const oftContract = new ethers.Contract(
    tokenContracts.TOKEN,
    OFT_ABI,
    wallet
  );

  let successCount = 0;
  const amountPerTx = Math.ceil(amount / txCount);

  for (let i = 0; i < txCount; i++) {
    try {
      const bridgeAmount =
        i === txCount - 1 ? amount - amountPerTx * i : amountPerTx;
      if (bridgeAmount <= 0) break;

      const decimals = 18;
      let parsedAmount: bigint;
      try {
        const dec = await oftContract.decimals();
        parsedAmount = parseAmount(bridgeAmount, dec);
      } catch {
        parsedAmount = parseAmount(bridgeAmount, decimals);
      }

      // Build SendParam
      const sendParam = {
        dstEid: dstEid,
        to: addressToBytes32(address),
        amountLD: parsedAmount,
        minAmountLD: (parsedAmount * 99n) / 100n, // 1% slippage
        extraOptions: "0x00030100110100000000000000000000000000030d40", // lzReceive gas
        composeMsg: "0x",
        oftCmd: "0x",
      };

      // Quote the fee
      const [nativeFee] = await oftContract.quoteSend(sendParam, false);
      log(
        "BRIDGE",
        `Quote fee: ${ethers.formatEther(nativeFee.nativeFee || nativeFee)} ETH`
      );

      // Send
      const messagingFee = {
        nativeFee: nativeFee.nativeFee || nativeFee,
        lzTokenFee: 0n,
      };

      const tx = await oftContract.send(sendParam, messagingFee, address, {
        value: messagingFee.nativeFee,
      });
      const receipt = await tx.wait();
      log(
        "BRIDGE",
        `Bridged ${bridgeAmount} ${tokenName} to ${fromChain === "eth_sepolia" ? "Base Sepolia" : "ETH Sepolia"} (tx ${i + 1}/${txCount})`,
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
  bridgeTokens("eth_sepolia", "USDC", CONFIG.MIN_BRIDGE_AMOUNT, 5)
    .then((count) => console.log(`Done. ${count} bridges completed.`))
    .catch(console.error);
}
