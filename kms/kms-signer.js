import { keccak256, recoverAddress, hashMessage, Signature, SigningKey } from "ethers";
import { KMS, GetPublicKeyCommand, SignCommand } from "@aws-sdk/client-kms";
import asn1 from "asn1.js";

const EcdsaPubKey = asn1.define("EcdsaPubKey", function () {
  this.seq().obj(this.key("algo").seq().obj(this.key("a").objid(), this.key("b").objid()), this.key("pubKey").bitstr());
});

const EcdsaSigAsnParse = asn1.define("EcdsaSig", function () {
  this.seq().obj(this.key("r").int(), this.key("s").int());
});

export default class KmsSigner {
  constructor(params) {
    this.keyId = params.keyId;
    this.client = new KMS({
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
      },
      region: params.region,
      apiVersion: params.apiVersion,
    });
  }

  async getAddress() {
    if (this.address) {
      return this.address;
    }
    const publicKey = await this._getKmsPublicKey();
    const address = this._getEthereumAddress(publicKey);
    this.address = address;
    return address;
  }

  async signMessage(msg) {
    const hash = Buffer.from(hashMessage(msg).slice(2), "hex");
    return this.signDigest(hash);
  }

  async _getKmsPublicKey() {
    const command = new GetPublicKeyCommand({
      KeyId: this.keyId,
    });
    const res = await this.client.send(command);
    return Buffer.from(res.PublicKey);
  }

  async getCompressedPublicKey() {
    const publicKey = await this._getKmsPublicKey();
    const res = EcdsaPubKey.decode(publicKey, "der");
    const pubKeyBuffer = res.pubKey.data;
    const pk = SigningKey.computePublicKey(pubKeyBuffer, true);
    return pk;
  }

  async _kmsSign(msg) {
    const params = {
      KeyId: this.keyId,
      Message: msg,
      SigningAlgorithm: "ECDSA_SHA_256",
      MessageType: "DIGEST",
    };
    const command = new SignCommand(params);
    const res = await this.client.send(command);
    return Buffer.from(res.Signature);
  }

  _getEthereumAddress(publicKey) {
    const res = EcdsaPubKey.decode(publicKey, "der");
    const pubKeyBuffer = res.pubKey.data.slice(1);
    const addressBuf = Buffer.from(keccak256(pubKeyBuffer).slice(2), "hex");
    const address = `0x${addressBuf.slice(-20).toString("hex")}`;
    return address;
  }

  async signDigest(digest) {
    digest = digest.replace("0x", "");
    const msg = Buffer.from(digest, "hex");
    const signature = await this._kmsSign(msg);
    const { r, s } = this._getSigRs(signature);
    const { v } = await this._getSigV(msg, { r, s });
    const sigBytes = Signature.from({ r, s, v }).serialized;
    return sigBytes;
  }

  async _getSigV(msgHash, { r, s }) {
    const address = await this.getAddress();
    let v = 27;
    let recovered = recoverAddress(msgHash, { r, s, v });
    if (!this._addressEquals(recovered, address)) {
      v = 28;
      recovered = recoverAddress(msgHash, { r, s, v });
    }
    if (!this._addressEquals(recovered, address)) {
      throw new Error("signature is invalid. recovered address does not match");
    }
    return { v };
  }

  _getSigRs(signature) {
    const decoded = EcdsaSigAsnParse.decode(signature, "der");
    let r = BigInt(`0x${decoded.r.toString(16)}`);
    let s = BigInt(`0x${decoded.s.toString(16)}`);
    const secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
    const secp256k1halfN = secp256k1N / BigInt(2);
    if (s > secp256k1halfN) {
      s = secp256k1N - s;
    }
    r = "0x" + r.toString(16);
    s = "0x" + s.toString(16);
    return { r, s };
  }

  _addressEquals(address1, address2) {
    return address1.toLowerCase() === address2.toLowerCase();
  }
}
