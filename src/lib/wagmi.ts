import { http, createConfig } from 'wagmi'
import { polygon, polygonAmoy } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'
import { defineChain } from 'viem'
import { getRpcUrl } from './config'

// Define local Polygon fork chain (use 1337 to avoid id collision with mainnet 137)
const localPolygonFork = defineChain({
  id: 1337,
  name: 'Local Polygon Fork',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: [getRpcUrl(1337)],
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://127.0.0.1:8545' },
  },
})

export const config = createConfig({
  chains: [localPolygonFork, polygon, polygonAmoy],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Yield Market',
        url: 'http://localhost:3000',
        iconUrl: 'http://localhost:3000/favicon.ico',
      },
    }),
  ],
  transports: {
    [localPolygonFork.id]: http(getRpcUrl(1337)),
    [polygon.id]: http(getRpcUrl(137)),
    [polygonAmoy.id]: http(getRpcUrl(80002)),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}