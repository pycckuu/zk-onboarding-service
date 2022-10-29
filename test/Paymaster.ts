import { expect } from "chai";
import { Wallet, Provider, Contract, utils } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Paymaster } from "../typechain-types";
import {
  BigNumber,
  utils as eUtils,
  Transaction,
  ContractTransaction,
} from "ethers";

const RICH_WALLET_PK = process.env.PRIVATE_KEY!;

async function deployPaymaster(deployer: Deployer): Promise<Paymaster> {
  const artifact = await deployer.loadArtifact("Paymaster");
  return (await deployer.deploy(artifact)) as Paymaster;
}

async function deployGreeter(deployer: Deployer): Promise<Contract> {
  const artifact = await deployer.loadArtifact("Greeter");
  return await deployer.deploy(artifact, ["Hi"]);
}

async function printBalance(provider: Provider, wallet: Wallet): Promise<void> {
  console.log(
    `balance of ${wallet.address} is`,
    eUtils.formatEther(await provider.getBalance(wallet.address))
  );
}

async function topUpPaymaster(
  wallet: Wallet,
  paymasterAddress: string,
  value: BigNumber
): Promise<Transaction> {
  return await wallet.sendTransaction({
    to: paymasterAddress,
    value,
  });
}

// async function deployToken(deployer: Deployer): Promise<Contract> {
//   const artifact = await deployer.loadArtifact("MyERC20");
//   return await deployer.deploy(artifact, ["Hi"]);
// }

async function deploymentFixture() {
  const provider = new Provider(hre.config.zkSyncDeploy.zkSyncNetwork);
  const wallet = new Wallet(RICH_WALLET_PK, provider);
  await printBalance(provider, wallet);

  const deployer = new Deployer(hre, wallet);

  const greeter = await deployGreeter(deployer);
  console.log("greeter address: ", greeter.address);

  const emptyWallet = Wallet.createRandom().connect(provider);
  console.log("random wallet address: ", emptyWallet.address);

  const paymaster = await deployPaymaster(deployer);

  // Estimate gas fee for mint transaction
  const gasLimit = await greeter.estimateGas.setGreeting("Hi, Lisbon!", {
    customData: {
      ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
      paymasterParams: {
        paymaster: paymaster.address,
        // empty input as our paymaster doesn't require additional data
        paymasterInput: "0x",
      },
    },
  });

  const gasPrice = await provider.getGasPrice();
  // const fee = gasPrice.mul(gasLimit.toString());
  console.log("gasLimit", gasLimit.toString());

  console.log(
    "paymaster balance: ",
    (await provider.getBalance(paymaster.address)).toString()
  );

  console.log("paymaster address: ", paymaster.address);

  const paymasterParams = utils.getPaymasterParams(paymaster.address, {
    type: "General",
    innerInput: "0x",
  });

  const txParams = {
    // Provide gas params manually
    maxFeePerGas: gasPrice,
    maxPriorityFeePerGas: gasPrice,
    gasLimit,

    // paymaster info
    customData: {
      paymasterParams,
      ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
    },
  };
  return {
    paymasterParams,
    greeter,
    emptyWallet,
    gasPrice,
    gasLimit,
    provider,
    wallet,
    paymaster,
    txParams,
  };
}

async function fundContractAndSetN(
  paymaster: Paymaster,
  sponsor: Wallet,
  sponsoredContractAddress: string,
  value: BigNumber,
  n: number
): Promise<ContractTransaction> {
  const tx = await paymaster
    .connect(sponsor)
    .sponsorAddress(sponsoredContractAddress, n, { value });
  return await tx.wait();
}

async function estimateGasForTx(
  provider: Provider,
  greeter: Contract,
  paymasterAddress: string
): Promise<BigNumber> {
  const gasPrice = await provider.getGasPrice();
  const gasLimit = await greeter.estimateGas.setGreeting("Hi, Lisbon!", {
    customData: {
      ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
      paymasterParams: {
        paymaster: paymasterAddress,
        // empty input as our paymaster doesn't require additional data
        paymasterInput: "0x",
      },
    },
  });

  return gasPrice.mul(gasLimit.toString());
}

describe("Paymaster", async function () {
  describe("Free transactions", function () {
    it.only("empty wallet can send N=2 free tx to sponsorred address", async function () {
      const { greeter, emptyWallet, provider, wallet, paymaster, txParams } =
        await deploymentFixture();

      const txCost = await estimateGasForTx(
        provider,
        greeter,
        paymaster.address
      );

      await fundContractAndSetN(
        paymaster,
        wallet,
        greeter.address,
        txCost.mul(2),
        2
      );

      await (
        await greeter
          .connect(emptyWallet)
          .setGreeting("Hi, Lisbon again!", txParams)
      ).wait();

      await printBalance(provider, wallet);

      expect(await greeter.greet()).to.eq("Hi, Lisbon again!");

      console.log(
        "txCount",
        (await paymaster.getMyCount(greeter.address)).toString()
      );
    });
  });

  describe("Sponsoring", function () {
    it("anyone can be sponsor if it is not set", async function () {});
    it("sponsor cannot be changed", async function () {});
    it("anyone can fund sponsored address", async function () {});
    it("sponsor stop sponsorship and can withdraw funds", async function () {});
  });
});
