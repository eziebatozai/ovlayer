import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  // Wallet
  PRIVATE_KEY: process.env.PRIVATE_KEY || "",
  PRIVATE_KEY_2: process.env.PRIVATE_KEY_2 || "",

  // RPC
  ETH_SEPOLIA_RPC: process.env.ETH_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com",
  BASE_SEPOLIA_RPC: process.env.BASE_SEPOLIA_RPC || "https://base-sepolia-rpc.publicnode.com",

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

  // Delay between transactions (ms)
  TX_DELAY: parseInt(process.env.TX_DELAY || "5000"),
};

// ============================================================
// CONTRACT ADDRESSES
// Source: https://github.com/Overlayerfi/contracts
// ============================================================

export const CONTRACTS = {
  ETH_SEPOLIA: {
    USDT: {
      // T+ token (OverlayerWrap USDT) — mint/bridge contract
      TOKEN: "0xe20534a32f9162488a90026f268a74fbe28d272d",
      // sT+ (StakedOverlayerWrap USDT) — ERC4626 staking vault
      STAKING: "0x079a4bf1cbd0e4ce15391340cb46efa6396abc82",
      // Underlying USDT on Ethereum Sepolia
      UNDERLYING: "0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0",
    },
    USDC: {
      // C+ token (OverlayerWrap USDC) — mint/bridge contract
      TOKEN: "0xe815718d44694ec4637cb775c468d87f6e15b538",
      // sC+ (StakedOverlayerWrap USDC) — ERC4626 staking vault
      STAKING: "0x753937137eb92871a6f3517514d4f1ee860e3fdf",
      // Underlying USDC on Ethereum Sepolia
      UNDERLYING: "0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8",
    },
  },
  BASE_SEPOLIA: {
    USDT: {
      // T+ token (OverlayerWrap USDT) on Base Sepolia
      TOKEN: "0xde287b4a0918102511b027d53688c169fb308762",
      // sT+ staking on Base Sepolia
      STAKING: "0x5bbc62c58c3b23566488fdfa78455ea00c31a76c",
      // Underlying USDT on Base Sepolia (to be confirmed)
      UNDERLYING: "",
    },
    USDC: {
      // C+ token (OverlayerWrap USDC) on Base Sepolia
      TOKEN: "0x92f36e427a9579fe1356f19c74eb5d64beae8930",
      // sC+ staking on Base Sepolia
      STAKING: "0xd3be3a1ea873d96533510edd93a62cc28ac6964b",
      // Underlying USDC on Base Sepolia (to be confirmed)
      UNDERLYING: "",
    },
  },
};

// LayerZero Endpoint IDs for OFT bridge
// Source: @layerzerolabs/lz-definitions
export const LZ_ENDPOINTS = {
  ETH_SEPOLIA: 40161,   // LayerZero EndpointId.SEPOLIA_V2_TESTNET
  BASE_SEPOLIA: 40245,  // LayerZero EndpointId.BASESEP_V2_TESTNET
};
