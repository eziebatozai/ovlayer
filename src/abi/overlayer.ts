// Overlayer Mint contract ABI
// Custom mint function: mint(tuple order_) with MethodID 0x2ef6f1ab
// Order struct: (address depositor, address receiver, address asset, uint256 assetAmount, uint256 mintAmount)
export const VAULT_ABI = [
  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function asset() view returns (address)",

  // Custom mint function used by Overlayer
  // order_ = (depositor, receiver, asset, assetAmount, mintAmount)
  "function mint((address depositor, address receiver, address asset, uint256 assetAmount, uint256 mintAmount) order_) returns (uint256)",

  // ERC20 functions
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
];

// Staking contract ABI (sT+ / sC+)
// Users stake their overlaid asset (T+ or C+) to get staking shares
export const STAKING_ABI = [
  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function maxDeposit(address) view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",

  // Write functions - deposit overlaid asset, get staking shares
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",

  // ERC20
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// OFT (Omnichain Fungible Token) ABI for LayerZero bridge
export const OFT_ABI = [
  // ERC20 base
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",

  // OFT specific
  "function token() view returns (address)",
  "function sharedDecimals() view returns (uint8)",

  // Quote fee for sending
  "function quoteSend((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd), bool payInLzToken) view returns ((uint256 nativeFee, uint256 lzTokenFee))",

  // Send tokens cross-chain
  "function send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd), (uint256 nativeFee, uint256 lzTokenFee), address refundAddress) payable returns ((bytes32 guid, uint64 nonce, (uint256 nativeFee, uint256 lzTokenFee)))",
];
