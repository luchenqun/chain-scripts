import { createTxMsgSend, createTxMsg, signTxMsg, packTxMsg, SignType } from "@quarix/transactions";
import { App, CosmosTxV1Beta1BroadcastMode } from "@quarix/provider";
import { ethToQuarix } from "@quarix/address-converter";
import * as dotenv from "dotenv";
import KmsSigner from "./kms-signer.js";
import { calcFeeAmount } from "../utils.js";

const main = async () => {
  try {
    dotenv.config();

    // UPDATE YOU KMS PARAMS IN .env FIlE
    const { KEY_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, API_VERSION, API } = process.env;
    const kmsParams = {
      keyId: KEY_ID,
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      region: REGION,
      apiVersion: API_VERSION,
    };
    const kmsSigner = new KmsSigner(kmsParams);

    const chain = {
      chainId: 8888888,
      cosmosChainId: "quarix_8888888-1",
    };
    const ethAddress = await kmsSigner.getAddress();
    const accountAddress = ethToQuarix(ethAddress);
    const publicKey = await kmsSigner.getCompressedPublicKey();
    const publicKeyBase64 = Buffer.from(publicKey.replace("0x", ""), "hex").toString("base64");

    console.log("kms ethAddress", ethAddress);
    console.log("bech32 address", accountAddress);
    console.log("publicKey", publicKey);
    console.log("base64(publicKey)", publicKeyBase64);

    const app = new App({ baseURL: API });

    let sender = {
      accountAddress,
      sequence: undefined,
      accountNumber: undefined,
      pubkey: publicKeyBase64,
    };
    const account = await app.auth.account(sender.accountAddress);
    sender.sequence = account.account.base_account.sequence;
    sender.accountNumber = account.account.base_account.account_number;

    const gas = "200000";
    const amount = await calcFeeAmount(app, gas);
    let fee = {
      amount,
      denom: "aqare",
      gas,
    };

    const memo = "quarixjs test";

    // Update params based on the message you want to send
    const params = {
      destinationAddress: "quarix1hajh6rhhkjqkwet6wqld3lgx8ur4y3khmpfhlu",
      amount: "1",
      denom: "aqrx",
    };

    {
      // split steps: createTx = createTxMsg + signTxMsg + packTxMsg
      const context = { chain, sender, fee, memo };
      const { msg, digest } = createTxMsg(createTxMsgSend, context, params, SignType.EIP712);
      const signature = await kmsSigner.signDigest(digest);
      const txBytesBase64 = packTxMsg(msg, signature);
      const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
      console.log("============================ split steps eip712 tx result ============================ ");
      console.log(`code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`);
      sender.sequence = String(parseInt(sender.sequence) + 1);
    }
  } catch (error) {
    console.log("error: ", error);
  }
};

main();
