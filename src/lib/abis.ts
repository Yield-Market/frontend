// Contract ABIs - Essential functions for frontend interaction
import { parseAbi } from 'viem'

export const YM_VAULT_ABI = parseAbi([
  // Read functions
  'function conditionId() view returns (bytes32)',
  'function yesPositionId() view returns (uint256)',
  'function noPositionId() view returns (uint256)',
  'function totalYesDeposits() view returns (uint256)',
  'function totalNoDeposits() view returns (uint256)',
  'function totalMatched() view returns (uint256)',
  'function totalYielding() view returns (uint256)',
  'function isResolved() view returns (bool)',
  'function yesWon() view returns (bool)',
  'function finalPayoutRatio() view returns (uint256)',
  // Balance helpers (either custom getters or public mapping accessors)
  'function getYesYBalance(address user) view returns (uint256)',
  'function getNoYBalance(address user) view returns (uint256)',
  'function yesYTokens(address user) view returns (uint256)',
  'function noYTokens(address user) view returns (uint256)',
  'function getYieldStatus() view returns (uint256 totalATokens, uint256 totalCollateral, uint256 accruedYield)',
  'function estimateWithdrawal(address user) view returns (uint256)',
  
  // Write functions
  'function withdrawYesTokens(uint256 amount)',
  'function withdrawNoTokens(uint256 amount)',
  'function withdraw()',
  'function withdraw(address to)',
  'function resolveMarket()',
  
  // Events
  'event YesTokenDeposited(address indexed user, uint256 amount, uint256 yesYMinted)',
  'event NoTokenDeposited(address indexed user, uint256 amount, uint256 noYMinted)',
  'event YesTokenWithdrawn(address indexed user, uint256 amount)',
  'event NoTokenWithdrawn(address indexed user, uint256 amount)',
  'event PositionsMatched(uint256 amount, uint256 usdcGenerated)',
  'event YieldDeposited(uint256 amount, uint256 aTokensReceived)',
  'event MarketResolved(bool yesWon, uint256 payoutRatio)',
  'event Withdrawal(address indexed user, uint256 yesYBurned, uint256 noYBurned, uint256 usdcReceived)'
])

// Legacy ABI for backward compatibility
export const MARKET_VAULT_ABI = YM_VAULT_ABI

export const CONDITIONAL_TOKENS_ABI = parseAbi([
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function splitPosition(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)',
  'function mergePositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)',
  'function redeemPositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] indexSets)',
  'function getPositionId(address collateralToken, bytes32 collectionId, bytes32 conditionId, uint256 outcomeIndex) view returns (uint256)',
  'function conditionExists(bytes32 conditionId) view returns (bool)',
  'function prepareCondition(address oracle, bytes32 questionId, uint256 outcomeSlotCount)',
  'function payoutDenominator(bytes32 conditionId) external view returns (uint)',
  'function payoutNumerators(bytes32 conditionId, uint256 index) external view returns (uint)',
  'function getOutcomeSlotCount(bytes32 conditionId) external view returns (uint)',

  // Events
  'event ConditionPreparation(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount)',
  'event PositionSplit(address indexed stakeholder, address collateralToken, bytes32 indexed parentCollectionId, bytes32 indexed conditionId, uint256[] partition, uint256 amount)',
  'event PositionsMerge(address indexed stakeholder, address collateralToken, bytes32 indexed parentCollectionId, bytes32 indexed conditionId, uint256[] partition, uint256 amount)',
  'event PayoutRedemption(address indexed redeemer, address indexed collateralToken, bytes32 indexed parentCollectionId, bytes32 conditionId, uint256[] indexSets, uint256 payout)',
  'event ConditionResolution( bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint outcomeSlotCount, uint[] payoutNumerators)'
])

export const OUTCOME_YIELD_TOKEN_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
])

// Minimal Gnosis Safe ABI for executing a transaction
export const SAFE_ABI = parseAbi([
  'function getThreshold() view returns (uint256)',
  'function getOwners() view returns (address[])',
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) returns (bool success)'
])

// Minimal Polymarket CLOB Exchange events ABI (for waiting fills locally or on 137)
export const CLOB_EXCHANGE_EVENTS_ABI = parseAbi([
  'event OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)',
  'event OrdersMatched(bytes32 indexed takerOrderHash, address indexed takerOrderMaker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled)'
])

export const MOCK_USDC_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function faucet()',
  'function mint(address to, uint256 amount)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
])