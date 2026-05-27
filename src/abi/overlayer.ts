/**
 * Overlayer Protocol ABIs
 * Source: https://github.com/Overlayerfi/contracts
 *
 * OverlayerWrap (T+/C+) contract: OverlayerWrap.sol
 * StakedOverlayerWrap (sT+/sC+) contract: StakedOverlayerWrap.sol
 * Bridge: LayerZero OFT (inherited in OverlayerWrapCore.sol)
 */

// ==============================================================
// OverlayerWrap (T+ / C+) — Mint & Redeem & OFT Bridge
// ==============================================================
// Based on: contracts/overlayer/OverlayerWrap.sol
// Order struct from: contracts/overlayer/types/OverlayerWrapCoreTypes.sol
//
// struct Order {
//   address benefactor;       // who provides collateral (must be msg.sender)
//   address beneficiary;      // who receives the minted tokens
//   address collateral;       // underlying stablecoin address (USDC/USDT)
//   uint256 collateralAmount; // amount of collateral (6 decimals for USDC/USDT)
//   uint256 overlayerWrapAmount; // amount of overlaid token to mint (18 decimals)
// }
export const OVERLAYER_WRAP_ABI = [
  // ERC20 Read
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",

  // ERC20 Write
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",

  // === MINT ===
  // MethodID: 0x2ef6f1ab
  // Deposits collateral and mints overlaid tokens
  "function mint((address benefactor, address beneficiary, address collateral, uint256 collateralAmount, uint256 overlayerWrapAmount) order_)",

  // === REDEEM ===
  // Burns overlaid tokens and returns collateral
  "function redeem((address benefactor, address beneficiary, address collateral, uint256 collateralAmount, uint256 overlayerWrapAmount) order_)",

  // === LAYERZERO OFT BRIDGE ===
  // MethodID: 0xc7c7f5b3
  // Quote fee for cross-chain send
  "function quoteSend((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) _sendParam, bool _payInLzToken) view returns ((uint256 nativeFee, uint256 lzTokenFee))",

  // Send tokens cross-chain (burns on source, mints on destination)
  "function send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) _sendParam, (uint256 nativeFee, uint256 lzTokenFee) _fee, address _refundAddress) payable returns ((bytes32 guid, uint64 nonce, (uint256 nativeFee, uint256 lzTokenFee)))",
];

// ==============================================================
// StakedOverlayerWrap (sT+ / sC+) — ERC4626 Staking Vault
// ==============================================================
// Based on: contracts/overlayer/StakedOverlayerWrap.sol
// Standard ERC4626 with compound() called before each action
export const STAKED_OVERLAYER_WRAP_ABI = [
  // ERC20 Read
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",

  // ERC4626 Read
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function maxDeposit(address) view returns (uint256)",
  "function maxMint(address) view returns (uint256)",
  "function maxWithdraw(address owner) view returns (uint256)",
  "function maxRedeem(address owner) view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function previewMint(uint256 shares) view returns (uint256)",
  "function previewWithdraw(uint256 assets) view returns (uint256)",
  "function previewRedeem(uint256 shares) view returns (uint256)",

  // ERC20 Write
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",

  // === DEPOSIT (Stake) ===
  // MethodID: 0x6e553f65
  // Deposits overlaid token (T+/C+) and receives staking shares (sT+/sC+)
  "function deposit(uint256 assets_, address receiver_) returns (uint256)",

  // === MINT shares ===
  "function mint(uint256 shares_, address receiver_) returns (uint256)",

  // === WITHDRAW ===
  "function withdraw(uint256 assets_, address receiver_, address owner_) returns (uint256)",

  // === REDEEM ===
  "function redeem(uint256 shares_, address receiver_, address owner_) returns (uint256)",
];
