export interface MarketInfo {
  slug: string
  conditionId: string
  collateralToken: string
  yesPositionId: string
  noPositionId: string
  yieldStrategy: string
  feeBps: number
  feeCollector: string
  // Optional per-market vault to receive ERC1155 deposits
  ymVaultAddress?: string
  question: string
  category: MarketCategory
  status: MarketStatus
  endTime?: number
  createdAt: number
  usdcBalance: number // USDC balance in this market contract
  // Optional CLOB related configuration for Polymarket
  clob?: {
    tokenIdYes?: string
    tokenIdNo?: string
    tickSize?: string
    negRisk?: boolean
  }
  // Optional expected APY for displaying yield estimates
  expectedApy?: number
}

export interface MarketData {
  vault: MarketInfo
  unpairedYes: bigint
  unpairedNo: bigint
  pairedYes: bigint
  pairedNo: bigint
  usdcPrincipal: bigint
  usdcBalance: bigint
  usdcDepositedToStrategy: bigint
  resolutionState: ResolutionState
  question: string
  yesYieldTokenAddress: string
  noYieldTokenAddress: string
}

export enum ResolutionState {
  Unresolved = 0,
  ResolvedYES = 1,
  ResolvedNO = 2,
}

export enum MarketCategory {
  Crypto = 'crypto',
  Political = 'political', 
  Weather = 'weather',
  Sports = 'sports',
  Economics = 'economics',
  Technology = 'technology',
  Other = 'other'
}

export enum MarketStatus {
  Open = 'open',
  Resolved = 'resolved', 
  Expired = 'expired',
  Paused = 'paused'
}

export interface SortOption {
  label: string
  value: 'date' | 'amount' | 'expiration' | 'alphabetical'
}

export interface FilterOption {
  label: string
  value: string
  count?: number
}

export interface UserPosition {
  yesDeposits: bigint
  noDeposits: bigint
  yesYieldBalance: bigint
  noYieldBalance: bigint
  yesOutcomeBalance: bigint
  noOutcomeBalance: bigint
  usdcBalance: bigint
}

export interface TransactionStatus {
  hash?: string
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
}

export interface MarketActivity {
  type: 'deposit' | 'withdraw' | 'pair' | 'claim' | 'resolve'
  user: string
  amount: bigint
  isYes?: boolean
  txHash: string
  timestamp: number
  blockNumber: number
}

export interface ClaimableAmount {
  fromVault: bigint
  viaPM: bigint
  total: bigint
}

export interface MarketConfig {
  markets: MarketInfo[]
  activeMarketId?: string
}

export interface MarketSelectorProps {
  markets: MarketInfo[]
  activeMarketId?: string
  onMarketSelect: (marketId: string) => void
}