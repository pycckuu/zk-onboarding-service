import { expect } from "chai";
import { Wallet, Provider, Contract } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Paymaster } from "../typechain-types";

const RICH_WALLET_PK = process.env.PRIVATE_KEY!;

async function deployPaymaster(deployer: Deployer): Promise<Paymaster> {
  const artifact = await deployer.loadArtifact("Paymaster");
  return (await deployer.deploy(artifact)) as Paymaster;
}

async function deployGreeter(deployer: Deployer): Promise<Contract> {
  const artifact = await deployer.loadArtifact("Greeter");
  return await deployer.deploy(artifact, ["Hi"]);
}

// async function deployToken(deployer: Deployer): Promise<Contract> {
//   const artifact = await deployer.loadArtifact("MyERC20");
//   return await deployer.deploy(artifact, ["Hi"]);
// }

describe("Paymaster", function () {
  it("Should return the new greeting once it's changed", async function () {
    const provider = new Provider(hre.config.zkSyncDeploy.zkSyncNetwork);

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, wallet);

    const greeter = await deployGreeter(deployer);
    console.log("greeter address: ", greeter.address);

    const randomWallet = Wallet.createRandom().connect(provider);
    console.log("random wallet address: ", randomWallet.address);

    const paymaster = await deployPaymaster(deployer);

    const tx = await greeter.connect(randomWallet).setGreeting("Hola, mundo!", {
      paymasterParams: {
        paymaster: paymaster.address,
        // empty input as our paymaster doesn't require additional data
        paymasterInput: "0x",
      },
    });
    // wait until the transaction is mined
    await tx.wait();
    console.log("tx.hash", tx.hash);

    // const paymaster = await deployPaymaster(deployer);

    // await paymaster.wait();

    // expect(paymaster.address.startsWith("0x")).to.be.true;
  });
});
