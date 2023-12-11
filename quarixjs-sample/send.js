import { createTxMsgSend, createTxMsg, signTxMsg, packTxMsg, createTx, SignType, TxType } from "@quarix/transactions";
import { App, Tendermint, CosmosTxV1Beta1BroadcastMode } from "@quarix/provider";
import { Wallet } from "ethers";
import { ethToQuarix } from "@quarix/address-converter";
import * as dotenv from "dotenv";

const privateKeyToPublicKey = (privateKey, base64Encode = true) => {
  const wallet = new Wallet(privateKey);
  const compressedPublicKey = wallet.signingKey.compressedPublicKey.toLowerCase().replace("0x", "");
  if (base64Encode) {
    return Buffer.from(compressedPublicKey, "hex").toString("base64");
  }
  return compressedPublicKey;
};

const privateKeyToQuarixAddress = (privateKey) => {
  const wallet = new Wallet(privateKey);
  return ethToQuarix(wallet.address);
};

(async () => {
  try {
    dotenv.config();
    const { API, RPC, PRIVATE_KEY } = process.env;

    const chain = {
      chainId: 8888888,
      cosmosChainId: "quarix_8888888-1",
    };

    // set privateKeyOrMnemonic with you private key or mnemonic
    const privateKeyOrMnemonic = PRIVATE_KEY;

    // convert mnemonic to private key
    let privateKey = privateKeyOrMnemonic;
    if (privateKeyOrMnemonic.indexOf(" ") > 0) {
      privateKey = Wallet.fromPhrase(privateKeyOrMnemonic).signingKey.privateKey;
    }

    let sender = {
      accountAddress: privateKeyToQuarixAddress(privateKey),
      sequence: "0",
      accountNumber: "0",
      pubkey: privateKeyToPublicKey(privateKey),
    };

    const gas = "200000";
    const fee = {
      amount: undefined,
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

    const app = new App({ baseURL: API });
    const tdm = new Tendermint({ baseURL: RPC });

    const account = await app.auth.account(sender.accountAddress);
    sender.sequence = account.account.base_account.sequence;
    sender.accountNumber = account.account.base_account.account_number;

    // update fee
    const { base_fee } = await app.feemarket.baseFee();
    const feemarketParams = await app.feemarket.params();
    const minGasPrice = feemarketParams.params.min_gas_price;
    let gasPrice = BigInt(base_fee || 0);
    // TODO: If the value of minGasPrice exceeds 2^53-1, there will be a overflow problem here
    const bigMinGasPrice = BigInt(Math.ceil(minGasPrice));
    if (bigMinGasPrice > gasPrice) {
      gasPrice = bigMinGasPrice;
    }
    fee.amount = (gasPrice * BigInt(gas)).toString();

    {
      // use eip712 sign msg
      const context = { chain, sender, fee, memo };
      const txBytesBase64 = createTx(createTxMsgSend, context, params, privateKey);
      const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
      console.log("============================ eip712 tx result ============================ ");
      console.log(`code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`);
      sender.sequence = String(parseInt(sender.sequence) + 1);
    }

    {
      // use cosmos sign msg
      const context = { chain, sender, fee, memo };
      const txBytesBase64 = createTx(createTxMsgSend, context, params, privateKey, SignType.Cosmos);
      const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
      console.log("============================ cosmos tx result ============================");
      console.log(`code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`);
      sender.sequence = String(parseInt(sender.sequence) + 1);
    }

    {
      // split steps: createTx = createTxMsg + signTxMsg + packTxMsg
      const context = { chain, sender, fee, memo };
      const { msg, digest } = createTxMsg(createTxMsgSend, context, params, SignType.EIP712);
      const signature = signTxMsg(privateKey, digest);
      const txBytesBase64 = packTxMsg(msg, signature);
      const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
      console.log("============================ split steps eip712 tx result ============================ ");
      console.log(`code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`);
      sender.sequence = String(parseInt(sender.sequence) + 1);
    }

    {
      // use hex tx broadcast result
      const context = { chain, sender, fee, memo };
      const txBytes = createTx(createTxMsgSend, context, params, privateKey, SignType.EIP712, TxType.Hex);
      const result = await tdm.broadcastTxCommit({ tx: txBytes });
      console.log("============================ use hex tx broadcast result ============================ ");
      console.log(`code: ${result?.check_tx?.code}, block height: ${result?.height}, txhash: ${result?.hash}, log: ${result?.check_tx?.log}`);
      sender.sequence = String(parseInt(sender.sequence) + 1);
    }
  } catch (error) {
    console.log("error: ", error);
  }
})();
