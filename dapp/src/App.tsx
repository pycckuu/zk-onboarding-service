import React, { useEffect } from 'react'
import { WagmiConfig, createClient } from 'wagmi'
import { BigNumber, getDefaultProvider, utils } from 'ethers'
import { Box } from '@mui/material'
import './App.scss'
import { Store } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import HelloWorld from './HelloWorls'

function bnStrToNumber(bnStr: string): number {
  return BigNumber.from(bnStr).toNumber()
}

function formatEther(bignum: BigNumber | null): string | null {
  return bignum && Number(utils.formatEther(bignum)).toFixed(2)
}

function notify(title: string, message: string, type: 'success' | 'danger') {
  Store.addNotification({
    title,
    message,
    type,
    insert: 'top',
    container: 'top-center',
    animationIn: ['animated', 'fadeIn'],
    animationOut: ['animated', 'fadeOut'],
    dismiss: {
      duration: 3000,
      onScreen: true,
    },
  })
}

function App() {
  const client = createClient({
    autoConnect: true,
    provider: getDefaultProvider(),
  })

  return (
    <WagmiConfig client={client}>
      <Box className="App">ZKSync Onboarding Station Dapp</Box>
      <HelloWorld />
    </WagmiConfig>
  )
}

export default App
