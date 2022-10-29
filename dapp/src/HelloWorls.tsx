import { Box, Button } from '@mui/material'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'

const HelloWorld = () => {
    const { address } = useAccount()
    const { connect } = useConnect({
        connector: new InjectedConnector(),
    })
    const { disconnect } = useDisconnect()

    return (
        <Box>
            <Box>Hello World</Box>
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
