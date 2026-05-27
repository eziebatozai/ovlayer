import { ethers } from "ethers";
import { CONFIG, CONTRACTS } from "../config";
import { STAKING_ABI } from "../abi/overlayer";
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
 * Stake C+ (or T+) tokens into the staking contract (sC+ / sT+)
 * The staking contract is an ERC4626 vault where you deposit overlaid asset to get staking shares
 */
export async function stakeTokens(
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
  const stakingName = tokenType === "USDT" ? "sT+" : "sC+";

  log("STAKE", `Starting stake of ${amount} ${tokenName} → ${stakingName} on ${chain} (${txCount} tx)`);

  const stakingContract = new ethers.Contract(
    tokenContracts.STAKING,
    STAKING_ABI,
    wallet
  );

  const overlaidToken = new ethers.Contract(
    tokenContracts.TOKEN,
    ERC20_ABI,
    wallet
  );

  let successCount = 0;
  const amountPerTx = Math.ceil(amount / txCount);

  for (let i = 0; i < txCount; i++) {
    try {
      const stakeAmount = i === txCount - 1 ? amount - amountPerTx * i : amountPerTx;
      if (stakeAmount <= 0) break;

      const decimals = await overlaidToken.decimals();
      const parsedAmount = parseAmount(stakeAmount, decimals);

      // Check overlaid token balance
      const balance = await overlaidToken.balanceOf(address);
      if (balance < parsedAmount) {
        log(
          "STAKE",
          `Insufficient ${tokenName} balance: ${formatAmount(balance, decimals)} < ${stakeAmount}`
        );
        if (balance > 0n) {
          // Stake whatever we have
          const currentAllowance = await overlaidToken.allowance(
            address,
            tokenContracts.STAKING
          );
          if (currentAllowance < balance) {
            const approveTx = await overlaidToken.approve(
              tokenContracts.STAKING,
              ethers.MaxUint256
            );
            await approveTx.wait();
            log("STAKE", `Approved staking contract`);
            await sleep(2000);
          }

          const tx = await stakingContract.deposit(balance, address);
          const receipt = await tx.wait();
          log("STAKE", `Staked available balance (tx ${i + 1}/${txCount})`, receipt.hash);
          successCount++;
        }
        break;
      }

      // Approve overlaid token to staking contract
      const currentAllowance = await overlaidToken.allowance(
        address,
        tokenContracts.STAKING
      );
      if (currentAllowance < parsedAmount) {
        const approveTx = await overlaidToken.approve(
          tokenContracts.STAKING,
          ethers.MaxUint256
        );
        await approveTx.wait();
        log("STAKE", `Approved ${stakingName} staking contract`);
        await sleep(2000);
      }

      // Deposit into staking
      const tx = await stakingContract.deposit(parsedAmount, address);
      const receipt = await tx.wait();
      log(
        "STAKE",
        `Staked ${stakeAmount} ${tokenName} → ${stakingName} on ${chain} (tx ${i + 1}/${txCount})`,
        receipt.hash
      );
      successCount++;

      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    } catch (error: any) {
      logError("STAKE", error);
      if (i < txCount - 1) await sleep(CONFIG.TX_DELAY);
    }
  }

  log("STAKE", `Completed: ${successCount}/${txCount} successful stake transactions`);
  return successCount;
}

// Run standalone
if (require.main === module) {
  stakeTokens("eth_sepolia", "USDC", CONFIG.MIN_STAKE_AMOUNT, 5)
    .then((count) => console.log(`Done. ${count} stakes completed.`))
    .catch(console.error);
}
