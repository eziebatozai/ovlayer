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
 * Mint T+ tokens by depositing USDT on the T+ contract
 * The T+ contract acts as an ERC4626 vault - deposit underlying → get overlaid asset
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

  const vaultContract = new ethers.Contract(
    tokenContracts.TOKEN,
    VAULT_ABI,
    wallet
  );

  let successCount = 0;
  const amountPerTx = Math.ceil(amount / txCount);

  for (let i = 0; i < txCount; i++) {
    try {
      const mintAmount = i === txCount - 1 ? amount - amountPerTx * i : amountPerTx;
      if (mintAmount <= 0) break;

      // Get the underlying asset address
      let underlyingAsset: string;
      try {
        underlyingAsset = await vaultContract.asset();
      } catch {
        // If no asset() function, the token itself accepts direct minting
        // Try direct mint approach
        log("MINT", `Attempting direct mint (no vault pattern)...`);
        const decimals = await vaultContract.decimals();
        const parsedAmount = parseAmount(mintAmount, decimals);

        const tx = await vaultContract.mint(parsedAmount, address);
        const receipt = await tx.wait();
        log("MINT", `Minted ${mintAmount} ${tokenName} (tx ${i + 1}/${txCount})`, receipt.hash);
        successCount++;
        if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
        continue;
      }

      // Approve underlying asset to vault
      const underlyingContract = new ethers.Contract(
        underlyingAsset,
        ERC20_ABI,
        wallet
      );
      const decimals = await underlyingContract.decimals();
      const parsedAmount = parseAmount(mintAmount, decimals);

      // Check balance
      const balance = await underlyingContract.balanceOf(address);
      if (balance < parsedAmount) {
        log(
          "MINT",
          `Insufficient underlying balance: ${formatAmount(balance, decimals)} < ${mintAmount}`
        );
        // Try with available balance
        if (balance > 0n) {
          const currentAllowance = await underlyingContract.allowance(
            address,
            tokenContracts.TOKEN
          );
          if (currentAllowance < balance) {
            const approveTx = await underlyingContract.approve(
              tokenContracts.TOKEN,
              ethers.MaxUint256
            );
            await approveTx.wait();
            log("MINT", `Approved ${tokenName} vault`);
          }

          const tx = await vaultContract.deposit(balance, address);
          const receipt = await tx.wait();
          log("MINT", `Minted with available balance (tx ${i + 1}/${txCount})`, receipt.hash);
          successCount++;
        }
        break;
      }

      // Approve
      const currentAllowance = await underlyingContract.allowance(
        address,
        tokenContracts.TOKEN
      );
      if (currentAllowance < parsedAmount) {
        const approveTx = await underlyingContract.approve(
          tokenContracts.TOKEN,
          ethers.MaxUint256
        );
        await approveTx.wait();
        log("MINT", `Approved ${tokenName} vault for spending`);
        await sleep(2000);
      }

      // Deposit
      const tx = await vaultContract.deposit(parsedAmount, address);
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
      // Try alternative: direct mint without deposit pattern
      try {
        const decimals = await vaultContract.decimals();
        const parsedAmount = parseAmount(amountPerTx, decimals);
        const tx = await vaultContract.mint(parsedAmount, address);
        const receipt = await tx.wait();
        log("MINT", `Direct mint ${tokenName} (tx ${i + 1}/${txCount})`, receipt.hash);
        successCount++;
      } catch (err2) {
        logError("MINT", err2);
      }
      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    }
  }

  log("MINT", `Completed: ${successCount}/${txCount} successful mint transactions`);
  return successCount;
}

// Run standalone
if (require.main === module) {
  mintTokens("eth_sepolia", "USDT", CONFIG.MIN_MINT_AMOUNT, 5)
    .then((count) => console.log(`Done. ${count} mints completed.`))
    .catch(console.error);
}
