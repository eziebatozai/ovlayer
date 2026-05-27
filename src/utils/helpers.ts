import { ethers } from "ethers";
import { CONFIG } from "../config";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Auto-checksum any address to prevent INVALID_ARGUMENT errors
export function toChecksumAddress(address: string): string {
  return ethers.getAddress(address.toLowerCase());
}

export function getProvider(chain: "eth_sepolia" | "base_sepolia") {
  const rpc =
    chain === "eth_sepolia" ? CONFIG.ETH_SEPOLIA_RPC : CONFIG.BASE_SEPOLIA_RPC;
  return new ethers.JsonRpcProvider(rpc);
}

export function getWallet(
  chain: "eth_sepolia" | "base_sepolia",
  useSecondary = false
) {
  const provider = getProvider(chain);
  const key = useSecondary ? CONFIG.PRIVATE_KEY_2 : CONFIG.PRIVATE_KEY;
  if (!key) {
    throw new Error(
      `Private key ${useSecondary ? "PRIVATE_KEY_2" : "PRIVATE_KEY"} not set`
    );
  }
  return new ethers.Wallet(key, provider);
}

export function parseAmount(amount: number, decimals: number = 18): bigint {
  return ethers.parseUnits(amount.toString(), decimals);
}

export function formatAmount(amount: bigint, decimals: number = 18): string {
  return ethers.formatUnits(amount, decimals);
}

export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function addressToBytes32(address: string): string {
  // Pad address to 32 bytes for LayerZero
  return ethers.zeroPadValue(address, 32);
}

export function log(action: string, message: string, txHash?: string) {
  const timestamp = new Date().toISOString();
  const hashStr = txHash ? ` | TX: ${txHash}` : "";
  console.log(`[${timestamp}] [${action}]  ${message}${hashStr}`);
}

export function logError(action: string, error: any) {
  const timestamp = new Date().toISOString();
  const msg = error?.message || error?.reason || String(error);
  console.error(`[${timestamp}] [${action}] ERROR: ${msg}`);
}
