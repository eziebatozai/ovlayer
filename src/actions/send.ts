import { ethers } from "ethers";
import { CONFIG, CONTRACTS } from "../config";
import { ERC20_ABI } from "../abi/erc20";
import {
  getWallet,
  parseAmount,
  formatAmount,
  log,
  logError,
  sleep,
} from "../utils/helpers";

/**
 * Send C+ tokens to another wallet on same chain
 * Uses PRIVATE_KEY to send to PRIVATE_KEY_2 wallet
 */
export async function sendTokens(
  chain: "eth_sepolia" | "base_sepolia",
  tokenType: "USDT" | "USDC",
  amount: number,
  txCount: number = 1
): Promise<number> {
  const wallet = getWallet(chain, false); // primary wallet
  const wallet2 = getWallet(chain, true); // secondary wallet
  const fromAddress = await wallet.getAddress();
  const toAddress = await wallet2.getAddress();

  const contracts =
    chain === "eth_sepolia" ? CONTRACTS.ETH_SEPOLIA : CONTRACTS.BASE_SEPOLIA;
  const tokenContracts =
    tokenType === "USDT" ? contracts.USDT : contracts.USDC;
  const tokenName = tokenType === "USDT" ? "T+" : "C+";

  log(
    "SEND",
    `Sending ${amount} ${tokenName} from ${fromAddress} to ${toAddress} on ${chain} (${txCount} tx)`
  );

  const tokenContract = new ethers.Contract(
    tokenContracts.TOKEN,
    ERC20_ABI,
    wallet
  );

  let successCount = 0;
  const amountPerTx = Math.ceil(amount / txCount);

  for (let i = 0; i < txCount; i++) {
    try {
      const sendAmount =
        i === txCount - 1 ? amount - amountPerTx * i : amountPerTx;
      if (sendAmount <= 0) break;

      const decimals = await tokenContract.decimals();
      const parsedAmount = parseAmount(sendAmount, decimals);

      // Check balance
      const balance = await tokenContract.balanceOf(fromAddress);
      if (balance < parsedAmount) {
        log(
          "SEND",
          `Insufficient balance: ${formatAmount(balance, decimals)}`
        );
        break;
      }

      const tx = await tokenContract.transfer(toAddress, parsedAmount);
      const receipt = await tx.wait();
      log(
        "SEND",
        `Sent ${sendAmount} ${tokenName} to ${toAddress} (tx ${i + 1}/${txCount})`,
        receipt.hash
      );
      successCount++;

      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    } catch (error: any) {
      logError("SEND", error);
      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    }
  }

  log(
    "SEND",
    `Completed: ${successCount}/${txCount} successful send transactions`
  );
  return successCount;
}

/**
 * Receive C+ tokens - send from wallet2 back to wallet1
 * This fulfills the "Receive" daily task for wallet1
 */
export async function receiveTokens(
  chain: "eth_sepolia" | "base_sepolia",
  tokenType: "USDT" | "USDC",
  amount: number,
  txCount: number = 1
): Promise<number> {
  const wallet2 = getWallet(chain, true); // secondary sends
  const wallet1 = getWallet(chain, false); // primary receives
  const fromAddress = await wallet2.getAddress();
  const toAddress = await wallet1.getAddress();

  const contracts =
    chain === "eth_sepolia" ? CONTRACTS.ETH_SEPOLIA : CONTRACTS.BASE_SEPOLIA;
  const tokenContracts =
    tokenType === "USDT" ? contracts.USDT : contracts.USDC;
  const tokenName = tokenType === "USDT" ? "T+" : "C+";

  log(
    "RECEIVE",
    `Receiving ${amount} ${tokenName}: ${fromAddress} → ${toAddress} on ${chain} (${txCount} tx)`
  );

  const tokenContract = new ethers.Contract(
    tokenContracts.TOKEN,
    ERC20_ABI,
    wallet2
  );

  let successCount = 0;
  const amountPerTx = Math.ceil(amount / txCount);

  for (let i = 0; i < txCount; i++) {
    try {
      const recvAmount =
        i === txCount - 1 ? amount - amountPerTx * i : amountPerTx;
      if (recvAmount <= 0) break;

      const decimals = await tokenContract.decimals();
      const parsedAmount = parseAmount(recvAmount, decimals);

      const balance = await tokenContract.balanceOf(fromAddress);
      if (balance < parsedAmount) {
        log(
          "RECEIVE",
          `Wallet2 insufficient balance: ${formatAmount(balance, decimals)}`
        );
        break;
      }

      const tx = await tokenContract.transfer(toAddress, parsedAmount);
      const receipt = await tx.wait();
      log(
        "RECEIVE",
        `Received ${recvAmount} ${tokenName} from ${fromAddress} (tx ${i + 1}/${txCount})`,
        receipt.hash
      );
      successCount++;

      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    } catch (error: any) {
      logError("RECEIVE", error);
      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    }
  }

  log(
    "RECEIVE",
    `Completed: ${successCount}/${txCount} successful receive transactions`
  );
  return successCount;
}

// Run standalone
if (require.main === module) {
  (async () => {
    await sendTokens("eth_sepolia", "USDC", CONFIG.MIN_SEND_AMOUNT, 3);
    await sleep(5000);
    await receiveTokens("eth_sepolia", "USDC", CONFIG.MIN_RECEIVE_AMOUNT, 3);
  })().catch(console.error);
}
