import { JsonRpcProvider, Transaction } from "ethers";
import * as dotenv from "dotenv";
import KmsSigner from "./kms-signer.js";

const main = async () => {
  try {
    dotenv.config();

    // UPDATE YOU KMS PARAMS IN .env FIlE
    const { KEY_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, API_VERSION, PROVIDER } = process.env;
    const kmsParams = {
      keyId: KEY_ID,
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      region: REGION,
      apiVersion: API_VERSION,
    };
    const kmsSigner = new KmsSigner(kmsParams);
    const address = await kmsSigner.getAddress();

    const provider = new JsonRpcProvider(PROVIDER);
    const feeData = await provider.getFeeData();
    const network = await provider.getNetwork();
    const nonce = await provider.getTransactionCount(address);
    const to = "0x00000be6819f41400225702d32d3dd23663dd690";

    const tx = {
      gasLimit: 21000,
      gasPrice: feeData.gasPrice,
      to,
      value: 1,
      chainId: network.chainId,
      nonce,
    };

    const digest = Transaction.from(tx).unsignedHash;
    tx.signature = await kmsSigner.signDigest(digest);
    console.log("digest", digest);
    console.log("tx", tx);

    console.log(`\nbefore transfer ${to} have balance: ${(await provider.getBalance(to)).toString()}`);
    const signedTx = Transaction.from(tx).serialized;
    const txResponse = await provider.broadcastTransaction(signedTx);
    await txResponse.wait(1, 30000);
    console.log(`after  transfer ${to} have balance: ${(await provider.getBalance(to)).toString()}`);
  } catch (error) {
    console.log("error: ", error);
  }
};

main();
