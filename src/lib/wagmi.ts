import { http, createConfig } from 'wagmi'
import { polygon, polygonAmoy } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'
import { getRpcUrl } from './config'

export const config = createConfig({
  chains: [polygon, polygonAmoy],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Yield Market',
        url: 'https://yieldmarket.org',
        iconUrl: 'https://yieldmarket.org/favicon.ico',
      },
    }),
  ],
  transports: {
    [polygon.id]: http(getRpcUrl(137)),
    [polygonAmoy.id]: http(getRpcUrl(80002)),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}