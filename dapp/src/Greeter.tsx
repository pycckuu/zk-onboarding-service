import React, { useEffect, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import background from './images/background.jpg'
import { BigNumber, constants, utils as eUtils } from 'ethers'
import { Contract, Wallet, Provider, utils } from 'zksync-web3'
import { Button, Box, Input } from '@mui/material'
import { InjectedConnector } from '@web3-react/injected-connector'
import './App.scss'
import { ReactNotifications } from 'react-notifications-component'
import { Store } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'

const injected = new InjectedConnector({
  supportedChainIds: [280],
})

const PAYMASTER_ADDRESS = '0xfE56376d7b95A436273BE222aD0b7f457e5f80A1'
const GREETER_ADDRESS = '0xD65E24C936D6649b4Adbe9b66a2E0c48258aa6d3'

const PAYMASTER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_spnosorredAddr',
        type: 'address',
      },
    ],
    name: 'getMyCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const GREETER_ABI = [
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

function bnStrToNumber(bnStr: string): number {
  return BigNumber.from(bnStr).toNumber()
}

function formatEther(bignum: BigNumber | null): string | null {
  return bignum && Number(eUtils.formatEther(bignum)).toFixed(2)
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

function Greeter() {
  const { active, account, library, connector, activate } = useWeb3React()

  const [txCount, setTxCount] = React.useState<number | undefined>(undefined)
  const [addressInput, setAddressInput] = React.useState<string | undefined>(
    undefined
  )
  const [balanceEth, setBalanceEth] = React.useState<BigNumber>(constants.Zero)
  const [contract, setContract] = React.useState<Contract | null>(null)
  const [greeterContract, setGreeterContract] = React.useState<Contract | null>(
    null
  )

  const [greeting, setGreeting] = React.useState<string | null>(null)

  async function connect() {
    try {
      await activate(injected)
      notify('Connected', 'You are connected to the blockchain', 'success')
    } catch (ex) {
      console.debug(ex)
    }
  }

  // async function getBalance() {
  const getBalance = useCallback(async () => {
    const balance = await library.getBalance(account)
    setBalanceEth(balance || constants.Zero)
    const c = new Contract(
      PAYMASTER_ADDRESS,
      PAYMASTER_ABI,
      library?.getSigner()
    ) as Contract
    setContract(c)

    const greeter = new Contract(
      GREETER_ADDRESS,
      GREETER_ABI,
      library?.getSigner()
    ) as Contract
    setGreeterContract(greeter)

    const greeting = await greeter.greet()
    setGreeting(greeting)

    const txCount = await c.getMyCount(account)
    setTxCount(bnStrToNumber(txCount))
  }, [account, library])

  useEffect(() => {
    if (!active) {
      return
    }

    getBalance()
  }, [active, account, library, connector, getBalance])

  const onClick = async () => {
    if (!greeterContract) {
      return
    }

    if (!contract) {
      return
    }

    try {
      const gasPrice = await library.getGasPrice()
      console.debug('gasPrice', gasPrice.toString())
      const gasLimit = await greeterContract.estimateGas.setGreeting(greeting, {
        customData: {
          ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
          paymasterParams: {
            paymaster: contract.address,
            paymasterInput: '0x',
          },
        },
      })

      console.debug('gasLimit', gasLimit.toString())

      const paymasterParams = utils.getPaymasterParams(contract.address, {
        type: 'General',
        innerInput: '0x',
      })

      const txParams = {
        // Provide gas params manually
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: constants.Zero,
        gasLimit,

        // paymaster info
        customData: {
          ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
          paymasterParams,
        },
      }

      const tx = await greeterContract.setGreeting(greeting, txParams)
      await tx.wait()
      console.debug('tx', tx.hash)
      notify(
        'Bravo!',
        'You just sent us your moneyz!! Hash: ' + tx.hash,
        'success'
      )
      getBalance()
    } catch (ex: any) {
      console.debug(ex)
      notify('Oops!', 'Something went wrong. ' + ex.message, 'danger')
    }
  }

  const handleAddressInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressInput(e.target.value)
  }

  return (
    <Box className="App">
      <ReactNotifications />
      <Box
        className="App-header"
        sx={{
          backgroundImage: `url(${background})`,
        }}
      >
        <Box className="content">
          <Box className={'title'}>Greeter Dapp</Box>
          <Box className="stats">
            <Box className={'stat'}>
              <Box className={'stat-title'}>Greeting</Box>
              <Box className={'stat-value'}>{greeting}</Box>
            </Box>
            <Box className={'stat'}>
              <Box className={'stat-title'}>Your Balance</Box>
              <Box className={'stat-value'}>
                <span>{formatEther(balanceEth)} ETH</span>
              </Box>
            </Box>
            <Box className={'stat'}>
              <Box className={'stat-title'}>My TX Count</Box>
              <Box className={'stat-value'}>
                <span>{txCount}</span>
              </Box>
            </Box>
          </Box>
          <Box className="stats"></Box>
          <Box className="contribution">
            <Input
              className={'input'}
              value={addressInput}
              onChange={handleAddressInput}
              placeholder={'Enter Greeting'}
            />
            {active ? (
              <Button
                variant="contained"
                component="label"
                className="button"
                onClick={onClick}
              >
                SET GREETING
              </Button>
            ) : (
              <Button
                variant="contained"
                component="label"
                className="button"
                onClick={connect}
              >
                Connect
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Greeter
