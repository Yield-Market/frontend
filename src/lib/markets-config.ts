import { MarketInfo, MarketCategory, MarketStatus } from '@/types'
// import { getContractAddress } from '@/lib/config' // Removed unused

// Multi-market Configuration
export const MARKETS_CONFIG: MarketInfo[] = [
  {
    slug: 'btc-above-100k-till-2025-end',
    conditionId: '0xa76a7ecac374e7e37f9dd7eacda947793f23d2886ffe0dc28fcc081a7f61423c',
    collateralToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
    yesPositionId: '38880531420851293294206408195662191626124315938743706007994446557347938404169',
    noPositionId: '8902773313329801867635874809325551791076524253457589174917607919810586320674',
    yieldStrategy: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // AAVE strategy address
    feeBps: 0, // 0% fee
    feeCollector: '0x0000000000000000000000000000000000000000',
    ymVaultAddress: '0xac10F0c144D987c5Ef9d30eceF1330323d8e5C47', // YM Vault address
    question: 'Will Bitcoin dip below $100k before 2026?',
    category: MarketCategory.Crypto,
    status: MarketStatus.Open,
    endTime: new Date('2025-12-31T23:59:59.999Z').getTime() / 1000,
    createdAt: new Date('2025-07-14T21:02:13.199135Z').getTime() / 1000,
    usdcBalance: 0, // Will be updated from contract
    clob: {
      tokenIdYes: '38880531420851293294206408195662191626124315938743706007994446557347938404169',
      tokenIdNo: '8902773313329801867635874809325551791076524253457589174917607919810586320674',
      tickSize: '0.01',
      negRisk: false
    },
    expectedApy: 5.0 // Expected 5% APY from AAVE
  },
  {
    slug: 'ethereum-all-time-high-by-september-30',
    conditionId: '0x20d4f65ffc90fdea0332de4737411388e89d5fd37572d124b42f64427424d01e',
    collateralToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
    yesPositionId: '71287908215328385101243686516545514858979037224060325310874110368820268322602',
    noPositionId: '73577829751434584490325969575598204407858161556711771005899527705770966560534',
    yieldStrategy: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // AAVE strategy address
    feeBps: 0, // 0% fee
    feeCollector: '0x0000000000000000000000000000000000000000',
    ymVaultAddress: '0xF588FA3154ACe84DBbccAaFa1c9aEf8E48F09389', // YM Vault address
    question: 'Ethereum all time high by September 30?',
    category: MarketCategory.Crypto,
    status: MarketStatus.Open,
    endTime: new Date('2025-10-01T04:00:00Z').getTime() / 1000,
    createdAt: new Date('2025-09-12T18:43:29.341463Z').getTime() / 1000,
    usdcBalance: 0, // Will be updated from contract
    clob: {
      tokenIdYes: '71287908215328385101243686516545514858979037224060325310874110368820268322602',
      tokenIdNo: '73577829751434584490325969575598204407858161556711771005899527705770966560534',
      tickSize: '0.01',
      negRisk: false
    },
    expectedApy: 5.0 // Expected 5% APY from AAVE
  },
  {
    slug: 'dogecoin-all-time-high-before-2026',
    conditionId: '0x94f3b700e10d974d9b571b6c98e6fb658ce69cbcfcf57f8d54ff800d3a2a0f19',
    collateralToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
    yesPositionId: '15039659828541293785211004728324821300190016086130262041626710325455209031990',
    noPositionId: '81204160537787845181699193749235809600864273503816425834349855505215440863165',
    yieldStrategy: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // AAVE strategy address
    feeBps: 0, // 0% fee
    feeCollector: '0x0000000000000000000000000000000000000000',
    ymVaultAddress: '0xadF5Fb89022d54DBf2099d831eb13cF267547529', // YM Vault address
    question: 'Dogecoin all time high before 2026?',
    category: MarketCategory.Crypto,
    status: MarketStatus.Open,
    endTime: new Date('2025-12-31T12:00:00Z').getTime() / 1000,
    createdAt: new Date('2025-03-13T15:34:35.048725Z').getTime() / 1000,
    usdcBalance: 0, // Will be updated from contract
    clob: {
      tokenIdYes: '15039659828541293785211004728324821300190016086130262041626710325455209031990',
      tokenIdNo: '81204160537787845181699193749235809600864273503816425834349855505215440863165',
      tickSize: '0.001',
      negRisk: false
    },
    expectedApy: 5.0 // Expected 5% APY from AAVE
  },
  {
    slug: 'will-trump-pardon-changpeng-zhao-by-september-30',
    conditionId: '0x87d40b8131f2720d90235d8fa8e94b3acba8671b5bf94f6a48a3366684220bda',
    collateralToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
    yesPositionId: '64198885426011547532599716642543176190216105584458400729471673552804291327648',
    noPositionId: '106791290077455579039045683723549617186440013815866034029690507361228666394818',
    yieldStrategy: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // AAVE strategy address
    feeBps: 0, // 0% fee
    feeCollector: '0x0000000000000000000000000000000000000000',
    ymVaultAddress: '0x80CCBF571F5b81439648dd90a80B845ac3E4B1c1', // YM Vault address
    question: 'Will Trump pardon Changpeng Zhao by September 30?',
    category: MarketCategory.Political,
    status: MarketStatus.Open,
    endTime: new Date('2025-09-30T00:00:00Z').getTime() / 1000,
    createdAt: new Date('2025-09-02T00:56:13.487616Z').getTime() / 1000,
    usdcBalance: 0, // Will be updated from contract
    clob: {
      tokenIdYes: '64198885426011547532599716642543176190216105584458400729471673552804291327648',
      tokenIdNo: '106791290077455579039045683723549617186440013815866034029690507361228666394818',
      tickSize: '0.01',
      negRisk: false
    },
    expectedApy: 5.0 // Expected 5% APY from AAVE
  },
  {
    slug: 'hyperliquid-daily-fees-above-8m-in-2025',
    conditionId: '0x8eff77c559ceb1141d32741d418b923b613b84d5a6e701d22466bb374b20156a',
    collateralToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
    yesPositionId: '97257759985013402617661559388768149128799929108374480474885228293016665796689',
    noPositionId: '88747915775193520968087293930277588686308934898905310163489992909007647305232',
    yieldStrategy: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // AAVE strategy address
    feeBps: 0, // 0% fee
    feeCollector: '0x0000000000000000000000000000000000000000',
    ymVaultAddress: '0x8ffd58163cFB4a4CFABE02dceb2F8f320F257f04', // YM Vault address
    question: 'Hyperliquid daily fees above $8M in 2025?',
    category: MarketCategory.Crypto,
    status: MarketStatus.Open,
    endTime: new Date('2025-12-31T00:00:00Z').getTime() / 1000,
    createdAt: new Date('2025-07-15T16:24:41.284961Z').getTime() / 1000,
    usdcBalance: 0, // Will be updated from contract
    clob: {
      tokenIdYes: '97257759985013402617661559388768149128799929108374480474885228293016665796689',
      tokenIdNo: '88747915775193520968087293930277588686308934898905310163489992909007647305232',
      tickSize: '0.01',
      negRisk: false
    },
    expectedApy: 5.0 // Expected 5% APY from AAVE
  }
]

// Get market configuration
export function getMarketConfig(marketSlug: string): MarketInfo | undefined {
  return MARKETS_CONFIG.find(market => market.slug === marketSlug)
}

// Get all markets
export function getAllMarkets(): MarketInfo[] {
  return MARKETS_CONFIG
}

// Get markets by category
export function getMarketsByCategory(category: MarketCategory): MarketInfo[] {
  return MARKETS_CONFIG.filter(market => market.category === category)
}

// Get active markets
export function getActiveMarkets(): MarketInfo[] {
  return MARKETS_CONFIG.filter(market => market.status === MarketStatus.Open)
}

// Get default market (first market)
export function getDefaultMarket(): MarketInfo {
  return MARKETS_CONFIG[0]
}