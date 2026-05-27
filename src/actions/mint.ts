import { ethers } from "ethers";
import { CONFIG, CONTRACTS } from "../config";
import { OVERLAYER_WRAP_ABI } from "../abi/overlayer";
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
 * Mint T+ or C+ tokens on Overlayer
 *
 * Source: contracts/overlayer/OverlayerWrap.sol → mint(Order calldata order_)
 * Source: contracts/overlayer/types/OverlayerWrapCoreTypes.sol
 *
 * Order struct:
 *   - benefactor: address (who provides collateral — must be msg.sender)
 *   - beneficiary: address (who receives minted tokens)
 *   - collateral: address (underlying stablecoin: USDC or USDT)
 *   - collateralAmount: uint256 (amount in collateral decimals, e.g. 6 for USDC)
 *   - overlayerWrapAmount: uint256 (amount in 18 decimals)
 *
 * Flow: approve collateral → call mint(order) on T+/C+ contract
 */
export async function mintTokens(
  chain: "eth_sepolia" | "base_sepolia",
  tokenType: "USDT" | "USDC",
  amount: number,
  txCount: number = 1
): Promise<number> {
  const wallet = getWallet(chain);
  const address = await wallet.getAddress();
  const contracts =
    chain === "eth_sepolia" ? CONTRACTS.ETH_SEPOLIA : CONTRACTS.BASE_SEPOLIA;
  const tokenContracts =
    tokenType === "USDT" ? contracts.USDT : contracts.USDC;
  const tokenName = tokenType === "USDT" ? "T+" : "C+";

  log("MINT", `Starting mint of ${amount} ${tokenName} on ${chain} (${txCount} tx)`);

  // OverlayerWrap contract (T+ or C+) — has the mint function
  const wrapContract = new ethers.Contract(
    tokenContracts.TOKEN,
    OVERLAYER_WRAP_ABI,
    wallet
  );

  // Underlying stablecoin contract (USDC/USDT)
  const underlyingContract = new ethers.Contract(
    tokenContracts.UNDERLYING,
    ERC20_ABI,
    wallet
  );

  // Get decimals
  const underlyingDecimals = await underlyingContract.decimals();
  const wrapDecimals = await wrapContract.decimals();
  log("MINT", `Underlying: ${underlyingDecimals} decimals, ${tokenName}: ${wrapDecimals} decimals`);

  let successCount = 0;
  const amountPerTx = Math.ceil(amount / txCount);

  for (let i = 0; i < txCount; i++) {
    try {
      const mintAmount = i === txCount - 1
        ? amount - amountPerTx * (txCount - 1)
        : amountPerTx;
      if (mintAmount <= 0) break;

      // Parse amounts:
      // collateralAmount in underlying decimals (e.g., 6 for USDC)
      // overlayerWrapAmount in wrap decimals (18)
      const collateralAmount = parseAmount(mintAmount, underlyingDecimals);
      const overlayerWrapAmount = parseAmount(mintAmount, wrapDecimals);

      // Check underlying balance
      const balance = await underlyingContract.balanceOf(address);
      if (balance < collateralAmount) {
        log(
          "MINT",
          `Insufficient ${tokenType} balance: ${formatAmount(balance, underlyingDecimals)} < ${mintAmount}`
        );
        break;
      }

      // Approve underlying to OverlayerWrap contract if needed
      const currentAllowance = await underlyingContract.allowance(
        address,
        tokenContracts.TOKEN
      );
      if (currentAllowance < collateralAmount) {
        const approveTx = await underlyingContract.approve(
          tokenContracts.TOKEN,
          ethers.MaxUint256
        );
        await approveTx.wait();
        log("MINT", `Approved ${tokenName} contract to spend ${tokenType}`);
        await sleep(2000);
      }

      // Build Order struct
      const order = {
        benefactor: address,          // msg.sender (who provides collateral)
        beneficiary: address,         // who receives minted T+/C+
        collateral: tokenContracts.UNDERLYING, // underlying stablecoin address
        collateralAmount: collateralAmount,    // amount in underlying decimals
        overlayerWrapAmount: overlayerWrapAmount, // amount in 18 decimals
      };

      // Call mint(order_)
      const tx = await wrapContract.mint(order);
      const receipt = await tx.wait();
      log(
        "MINT",
        `Minted ${mintAmount} ${tokenName} on ${chain} (tx ${i + 1}/${txCount})`,
        receipt.hash
      );
      successCount++;

      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    } catch (error: any) {
      logError("MINT", error);
      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    }
  }

  log("MINT", `Completed: ${successCount}/${txCount} successful mint transactions`);
  return successCount;
}

// Run standalone
if (require.main === module) {
  mintTokens("eth_sepolia", "USDT", CONFIG.MIN_MINT_AMOUNT, 10)
    .then((count) => console.log(`Done. ${count} mints completed.`))
    .catch(console.error);
}
