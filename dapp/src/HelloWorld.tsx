import { Box, Button } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  useAccount,
  useConnect,
  useContract,
  useDisconnect,
  useProvider,
  useSigner,
} from 'wagmi'

const DEPLOYMENT_ADDRESS = '0xd22D1FF709E7C220eCDa6F3c98dBd3863Cd2e661'
const ABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: '_greeting',
        type: 'string',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'greet',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_greeting',
        type: 'string',
      },
    ],
    name: 'setGreeting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const HelloWorld = () => {
  const { address } = useAccount()
  const { connect } = useConnect()
  const provider = useProvider()
  const { data: signer } = useSigner()
  const { disconnect } = useDisconnect()

  const contract = useContract({
    address: DEPLOYMENT_ADDRESS,
    abi: ABI,
    signerOrProvider: provider,
  })

  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    if (contract && signer && provider) {
      contract?.greet().then(setGreeting)
    }
  }, [contract, signer, provider])

  console.log({ contract, greeting, signer, provider })

  return (
    <Box>
      <Box>{greeting} World</Box>
      {address ? (
        <Box>
          Connected to {address}
          <Button onClick={() => disconnect()}>Disconnect</Button>
        </Box>
      ) : (
        <Button onClick={() => connect()}>Connect Wallet</Button>
      )}
    </Box>
  )
}

export default HelloWorld
