# Yield Market Frontend

A Next.js application for interacting with the Yield Market Bridge (Y-M) smart contracts on Polygon.

## Features

- **Multi-Market Support**: Switch between multiple prediction markets with different questions and categories
- **Market Categories**: Organized markets by category (Crypto, Political, Sports, Weather, Economics, Technology)
- **Market Selector**: Easy-to-use dropdown to switch between available markets
- **Polygon Network Integration**: Connect wallets and interact with Polygon blockchain
- **Market Interface**: View and interact with prediction markets
- **Real-time Market Statistics**: Live volume, yielding, and idle calculations from smart contracts
- **Dynamic Odds**: Real-time odds calculated from actual market deposits
- **Two-Step Trading Process**: Buy tokens from Polymarket and automatically transfer to YM Vault
- **Yield Token Management**: Deposit outcome tokens and earn yield
- **Portfolio Tracking**: Monitor positions across multiple markets
- **Activity History**: View transaction history and contract events
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: wagmi + viem for blockchain interaction
- **State Management**: TanStack Query
- **Wallet Support**: MetaMask, WalletConnect, and injected wallets

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Web3 wallet (MetaMask recommended)
- Access to Polygon network

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Smart Contract Integration

The frontend integrates with the Y-M smart contracts on your local Polygon fork (port 8545). The application supports:

### Core Features
- **Real-time Balance Queries**: Fetches user balances from ConditionalTokens and YMVault contracts
- **Token Deposits**: Deposit YES/NO outcome tokens to receive yield-bearing versions
- **Token Withdrawals**: Withdraw tokens with accrued yield from AAVE
- **Market Resolution**: Admin interface to resolve markets and enable final withdrawals
- **Yield Tracking**: Real-time display of accrued yield from AAVE integration

### Contract Integration
- **YMVault Contract**: Main vault contract for yield market tokens
- **ConditionalTokens Contract**: Polymarket's conditional token system
- **MockUSDC Contract**: Test USDC token for local development
- **AAVE Integration**: Automatic yield generation through AAVE lending

### Multi-Market Configuration
The application supports multiple prediction markets with configurable parameters:
- **Market Management**: Each market has unique identifiers and configuration
- **Position IDs**: Unique identifiers for YES/NO positions in the conditional token system
- **Collection IDs**: Collection identifiers for YES/NO outcome tokens
- **Condition ID**: The condition that determines market resolution
- **Question ID**: Unique identifier for the market question
- **Market Categories**: Organized by category for easy filtering and discovery

### Market Statistics

The application displays real-time market statistics calculated from smart contract data:

#### Volume Calculation
- **Volume** = Total USDC held in the same market across Polymarket + YM
- **Yielding** = USDC held in YM (may be lent to AAVE for yield generation)
- **Idle** = USDC amount in a single market on Polymarket
- **Relationship**: Idle + Yielding = Volume

#### Dynamic Odds
- Odds are calculated in real-time from actual market deposits
- YES odds = 1 / YES price (where YES price = NO deposits / total deposits)
- NO odds = 1 / NO price (where NO price = YES deposits / total deposits)
- Odds update automatically as users deposit funds

#### Two-Step Trading Process
When users click "Buy YES" or "Buy NO", the application executes a two-step process:

1. **Step 1: Buy Token from Polymarket**
   - Calls `splitPosition` on Conditional Tokens contract
   - Converts USDC to YES/NO outcome tokens
   - Tokens are minted to user's wallet

2. **Step 2: Transfer to YM Vault**
   - Calls `safeTransferFrom` on Conditional Tokens contract
   - Transfers the purchased tokens to YM Vault
   - Tokens are now eligible for yield generation

The UI shows real-time progress for both steps with status indicators and error handling.

#### Available Markets
1. **Crypto**: "Will Bitcoin dip below $100k before 2026?"
   - Condition ID: `0xa76a7ecac374e7e37f9dd7eacda947793f23d2886ffe0dc28fcc081a7f61423c`
   - YES Position ID: `38880531420851293294206408195662191626124315938743706007994446557347938404169`
   - NO Position ID: `8902773313329801867635874809325551791076524253457589174917607919810586320674`
   - Question ID: `0x360e43dd63edb7e9dfb996b3d38f2d03cc17e685596a1da457a56e3c3b3a6ff2`
   - Market Maker: `0x97a5dB62072B88f661Ab6de7a025A51ba91736Be`
   - YM Vault: `0xB62eDe236841006b62558A87a793Ddc94e740DC4`
   - End Date: December 31, 2025

