import { config as dotenvConfig } from "dotenv";
import {
  NetworkUserConfig,
  HttpNetworkAccountsUserConfig,
} from "hardhat/types";
dotenvConfig();

require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");

type NetworkName = string;

const INFURA_ENDPOINTS: { [name: string]: string } = {
  mainnet: "https://mainnet.infura.io/v3/",
  rinkeby: "https://rinkeby.infura.io/v3/",
  goerli: "https://goerli.infura.io/v3/",
  kovan: "https://kovan.infura.io/v3/",
  ropsten: "https://ropsten.infura.io/v3/",

  polygon: "https://polygon-mainnet.infura.io/v3/",
  mumbai: "https://polygon-mumbai.infura.io/v3/",
};

const CHAIN_IDS: { [name: string]: number } = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  mumbai: 80001,
  polygon: 137,
  rinkeby: 4,
  ropsten: 3,
};

function getAccounts(network: string): HttpNetworkAccountsUserConfig {
  if (process.env.PRIVATE_KEY) {
    return [process.env.PRIVATE_KEY];
  }
  return {
    count: 5,
    initialIndex: 0,
    mnemonic: getMnemonic(network),
    path: "m/44'/60'/0'/0",
  };
}

function createNetworkConfig(
  network: string,
  extraOpts = {}
): NetworkUserConfig {
  return Object.assign(
    {
      accounts: getAccounts(network),
      // @ts-ignore
      chainId: CHAIN_IDS[network],
      timeout: 99999,
      url: getRpcUrl(network),
    },
    extraOpts
  );
}

function getMnemonic(network: NetworkName): string {
  if (process.env.HARDHAT_NO_MNEMONIC) {
    // dummy mnemonic
    return "any pig at zoo eat toy now ten men see job run";
  }
  if (process.env.MNEMONIC) return process.env.MNEMONIC;
  try {
    return require("./mnemonic.js");
  } catch (error) {
    throw new Error(`Please set your MNEMONIC (for network: ${network})`);
  }
}

function getRpcUrl(network: NetworkName): string {
  if (process.env.INFURA_API_KEY && INFURA_ENDPOINTS[network])
    return INFURA_ENDPOINTS[network] + process.env.INFURA_API_KEY;
  if (network === "mumbai") return "https://rpc-mumbai.maticvigil.com/";
  if (network === "polygon") return "https://polygon-rpc.com/";
  return "undefined RPC provider URL";
}

module.exports = {
  zksolc: {
    version: "1.2.0",
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
      },
      experimental: {
        dockerImage: "matterlabs/zksolc",
        tag: "v1.2.0",
      },
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: "https://zksync2-testnet.zksync.dev",
    // ethNetwork: "goerli", // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
    ethNetwork: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
  },
  networks: {
    hardhat: {
      zksync: true,
    },
    goerli: createNetworkConfig("goerli"),
  },
  solidity: {
    version: "0.8.16",
  },
};
