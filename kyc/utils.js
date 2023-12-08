import { Wallet, getBytes } from "ethers";
import { signTypedData } from "@metamask/eth-sig-util";
import { bech32Chain, ETH } from "@quarix/address-converter";
import { generatePostBodyBroadcast } from "@quarix/provider";
import { createTxRaw } from "@quarix/proto";

export const SignTypeEIP712 = 1;
export const SignTypeCosmos = 2;

export const ethToBech32 = (address, prefix) => {
  const ethAddress = ETH.decoder(address);
  const chain = bech32Chain(prefix.toUpperCase(), prefix);
  const data = chain.encoder(ethAddress);
  return data;
};

export const createTx = async (createTxMsg, context, params, privateKey, signType = SignTypeEIP712) => {
  const msg = createTxMsg(context, params);
  const privateKeyBuf = Buffer.from(privateKey.replace("0x", ""), "hex");
  let signatureBytes;
  if (signType === SignTypeEIP712) {
    const signature = signTypedData({
      privateKey: privateKeyBuf,
      data: msg.eipToSign,
      version: "V4",
    });
    signatureBytes = Buffer.from(signature.replace("0x", ""), "hex");
  } else if (signType == SignTypeCosmos) {
    const wallet = new Wallet(privateKey);
    const dataToSign = `0x${Buffer.from(msg.signDirect.signBytes, "base64").toString("hex")}`;
    const signature = wallet.signingKey.sign(dataToSign);
    signatureBytes = getBytes(signature.serialized);
  } else {
    throw `unknow signType ${signType}`;
  }

  const rawTx = createTxRaw(msg.signDirect.body.toBinary(), msg.signDirect.authInfo.toBinary(), [signatureBytes]);
  const txBytes = JSON.parse(generatePostBodyBroadcast(rawTx)).tx_bytes;
  const txHexBytes = "0x" + Buffer.from(txBytes).toString("hex");
  return [txHexBytes, Buffer.from(txBytes).toString("base64")];
};
