import React, { useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { BigNumber, constants, Contract, utils } from "ethers";
import { Box } from "@mui/material";
import { InjectedConnector } from "@web3-react/injected-connector";
import "./App.scss";
import { Store } from "react-notifications-component";
import "react-notifications-component/dist/theme.css";

const injected = new InjectedConnector({
  supportedChainIds: [5],
});

function bnStrToNumber(bnStr: string): number {
  return BigNumber.from(bnStr).toNumber();
}

function formatEther(bignum: BigNumber | null): string | null {
  return bignum && Number(utils.formatEther(bignum)).toFixed(2);
}

function notify(title: string, message: string, type: "success" | "danger") {
  Store.addNotification({
    title,
    message,
    type,
    insert: "top",
    container: "top-center",
    animationIn: ["animated", "fadeIn"],
    animationOut: ["animated", "fadeOut"],
    dismiss: {
      duration: 3000,
      onScreen: true,
    },
  });
}

function App() {
  const { active, account, library, connector, activate } = useWeb3React();

  return <Box className="App">ZKSync Onboarding Station Dapp</Box>;
}

export default App;
