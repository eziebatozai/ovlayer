import { ethers } from "ethers";
import { CONFIG, CONTRACTS } from "../config";
import { VAULT_ABI } from "../abi/overlayer";
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
 * Based on actual TX: 0x602c00f3f3010342d411886ff53a907b82b903fd2b5455bac266a1987067a220
 * Function: mint(tuple order_)
 * MethodID: 0x2ef6f1ab
 * 
 * Order struct:
 *   - depositor: address (who deposits the underlying)
 *   - receiver: address (who receives the minted token)
 *   - asset: address (underlying stablecoin address)
 *   - assetAmount: uint256 (amount of underlying to deposit)
 *   - mintAmount: uint256 (amount of overlaid token to mint)
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

  // Token contract (T+ or C+) - this has the mint function
  const vaultContract = new ethers.Contract(
    tokenContracts.TOKEN,
    VAULT_ABI,
    wallet
  );

  // Underlying stablecoin contract
  const underlyingContract = new ethers.Contract(
    tokenContracts.UNDERLYING,
    ERC20_ABI,
    wallet
  );

  // Get decimals
  const underlyingDecimals = await underlyingContract.decimals();
  const tokenDecimals = await vaultContract.decimals();

  let successCount = 0;
  const amountPerTx = Math.ceil(amount / txCount);

  for (let i = 0; i < txCount; i++) {
    try {
      const mintAmount = i === txCount - 1 
        ? amount - amountPerTx * (txCount - 1) 
        : amountPerTx;
      if (mintAmount <= 0) break;

      // Parse amounts based on decimals
      // Underlying (USDC/USDT) typically 6 decimals, overlaid token (T+/C+) 18 decimals
      const assetAmount = parseAmount(mintAmount, underlyingDecimals);
      const mintTokenAmount = parseAmount(mintAmount, tokenDecimals);
      
      log("MINT", `Asset amount: ${assetAmount} (${underlyingDecimals} dec), Mint amount: ${mintTokenAmount} (${tokenDecimals} dec)`);

      // Check underlying balance
      const balance = await underlyingContract.balanceOf(address);
      if (balance < assetAmount) {
        log(
          "MINT",
          `Insufficient ${tokenType} balance: ${formatAmount(balance, underlyingDecimals)} < ${mintAmount}`
        );
        break;
      }

      // Approve underlying to T+/C+ contract if needed
      const currentAllowance = await underlyingContract.allowance(
        address,
        tokenContracts.TOKEN
      );
      if (currentAllowance < assetAmount) {
        const approveTx = await underlyingContract.approve(
          tokenContracts.TOKEN,
          ethers.MaxUint256
        );
        await approveTx.wait();
        log("MINT", `Approved ${tokenName} contract to spend ${tokenType}`);
        await sleep(2000);
      }

      // Build the order tuple
      const order = {
        depositor: address,
        receiver: address,
        asset: tokenContracts.UNDERLYING,
        assetAmount: assetAmount,
        mintAmount: mintTokenAmount,
      };

      // Call mint(order_)
      const tx = await vaultContract.mint(order);
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
