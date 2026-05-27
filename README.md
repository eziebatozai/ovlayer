# Overlayer Testnet Daily Bot

Automated bot for completing daily tasks on Overlayer Protocol testnet.

## Daily Tasks (Ethereum Sepolia)

| Task | Minimum | Token |
|------|---------|-------|
| Mint | 392 | T+ (overlaid USDT) |
| Stake | 209 | C+ (overlaid USDC) |
| Bridge (OFT) | 373 | C+ from ETH Sepolia |
| Send | 217 | C+ on ETH Sepolia |
| Receive | 142 | C+ on ETH Sepolia |
| Daily TX | 45 | mint + stake + bridge |

## Setup

1. Clone and install:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Fill in your private keys and RPC URLs in `.env`

## Usage

Run all daily tasks:
```bash
npm run dev
```

Run individual actions:
```bash
npm run mint
npm run stake
npm run bridge
npm run send
```

## Architecture

```
src/
├── index.ts           → Main orchestrator (runs all daily tasks)
├── config.ts          → Contract addresses, chain config, env vars
├── abi/
│   ├── overlayer.ts   → Vault, Staking, OFT ABIs
│   └── erc20.ts       → Standard ERC20 ABI
├── actions/
│   ├── mint.ts        → Deposit stablecoin → Mint overlaid asset (T+/C+)
│   ├── stake.ts       → Stake overlaid asset → Get staking shares (sT+/sC+)
│   ├── bridge.ts      → Bridge via LayerZero OFT cross-chain
│   └── send.ts        → Send/Receive tokens between wallets
└── utils/
    └── helpers.ts     → Wallet, provider, logging utilities
```

## Contract Addresses

### Ethereum Sepolia
| Token | Type | Address |
|-------|------|---------|
| T+ | USDT Overlaid | 0xe20534a32F9162488a90026F268a74fBE28d272D |
| sT+ | USDT Staking | 0x079a4Bf1Cbd0E4ce15391340cB46efA6396aBc82 |
| C+ | USDC Overlaid | 0xE815718D44694ec4637CB775C468d87f6e15B538 |
| sC+ | USDC Staking | 0x753937137Eb92871A6F3517514d4f1Ee860e3FDF |

### Base Sepolia
| Token | Type | Address |
|-------|------|---------|
| T+ | USDT Overlaid | 0xdE287B4a0918102511b027d53688c169fb308762 |
| sT+ | USDT Staking | 0x5BBc62c58C3b23566488fdFa78455ea00C31a76C |
| C+ | USDC Overlaid | 0x92f36E427a9579fe1356f19c74eb5d64bEae8930 |
| sC+ | USDC Staking | 0xD3bE3A1EA873d96533510Edd93a62CC28AC6964B |

## Notes

- **2 wallets required**: PRIVATE_KEY (main) and PRIVATE_KEY_2 (for send/receive)
- Both wallets need Sepolia ETH for gas
- Get testnet USDC from https://faucet.circle.com/
- The bot splits transactions to hit the 45 daily TX minimum
- TX_DELAY controls wait time between transactions (default 5s)
