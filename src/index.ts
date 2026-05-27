import { CONFIG } from "./config";
import { mintTokens } from "./actions/mint";
import { stakeTokens } from "./actions/stake";
import { bridgeTokens } from "./actions/bridge";
import { sendTokens, receiveTokens } from "./actions/send";
import { log, logError, sleep } from "./utils/helpers";

/**
 * Overlayer Testnet Daily Bot
 *
 * Daily Tasks on Ethereum Sepolia:
 * 1. Mint at least 392 T+ on ETH Sepolia
 * 2. Stake at least 209 C+ on ETH Sepolia
 * 3. Bridge at least 373 C+ from ETH Sepolia via OFT
 * 4. Send at least 217 C+ on ETH Sepolia
 * 5. Receive at least 142 C+ on ETH Sepolia
 * 6. Make at least 45 tx (mint, stake, or bridge) on ETH Sepolia
 */
async function main() {
  console.log("=".repeat(60));
  console.log("  OVERLAYER TESTNET DAILY BOT");
  console.log("=".repeat(60));
  console.log(`  Min Mint:    ${CONFIG.MIN_MINT_AMOUNT} T+`);
  console.log(`  Min Stake:   ${CONFIG.MIN_STAKE_AMOUNT} C+`);
  console.log(`  Min Bridge:  ${CONFIG.MIN_BRIDGE_AMOUNT} C+`);
  console.log(`  Min Send:    ${CONFIG.MIN_SEND_AMOUNT} C+`);
  console.log(`  Min Receive: ${CONFIG.MIN_RECEIVE_AMOUNT} C+`);
  console.log(`  Min Daily TX: ${CONFIG.MIN_DAILY_TX}`);
  console.log("=".repeat(60));

  let totalTx = 0;

  try {
    // ============================================================
    // STEP 1: Mint T+ tokens (USDT → T+) on ETH Sepolia
    // Split into multiple transactions to hit tx count
    // ============================================================
    log("MAIN", "=== STEP 1: Minting T+ on ETH Sepolia ===");
    const mintTxCount = 10; // Split minting into 10 tx
    const mintResult = await mintTokens(
      "eth_sepolia",
      "USDT",
      CONFIG.MIN_MINT_AMOUNT,
      mintTxCount
    );
    totalTx += mintResult;
    await sleep(CONFIG.TX_DELAY);

    // ============================================================
    // STEP 2: Mint C+ tokens (USDC → C+) on ETH Sepolia
    // Need C+ for stake, bridge, send tasks
    // ============================================================
    log("MAIN", "=== STEP 2: Minting C+ on ETH Sepolia ===");
    // Mint enough for stake + bridge + send + receive buffer
    const totalCNeeded =
      CONFIG.MIN_STAKE_AMOUNT +
      CONFIG.MIN_BRIDGE_AMOUNT +
      CONFIG.MIN_SEND_AMOUNT +
      100; // buffer
    const mintCTxCount = 10;
    const mintCResult = await mintTokens(
      "eth_sepolia",
      "USDC",
      totalCNeeded,
      mintCTxCount
    );
    totalTx += mintCResult;
    await sleep(CONFIG.TX_DELAY);

    // ============================================================
    // STEP 3: Stake C+ on ETH Sepolia
    // ============================================================
    log("MAIN", "=== STEP 3: Staking C+ on ETH Sepolia ===");
    const stakeTxCount = 8;
    const stakeResult = await stakeTokens(
      "eth_sepolia",
      "USDC",
      CONFIG.MIN_STAKE_AMOUNT,
      stakeTxCount
    );
    totalTx += stakeResult;
    await sleep(CONFIG.TX_DELAY);

    // ============================================================
    // STEP 4: Bridge C+ from ETH Sepolia via OFT
    // ============================================================
    log("MAIN", "=== STEP 4: Bridging C+ from ETH Sepolia ===");
    const bridgeTxCount = 8;
    const bridgeResult = await bridgeTokens(
      "eth_sepolia",
      "USDC",
      CONFIG.MIN_BRIDGE_AMOUNT,
      bridgeTxCount
    );
    totalTx += bridgeResult;
    await sleep(CONFIG.TX_DELAY);

    // ============================================================
    // STEP 5: Send C+ on ETH Sepolia
    // ============================================================
    log("MAIN", "=== STEP 5: Sending C+ on ETH Sepolia ===");
    const sendTxCount = 5;
    const sendResult = await sendTokens(
      "eth_sepolia",
      "USDC",
      CONFIG.MIN_SEND_AMOUNT,
      sendTxCount
    );
    totalTx += sendResult;
    await sleep(CONFIG.TX_DELAY);

    // ============================================================
    // STEP 6: Receive C+ on ETH Sepolia
    // (wallet2 sends back to wallet1)
    // ============================================================
    log("MAIN", "=== STEP 6: Receiving C+ on ETH Sepolia ===");
    const receiveTxCount = 5;
    const receiveResult = await receiveTokens(
      "eth_sepolia",
      "USDC",
      CONFIG.MIN_RECEIVE_AMOUNT,
      receiveTxCount
    );
    totalTx += receiveResult;
    await sleep(CONFIG.TX_DELAY);

    // ============================================================
    // STEP 7: Top up TX count if needed (min 45)
    // ============================================================
    if (totalTx < CONFIG.MIN_DAILY_TX) {
      const remaining = CONFIG.MIN_DAILY_TX - totalTx;
      log(
        "MAIN",
        `=== STEP 7: Need ${remaining} more TX to hit daily minimum ===`
      );

      // Do extra mints to reach 45
      const extraMintResult = await mintTokens(
        "eth_sepolia",
        "USDT",
        remaining * 10, // small amounts
        remaining
      );
      totalTx += extraMintResult;
    }
  } catch (error) {
    logError("MAIN", error);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("  DAILY SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Total Transactions: ${totalTx} / ${CONFIG.MIN_DAILY_TX}`);
  console.log(
    `  Status: ${totalTx >= CONFIG.MIN_DAILY_TX ? "COMPLETED" : "INCOMPLETE"}`
  );
  console.log("=".repeat(60));
}

main().catch(console.error);
