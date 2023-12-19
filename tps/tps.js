import { Wallet, JsonRpcProvider, FetchRequest } from "ethers";
import WebSocket from "ws";
import * as dotenv from "dotenv";
import * as fs from "fs/promises";

const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

const main = async () => {
  dotenv.config();
  const { WS, PROVIDER, RPC, PRIVATE_KEY, TO, TEST_TIME, CACHE_TX } =
    process.env;

  const filename = `./tps-${new Date().toISOString()}-${TEST_TIME}s-batch_${CACHE_TX}tx.csv`;
  await fs.appendFile(
    filename,
    "Total Send, Send Reply, Cached Txs, Tx Reply, Spend, Reply TPS, TPS\n"
  );

  const provider = new JsonRpcProvider(PROVIDER);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  const address = wallet.address;
  const ws = new WebSocket(WS);
  const pendTxReq = new FetchRequest(`${RPC}/num_unconfirmed_txs`);

  const TxCountInBlock = 0;
  const TxId = 1;

  let txCount = {
    method: "eth_getBlockTransactionCountByNumber",
    jsonrpc: "2.0",
    id: TxCountInBlock,
    params: ["latest"],
  };

  let txRaw = {
    method: "eth_sendRawTransaction",
    jsonrpc: "2.0",
    id: TxId,
    params: [],
  };

  const txCountStr = JSON.stringify(txCount);
  const startTime = parseInt(new Date().getTime() / 1000);

  let feeData, network;
  let startNonce, sendNonce;
  let reply = 0;
  let totalSend = 0;
  let errorCount = 0;

  ws.on("open", async () => {
    console.log("connected");
    // It cannot be request from outside, otherwise ws cannot be opened.
    feeData = await provider.getFeeData();
    network = await provider.getNetwork();
    startNonce = await wallet.getNonce();
    sendNonce = startNonce;

    ws.send(txCountStr);
  });

  ws.on("close", function close() {
    console.log("disconnected");
    process.exit(0);
  });

  ws.on("message", async (data) => {
    data = JSON.parse(data.toString());
    if (data.error) {
      console.log(data.error);
      errorCount++;
      // if have errors, It may be that the nonce is wrong. We need to correct the nonce.
      // wait for existing transactions on the chain to be executed
      if (errorCount > 0) {
        const resp = await pendTxReq.clone().send();
        const pending = parseInt(resp.bodyJson.result.total);
        const time = 200;
        let tryCnt = 0;
        while (pending > 0) {
          console.log(`try ${tryCnt}`);
          await sleep(time);
          tryCnt++;
          if (tryCnt >= 60) {
            console.log(`try ${tryCnt * time}ms still have pending tx`);
            ws.close();
            return;
          }
        }
        sendNonce = await wallet.getNonce();
        errorCount = 0;
      }
    }

    if (data.id == TxCountInBlock) {
      const txCount = parseInt(data.result);
      let resp = await pendTxReq.clone().send();
      let pending = parseInt(resp.bodyJson.result.total);
      pending != CACHE_TX &&
        console.log(
          `Unconfirmed Txs ${pending}, latest block contain ${txCount} tx`
        );
      // pending too much, sleep
      while (pending >= CACHE_TX - 100) {
        await sleep(200);
        resp = await pendTxReq.clone().send();
        pending = parseInt(resp.bodyJson.result.total);
        console.log(
          `Unconfirmed Txs ${pending}, latest block contain ${txCount} tx`
        );
      }

      // send transactions without waiting for receipt
      while (CACHE_TX - pending > 0) {
        if (errorCount > 0) {
          break;
        }
        const txRequest = {
          gasLimit: 21000,
          gasPrice: feeData.gasPrice,
          from: address,
          to: TO,
          value: 1,
          chainId: network.chainId,
          nonce: sendNonce,
        };
        const signedTx = await wallet.signTransaction(txRequest);
        txRaw.params[0] = signedTx;
        ws.send(JSON.stringify(txRaw));
        pending++;
        sendNonce++;
        totalSend++;
      }

      // calculate tps
      const nonce = await wallet.getNonce();
      const endTime = parseInt(new Date().getTime() / 1000);
      const gapTime = endTime - startTime;
      const count = nonce - startNonce;
      const tps = parseInt(count / gapTime);
      const replyTps = parseInt(reply / gapTime);
      console.log(
        `Total Send ${totalSend}, Send Reply ${reply}, Cached Txs ${
          totalSend - reply
        }, Tx Reply ${count}, Spend ${gapTime}s, Reply TPS ${replyTps}, TPS ${tps}`
      );
      await fs.appendFile(
        filename,
        `${totalSend}, ${reply}, ${
          totalSend - reply
        }, ${count}, ${gapTime}, ${replyTps}, ${tps}\n`
      );
      // The stress test has been run for the specified time and the process ends.
      if (endTime - startTime > TEST_TIME) {
        ws.close();
      } else {
        // wait for the transaction to be executed
        await sleep(1000);
        ws.send(txCountStr);
      }
    } else {
      // the transaction has arrived in the mempool
      reply++;
    }
  });
};

main();
