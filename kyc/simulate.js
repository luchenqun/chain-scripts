// Implement the logic you need here
import { ethers } from "ethers";
import { ethToBech32 } from "@quarix/address-converter";
import { App, CosmosTxV1Beta1BroadcastMode } from "@quarix/provider";
import { createTxMsgGrantPremiumGasWaiver, createTx } from "@quarix/transactions";
import { createBasicGasAllowance } from "@quarix/proto";
import { Timestamp } from "@bufbuild/protobuf";
import fs from "fs-extra";
import * as dotenv from "dotenv";
import { calcFeeAmount } from "../utils.js";

export const main = async () => {
  // KycPermissionUseGasWaiver to be used whether users can call contract use gas waiver
  const KycPermissionUseGasWaiver = 1;
  // KycPermissionReceiveQareToken to be used whether users can receive qare tokens
  const KycPermissionReceiveQareToken = 2;
  // KycPermissionReceiveQrxToken to be used whether users can receive qrx tokens
  const KycPermissionReceiveQrxToken = 4;
  // KycPermissionReceiveQvoucherToken to be used whether users can receive qvoucher tokens
  const KycPermissionReceiveQvoucherToken = 8;
  // KycPermissionReceiveQvoucherToken to be used whether users can receive other tokens, for example ibc/atom, erc20/usdt, 2^1 ~ 2^39 for known native tokens
  const KycPermissionReceiveOtherNativeToken = 1099511627776;
  // KycPermissionAll the kyc issued by quarix has all permissions
  const KycPermissionAll = KycPermissionUseGasWaiver | KycPermissionReceiveQareToken | KycPermissionReceiveQrxToken | KycPermissionReceiveQvoucherToken | KycPermissionReceiveOtherNativeToken;

  try {
    dotenv.config();
    const { PROVIDER, API, SERVICE_PROVIDER_CONTRACT_PATH, SERVICE_WRAPPER_CONTRACT_PATH, QOE_KEY, ACCREDITOR_KEY, ISSUER_KEY, GRANTEE_KEY } = process.env;
    const PREFIX = "quarix";

    const serviceProvider = await fs.readJSON(SERVICE_PROVIDER_CONTRACT_PATH);
    const serviceWrapper = await fs.readJSON(SERVICE_WRAPPER_CONTRACT_PATH);

    const qoeKey = QOE_KEY; // 0x00000be6819f41400225702d32d3dd23663dd690
    const accreditorKey = ACCREDITOR_KEY; // 0x2222207b1f7b8d37566d9a2778732451dbfbc5d0
    const issuerKey = ISSUER_KEY; // 0x8888834da5fa77577e8a8e4479f51f7210a5f95e
    const granteeKey = GRANTEE_KEY; // 0x999992aB64F24f09aAa225B85556A48AB52aE7C6
    const provider = new ethers.JsonRpcProvider(PROVIDER);
    const roleAddress = "0x1000000022222222222222222222222222222222";
    const roleAbi = ["function attestRole(address to, string roleName) public returns(uint256)"];
    const serviceWrapperAddress = "0x1111111111111111111111111111111111120003";

    const qoeWallet = new ethers.Wallet(qoeKey, provider);
    const granteeWallet = new ethers.Wallet(granteeKey, provider);
    const accreditorWallet = new ethers.Wallet(accreditorKey, provider);
    const issuerWallet = new ethers.Wallet(issuerKey, provider);

    let tx;
    {
      // assgin a Developer role to issuer in order issuer can deploy contract
      console.log("call rbac contract function attestRole");
      const contractRole = new ethers.Contract(roleAddress, roleAbi, qoeWallet);
      tx = await contractRole.attestRole(issuerWallet.address, "Developer");
      await tx.wait();
    }

    const factoryServiceProvider = new ethers.ContractFactory(serviceProvider.abi, serviceProvider.bytecode, issuerWallet);
    const contractServiceProvider = await factoryServiceProvider.deploy();
    {
      console.log("\n");
      // issuer deploy a service provider contract
      // to simplify testing, we only deploy the service provider logic contract, no proxy and proxyAdmin contract
      console.log("deploy service provider contract");
      await contractServiceProvider.waitForDeployment();

      console.log("contract service provider address = ", contractServiceProvider.target);

      // initialize service provider
      console.log("call service provider contract function initialize");
      tx = await contractServiceProvider.initialize("name", "symbole", "baseURI", issuerWallet.address);
      await tx.wait();

      // give granter issuer role in order grantee can call contract service provider success
      console.log("call service provider contract function grantRole");
      tx = await contractServiceProvider.grantRole(await contractServiceProvider.ISSUER_ROLE(), issuerWallet.address);
      await tx.wait();

      // give grantee issuer role in order grantee can call contract service provider success
      console.log("call service provider contract function grantRole");
      tx = await contractServiceProvider.grantRole(await contractServiceProvider.ISSUER_ROLE(), granteeWallet.address);
      await tx.wait();

      // issue a kyc to grantee
      console.log("call service provider contract function mintTo");
      tx = await contractServiceProvider.mintTo(granteeWallet.address, 1888888888);
      await tx.wait();
    }

    const serviceProviderAddress = contractServiceProvider.target;
    const contractServiceWrapper = new ethers.Contract(serviceWrapperAddress, serviceWrapper.abi);
    {
      console.log("\n");
      // accreditor assign
      console.log("call service provider wrapper function assign");
      tx = await contractServiceWrapper.connect(accreditorWallet).assign(issuerWallet.address, "name", "uri", "email", "description", 4, 1849306088);
      await tx.wait();

      // issuer apply for service provider
      console.log("call service provider wrapper function applyFor");
      tx = await contractServiceWrapper.connect(issuerWallet).applyFor(serviceProviderAddress, 0);
      await tx.wait();

      // accreditor approve
      console.log("call service provider wrapper function approve");
      tx = await contractServiceWrapper.connect(accreditorWallet).approve(serviceProviderAddress);
      await tx.wait();

      // qoe set set service provider permissions, only have KycPermissionUseGasWaiver
      console.log("call service provider wrapper function setServiceProviderPermissions");
      tx = await contractServiceWrapper.connect(qoeWallet).setServiceProviderPermissions(serviceProviderAddress, KycPermissionUseGasWaiver);
      await tx.wait();
    }

    // issuer give gaswaiver to grantee
    {
      const baseURL = API;
      const app = new App({ baseURL });

      const chain = {
        chainId: 8888888,
        cosmosChainId: "quarix_8888888-1",
      };

      let privateKey = issuerKey;
      let sender = {
        accountAddress: ethToBech32(issuerWallet.address, PREFIX),
        sequence: "0",
        accountNumber: "0",
        pubkey: Buffer.from(issuerWallet.signingKey.compressedPublicKey.substring(2), "hex").toString("base64"),
      };
      const account = await app.auth.account(sender.accountAddress);
      sender.sequence = account.account.base_account.sequence;
      sender.accountNumber = account.account.base_account.account_number;

      const gas = "1000000";
      const amount = await calcFeeAmount(app, gas);
      let fee = {
        amount,
        denom: "aqare",
        gas,
      };

      const memo = "quarixjs test";

      // Update params based on the message you want to send
      const params = {
        granter: ethToBech32(issuerWallet.address, PREFIX),
        grantee: contractServiceProvider.target,
        account: ethToBech32(granteeWallet.address, PREFIX),
        allowance: createBasicGasAllowance("aqare", "500000000000000000000000", Timestamp.fromDate(new Date("2024-01-01"))),
      };

      {
        // use eip712 sign msg
        const context = { chain, sender, fee, memo };
        const txBytesBase64 = createTx(createTxMsgGrantPremiumGasWaiver, context, params, privateKey);
        const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
        console.log("\ngrantPremiumGasWaiver success");
        // console.log(JSON.stringify(result, undefined, 2));
      }
    }

    {
      // grentee can use gaswaiver
      console.log("\n");
      console.log("before use gaswaiver granter ", issuerWallet.address, " have balance ", await provider.getBalance(issuerWallet.address));
      console.log("before use gaswaiver grantee ", granteeWallet.address, " have balance ", await provider.getBalance(granteeWallet.address));
      const newExpiryDate = "2000000000";
      // test use gaswaiver
      console.log("call service provider contract function renew");
      tx = await contractServiceProvider.connect(granteeWallet).renew(granteeWallet.address, newExpiryDate);
      await tx.wait();

      const nowExpiryDate = await contractServiceProvider.expiryDateOf(granteeWallet.address);
      if (newExpiryDate !== nowExpiryDate.toString()) {
        console.error("error", newExpiryDate, nowExpiryDate);
      } else {
        console.log("grantee call renew success, illustrate grantee can use gaswaiver");
      }

      console.log("after  use gaswaiver granter ", issuerWallet.address, " have balance ", await provider.getBalance(issuerWallet.address), ", balance should decrease for grantee use gaswaiver!");
      console.log("after  use gaswaiver grantee ", granteeWallet.address, " have balance ", await provider.getBalance(granteeWallet.address));
    }

    {
      console.log("\n");
      // grentee can not receive native token
      console.log("before transfer granter ", issuerWallet.address, " have balance ", await provider.getBalance(issuerWallet.address));
      console.log("before transfer grantee ", granteeWallet.address, " have balance ", await provider.getBalance(granteeWallet.address));

      try {
        tx = await issuerWallet.sendTransaction({ to: granteeWallet.address, value: 1 });
        await tx.wait();
      } catch (err) {
        console.log("tranfer should err:", err?.info?.error?.message);
      }

      console.log("after  transfer granter ", issuerWallet.address, " have balance ", await provider.getBalance(issuerWallet.address));
      console.log("after  transfer grantee ", granteeWallet.address, " have balance ", await provider.getBalance(granteeWallet.address), ", balance should not crease due to not has kyc!!");
    }

    {
      console.log("\n");
      // qoe set set service provider permissions, have KycPermissionUseGasWaiver and KycPermissionReceiveQareToken
      console.log("call service provider wrapper function again setServiceProviderPermissions");
      tx = await contractServiceWrapper.connect(qoeWallet).setServiceProviderPermissions(serviceProviderAddress, KycPermissionUseGasWaiver | KycPermissionReceiveQareToken);
      await tx.wait();
      // grentee can not receive native token
      console.log("before transfer granter ", issuerWallet.address, " have balance ", await provider.getBalance(issuerWallet.address));
      console.log("before transfer grantee ", granteeWallet.address, " have balance ", await provider.getBalance(granteeWallet.address));

      tx = await issuerWallet.sendTransaction({ to: granteeWallet.address, value: 1 });
      await tx.wait();

      console.log("after  transfer granter ", issuerWallet.address, " have balance ", await provider.getBalance(issuerWallet.address));
      console.log("after  transfer grantee ", granteeWallet.address, " have balance ", await provider.getBalance(granteeWallet.address), ", balance should crease 1aqare due to has kyc!");

      // qoe set set service provider permissions, have KycPermissionUseGasWaiver and KycPermissionReceiveQareToken
      console.log("call service provider wrapper function again setServiceProviderPermissions");
      tx = await contractServiceWrapper.connect(qoeWallet).setServiceProviderPermissions(serviceProviderAddress, KycPermissionUseGasWaiver);
      await tx.wait();
    }
  } catch (error) {
    console.log("error:", error);
  }
};

main();
