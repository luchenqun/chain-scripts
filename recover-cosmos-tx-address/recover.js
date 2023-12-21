import { decodeTxRaw } from '@cosmjs/proto-signing';
import { fromBase64, toHex, fromHex, toBech32 } from '@cosmjs/encoding';
import { ripemd160, sha256 } from '@cosmjs/crypto';
import { computeAddress } from 'ethers';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const main = async () => {
  try {
    const evmosTx =
      'CsgBCqwBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRKEAQotcXVhcml4MXFxcXFoZTVwbmFxNXFxMzl3cWtuOTU3YXlkbnJtNDVzeXdnNDc2EjRxdWFyaXh2YWxvcGVyMWhhamg2cmhoa2pxa3dldDZ3cWxkM2xneDh1cjR5M2toYWp1emo3Gh0KBGFxcngSFTEwMDAwMDAwMDAwMDAwMDAwMDAwMBIXZGVsZWdhdGUgYnkgY29zbW9zIHRvb2wSfApZCk8KKC9ldGhlcm1pbnQuY3J5cHRvLnYxLmV0aHNlY3AyNTZrMS5QdWJLZXkSIwohAz/O93/CZ9cUWZDccNbpeRvBTgp3HGKJbdzKaUp1Yie0EgQKAggBGAYSHwoZCgVhcWFyZRIQMTAwMDAwMDAwMDAwMDAwMBDAhD0aQZrRQ1TuU7eOO6QP67APZJQLZHX9PC0RuxyKIo9o7nf7TwoRdRaew4xalzLMHMvlBE/4lM5Lr+RGBjiJ5LERPjEb';
    const ethTx =
      'CscCCpMCCh8vZXRoZXJtaW50LmV2bS52MS5Nc2dFdGhlcmV1bVR4Eu8BCqgBChovZXRoZXJtaW50LmV2bS52MS5MZWdhY3lUeBKJARIKMTAwMDAwMDAwMBiAiXoiKjB4MjIyMjIwN0IxZjdiOGQzNzU2NkQ5QTI3Nzg3MzI0NTFkYmZiQzVkMCoBMDoEAQ9Ek0IgjXiMNmuhExd0UUjSRNkBEBLXdomtOB0FJq027YIH8FhKIH23RSnbJedpTzMwna2XTGaPOiHJDSIMAZApo3H2XzEgGkIweDY0NTYzOGUzZmU0YTA5NzIyNzQyNDY2ZDY4OWE4Zjg1ZGE5NDQ2NWJkNDQ1MWRiOWQ4ZjgyMGRiNTBlMTgzMWL6Py4KLC9ldGhlcm1pbnQuZXZtLnYxLkV4dGVuc2lvbk9wdGlvbnNFdGhlcmV1bVR4EiESHwoZCgVhcWFyZRIQMjAwMDAwMDAwMDAwMDAwMBCAiXo=';
    const cosmosTx =
      'CrABCo4BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm4KLWNvc21vczFnZmc5dWNjN3JyemMyMDd5OXFmbWY1OGVyZnR6Zjh6OHd3NWxyNxItY29zbW9zMWxoNnBtYWhsa3l0ejdsbXJzMjVhNDJqNmt4bG16dHl0MjA0a3lxGg4KCXRlc3R0b2tlbhIBMRIddHJhbnNmZXIgdG9rZW4gYnkgY29zbW9zIHRvb2wSYgpOCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAz/O93/CZ9cUWZDccNbpeRvBTgp3HGKJbdzKaUp1Yie0EgQKAggBEhAKCgoFc3Rha2USATAQwIQ9GkBEbwXiPG0Plr86BT5dSnjlEXg/YmCLzpGhGb0p/9oMJTPongyG/L7FRBK0VJ2eqOYhg3yBtns2e7rWfpRtpiYd';
    const prefix = 'quarix';

    const txs = [evmosTx, ethTx, cosmosTx];

    for (const tx of txs) {
      const txBytes = fromBase64(tx);
      const hash = toHex(sha256(txBytes)).toUpperCase();
      const txRaw = decodeTxRaw(txBytes);

      // console.log(JSON.stringify(txRaw));
      console.log();
      let types = [];
      let senders = [];
      const messages = txRaw.body.messages || [];
      for (const message of messages) {
        if (message.typeUrl) {
          types.push(message.typeUrl.split('.').pop().replace('Msg', ''));
        }
      }
      const signerInfos = txRaw?.authInfo?.signerInfos || [];
      for (const signerInfo of signerInfos) {
        const publicKey = signerInfo?.publicKey;
        if (publicKey) {
          const { typeUrl, value } = publicKey;
          const hexPublicKey = toHex(value).substring(4);
          let address = '';
          if (typeUrl.includes('ethsecp256k1')) {
            address = computeAddress('0x' + hexPublicKey);
          } else if (typeUrl.includes('secp256k1')) {
            address = '0x' + toHex(ripemd160(sha256(fromHex(hexPublicKey))));
          }
          if (address) {
            senders.push(toBech32(prefix, fromHex(address.replace('0x', ''))));
          }
        }
      }
      console.log(types, senders);
    }
  } catch (error) {
    console.log('error: ', error);
  }
};

main();
