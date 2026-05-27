import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  // Wallet
  PRIVATE_KEY: process.env.PRIVATE_KEY || "",
  PRIVATE_KEY_2: process.env.PRIVATE_KEY_2 || "",

  // RPC
  ETH_SEPOLIA_RPC: process.env.ETH_SEPOLIA_RPC || "https://rpc.sepolia.org",
  BASE_SEPOLIA_RPC: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",

  // Chain IDs
  ETH_SEPOLIA_CHAIN_ID: 11155111,
  BASE_SEPOLIA_CHAIN_ID: 84532,

  // Daily minimums
  MIN_MINT_AMOUNT: parseInt(process.env.MIN_MINT_AMOUNT || "392"),
  MIN_STAKE_AMOUNT: parseInt(process.env.MIN_STAKE_AMOUNT || "209"),
  MIN_BRIDGE_AMOUNT: parseInt(process.env.MIN_BRIDGE_AMOUNT || "373"),
  MIN_SEND_AMOUNT: parseInt(process.env.MIN_SEND_AMOUNT || "217"),
  MIN_RECEIVE_AMOUNT: parseInt(process.env.MIN_RECEIVE_AMOUNT || "142"),
  MIN_DAILY_TX: parseInt(process.env.MIN_DAILY_TX || "45"),

  // Delay
  TX_DELAY: parseInt(process.env.TX_DELAY || "5000"),
};

// ============================================================
// CONTRACT ADDRESSES
// ============================================================

export const CONTRACTS = {
  ETH_SEPOLIA: {
    USDT: {
      // T+ token (overlaid USDT)
      TOKEN: "0xe20534a32F9162488a90026F268a74fBE28d272D",
      // sT+ staking token
      STAKING: "0x079a4Bf1Cbd0E4ce15391340cB46efA6396aBc82",
    },
    USDC: {
      // C+ token (overlaid USDC)
      TOKEN: "0xE815718D44694ec4637CB775C468d87f6e15B538",
      // sC+ staking token
      STAKING: "0x753937137Eb92871A6F3517514d4f1Ee860e3FDF",
    },
  },
  BASE_SEPOLIA: {
    USDT: {
      // T+ token (overlaid USDT)
      TOKEN: "0xdE287B4a0918102511b027d53688c169fb308762",
      // sT+ staking token
      STAKING: "0x5BBc62c58C3b23566488fdFa78455ea00C31a76C",
    },
    USDC: {
      // C+ token (overlaid USDC)
      TOKEN: "0x92f36E427a9579fe1356f19c74eb5d64bEae8930",
      // sC+ staking token
      STAKING: "0xD3bE3A1EA873d96533510Edd93a62CC28AC6964B",
    },
  },
};

// LayerZero Endpoint IDs for OFT bridge
export const LZ_ENDPOINTS = {
  ETH_SEPOLIA: 40161,   // LayerZero Endpoint ID for Ethereum Sepolia
  BASE_SEPOLIA: 40245,  // LayerZero Endpoint ID for Base Sepolia
};
