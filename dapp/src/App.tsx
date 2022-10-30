import React, { useEffect } from 'react'
import { WagmiConfig, createClient, configureChains, Chain } from 'wagmi'
// import {  } from 'zksync-web3'
import './App.scss'
import 'react-notifications-component/dist/theme.css'
import HelloWorld from './HelloWorld'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Patron from './Patron'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Patron />,
  },
  {
    path: '/greeter',
    element: <HelloWorld />,
  },
])

const zkSyncChain: Chain = {
  id: 280,
  name: 'zkSync Testnet',
  network: 'zkSync Testnet',

  /** Collection of RPC endpoints */
  rpcUrls: {
    default: 'https://zksync2-testnet.zksync.dev',
  },
  testnet: true,
}

function App() {
  const { provider } = configureChains(
    [zkSyncChain],
    [
      jsonRpcProvider({
        rpc: (chain) => ({
          http: zkSyncChain.rpcUrls.default,
        }),
      }),
    ]
  )

  const client = createClient({
    autoConnect: true,
    provider,
  })

  return (
    <WagmiConfig client={client}>
      <RouterProvider router={router} />
    </WagmiConfig>
  )
}

export default App
