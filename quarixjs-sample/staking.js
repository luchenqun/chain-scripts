import { createTxMsgCreateValidator, createTxMsg, signTxMsg, packTxMsg, createTx, SignType, TxType } from '@quarix/transactions';
import { App, Tendermint, CosmosTxV1Beta1BroadcastMode } from '@quarix/provider';
import { Wallet } from 'ethers';
import { bech32Chain, ETH } from '@quarix/address-converter';

const privateKeyToPublicKey = (privateKey, base64Encode = true) => {
  const wallet = new Wallet(privateKey);
  const compressedPublicKey = wallet.signingKey.compressedPublicKey.toLowerCase().replace('0x', '');
  if (base64Encode) {
    return Buffer.from(compressedPublicKey, 'hex').toString('base64');
  }
  return compressedPublicKey;
};

const privateKeyToQuarixAddress = (privateKey) => {
  const wallet = new Wallet(privateKey);
  return ethToQuarix(wallet.address);
};

export const QUARIX = bech32Chain('QUARIX', 'ethos');

export const ethToQuarix = (ethAddress) => {
  const data = ETH.decoder(ethAddress);
  return QUARIX.encoder(data);
};
(async () => {
  try {
    const chain = {
      chainId: 20191205,
      cosmosChainId: 'ethos_20191205-1'
    };

    // set privateKeyOrMnemonic with you private key or mnemonic
    const privateKeyOrMnemonic = '95e06fa1a8411d7f6693f486f0f450b122c58feadbcee43fbd02e13da59395d5'; // 'october pride genuine harvest reunion sight become tuna kingdom punch girl lizard cat crater fee emotion seat test output safe volume caught design soft'

    // convert mnemonic to private key
    let privateKey = privateKeyOrMnemonic;
    if (privateKeyOrMnemonic.indexOf(' ') > 0) {
      privateKey = Wallet.fromPhrase(privateKeyOrMnemonic).signingKey.privateKey;
    }

    let sender = {
      accountAddress: privateKeyToQuarixAddress(privateKey),
      sequence: '0',
      accountNumber: '0',
      pubkey: privateKeyToPublicKey(privateKey)
    };

    const gas = '2000000';
    const fee = {
      amount: undefined,
      denom: 'aethos',
      gas
    };

    const memo = 'quarixjs test';

    // Update params based on the message you want to send
    const params = {
      validatorDescription: {
        moniker: 'new node',
        identity: 'x',
        website: 'x',
        securityContact: 'x',
        details: 'x'
      },
      validatorCommission: {
        rate: '0.05',
        maxRate: '1.00',
        maxChangeRate: '1.00'
      },
      minSelfDelegation: '1',
      delegatorAddress: 'ethos1zyg3qtwny9stqe8j55fvmmm5hldk48ukj2ak40',
      validatorAddress: 'ethosvaloper1zyg3qtwny9stqe8j55fvmmm5hldk48ukmg2tuv',
      amount: '1',
      denom: 'aethos',
      pubkey: `QSJcqyE1JElhydV9ZWJLoQdGVLvYxwnDQfiW/zqrArc=` // ./ethosd tendermint show-validator --home=./nodes/node1/ethosd
    };

    const baseURL = 'http://127.0.0.1:1317';
    const app = new App({ baseURL });

    const rpc = 'http://127.0.0.1:26657';
    const tdm = new Tendermint({ baseURL: rpc });

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
      const txBytesBase64 = createTx(createTxMsgCreateValidator, context, params, privateKey, SignType.EIP712);
      const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
      console.log('============================ eip712 tx result ============================ ');
      console.log(`code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`);
      sender.sequence = String(parseInt(sender.sequence) + 1);
    }
  } catch (error) {
    console.log('error: ', error);
  }
})();