2. **Crypto**: "Ethereum all time high by September 30?"
   - Condition ID: `0x20d4f65ffc90fdea0332de4737411388e89d5fd37572d124b42f64427424d01e`
   - YES Position ID: `71287908215328385101243686516545514858979037224060325310874110368820268322602`
   - NO Position ID: `73577829751434584490325969575598204407858161556711771005899527705770966560534`
   - Question ID: `0x53a413d23d89c0f5e32ee78524421ed88857101faad97e8dd5b323fffd70192d`
   - Submitted By: `0x91430CaD2d3975766499717fA0D66A78D814E5c5`
   - Resolved By: `0x65070BE91477460D8A7AeEb94ef92fe056C2f2A7`
   - YM Vault: `0xB62eDe236841006b62558A87a793Ddc94e740DC4`
   - End Date: October 1, 2025

3. **Crypto**: "Dogecoin all time high before 2026?"
   - Condition ID: `0x94f3b700e10d974d9b571b6c98e6fb658ce69cbcfcf57f8d54ff800d3a2a0f19`
   - YES Position ID: `15039659828541293785211004728324821300190016086130262041626710325455209031990`
   - NO Position ID: `81204160537787845181699193749235809600864273503816425834349855505215440863165`
   - Question ID: `0xe9fdb9696971a6a3ee37f52a6f7908a1585693d6f84f0f2d26d272648359c1ed`
   - Submitted By: `0x91430CaD2d3975766499717fA0D66A78D814E5c5`
   - Resolved By: `0x6A9D222616C90FcA5754cd1333cFD9b7fb6a4F74`
   - YM Vault: `0xB62eDe236841006b62558A87a793Ddc94e740DC4`
   - End Date: December 31, 2025

4. **Political**: "Will Trump pardon Changpeng Zhao by September 30?"
   - Condition ID: `0x87d40b8131f2720d90235d8fa8e94b3acba8671b5bf94f6a48a3366684220bda`
   - YES Position ID: `64198885426011547532599716642543176190216105584458400729471673552804291327648`
   - NO Position ID: `106791290077455579039045683723549617186440013815866034029690507361228666394818`
   - Question ID: `0xfa739f0fcfb2e767657361a87b0cb7b95389af8ec14e90350940a05190ebc7d9`
   - Market Maker: `0x5734ECff3425744c1670b4ce07e30e00fd23E812`
   - Submitted By: `0x91430CaD2d3975766499717fA0D66A78D814E5c5`
   - Resolved By: `0x157Ce2d672854c848c9b79C49a8Cc6cc89176a49`
   - YM Vault: `0xB62eDe236841006b62558A87a793Ddc94e740DC4`
   - End Date: September 30, 2025

5. **Crypto**: "Hyperliquid daily fees above $8M in 2025?"
   - Condition ID: `0x8eff77c559ceb1141d32741d418b923b613b84d5a6e701d22466bb374b20156a`
   - YES Position ID: `97257759985013402617661559388768149128799929108374480474885228293016665796689`
   - NO Position ID: `88747915775193520968087293930277588686308934898905310163489992909007647305232`
   - Question ID: `0x16e9b081d0613bdc6f09ece124e47a6655fd15721023dea9995cdd3e09f78991`
   - Market Maker: `0x640f3F2222b0Ef195eF7AA1E73484Be431437241`
   - Submitted By: `0x91430CaD2d3975766499717fA0D66A78D814E5c5`
   - Resolved By: `0x157Ce2d672854c848c9b79C49a8Cc6cc89176a49`
   - YM Vault: `0xB62eDe236841006b62558A87a793Ddc94e740DC4`
   - End Date: December 31, 2025

#### Adding New Markets
To add new markets, update the `MARKETS_CONFIG` array in `src/lib/markets-config.ts` with the new market information.

### Network Support
- **Local Polygon Fork**: Primary development network (port 8545)
- **Polygon Mainnet**: Production deployment ready
- **Polygon Amoy Testnet**: Testnet support

See [../FRONTEND_DEPLOYMENT.md](../FRONTEND_DEPLOYMENT.md) for full deployment instructions.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
