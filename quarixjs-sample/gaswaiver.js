import {
  createTx,
  SignType,
  createTxMsgApplyGasWaiverGranter,
  createTxMsgCancelApplication,
  createTxMsgApproveApplication,
  createTxMsgRevokeGasWaiverGranter,
  createTxMsgGrantGasWaiverGranter,
  createTxMsgGrantPremiumGasWaiver,
  createTxMsgRevokePremiumGasWaiver,
  createTxMsgUpdateAllowance
} from '@quarix/transactions';

import { App, CosmosTxV1Beta1BroadcastMode } from '@quarix/provider';
import { Wallet } from 'ethers';
import { ethToQuarix } from '@quarix/address-converter';
import * as dotenv from 'dotenv';
import { calcFeeAmount } from '../utils.js';

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

(async () => {
  try {
    const chain = {
      chainId: 8888888,
      cosmosChainId: 'quarix_8888888-1'
    };

    dotenv.config();
    const { API, PRIVATE_KEY } = process.env;

    // set privateKeyOrMnemonic with you private key or mnemonic
    const privateKeyOrMnemonic = PRIVATE_KEY;

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

    const memo = 'quarixjs test';
    const app = new App({ baseURL: API });

    const gas = '200000';
    const amount = await calcFeeAmount(app, gas);
    const fee = {
      amount,
      denom: 'aqare',
      gas
    };

    const account = await app.auth.account(sender.accountAddress);
    sender.sequence = account.account.base_account.sequence;
    sender.accountNumber = account.account.base_account.account_number;

    const basicAllowance = {
      spendLimit: {
        denom: 'aqare',
        amount: '80000000000000000000000000000'
      }
    };

    const periodAllowance = {
      basic: {
        spendLimit: {
          denom: 'aqare',
          amount: '50000000000000000000000000000'
        }
      },
      period: 3600,
      periodSpendLimit: {
        denom: 'aqare',
        amount: '50000000000000000000000000000'
      }
    };

    const contract = '0x1111111111111111111111111111111111120006';
    const grantee = 'quarix1hajh6rhhkjqkwet6wqld3lgx8ur4y3khmpfhlu';

    const signTypes = [SignType.Cosmos, SignType.EIP712];
    for (const signType of signTypes) {
      {
        // apply gas waiver granter
        {
          const params = {
            expiration: '2025-12-01T00:12:59',
            contract,
            allowance: periodAllowance,
            applyPeriod: 3600
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgApplyGasWaiverGranter, context, params, privateKey, signType);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} ApplyGasWaiverGranter result ============================`);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // cancel gas waiver granter application
        {
          const params = {
            applicant: 'quarix1qqqqhe5pnaq5qq39wqkn957aydnrm45sywg476',
            contract
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgCancelApplication, context, params, privateKey, signType);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} CancelApplication result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // apply gas waiver granter
        {
          const params = {
            expiration: '2025-12-01T00:12:59',
            contract,
            allowance: basicAllowance,
            applyPeriod: 3600
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgApplyGasWaiverGranter, context, params, privateKey, signType);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} ApplyGasWaiverGranter result ============================`);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // approve gas waiver granter application
        {
          const params = {
            granter: 'quarix1qqqqhe5pnaq5qq39wqkn957aydnrm45sywg476',
            contract
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgApproveApplication, context, params, privateKey, signType);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} ApproveApplication result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // revoke gas waiver granter
        {
          const params = {
            contract
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgRevokeGasWaiverGranter, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} RevokeGasWaiverGranter result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // grant gas waiver ganter
        {
          const params = {
            expiration: '2025-12-01',
            contract,
            allowance: periodAllowance
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgGrantGasWaiverGranter, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} GrantGasWaiverGranter result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // update normal allowance
        {
          const params = {
            contract,
            allowance: basicAllowance,
          }
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgUpdateAllowance, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} createTxMsgUpdateAllowance result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
        }
        sender.sequence = String(parseInt(sender.sequence) + 1);

        // revoke gas waiver granter
        {
          const params = {
            contract
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgRevokeGasWaiverGranter, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} RevokeGasWaiverGranter result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // grant gas waiver ganter
        {
          const params = {
            expiration: '2025-12-01',
            contract,
            allowance: periodAllowance
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgGrantGasWaiverGranter, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} GrantGasWaiverGranter result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // grant premium gas waiver
        {
          const params = {
            contract,
            grantee,
            allowance: basicAllowance,
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgGrantPremiumGasWaiver, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} GrantPremiumGasWaiver result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // update premium allowance
        {
          const params = {
            contract,
            grantee,
            allowance: periodAllowance,
          }
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgUpdateAllowance, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} createTxMsgUpdateAllowance premium result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
        }
        sender.sequence = String(parseInt(sender.sequence) + 1);

        //revoke premium gas waiver
        {
          const params = {
            contract,
            grantee
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgRevokePremiumGasWaiver, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} RevokePremiumGasWaiver result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
          sender.sequence = String(parseInt(sender.sequence) + 1);
        }

        // revoke gas waiver granter
        {
          const params = {
            contract
          };
          const context = { chain, sender, fee, memo };
          const txBytesBase64 = createTx(createTxMsgRevokeGasWaiverGranter, context, params, privateKey);
          const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
          console.log(`============================ ${signType === SignType.EIP712 ? 'eip712' : 'cosmos'} RevokeGasWaiverGranter result ============================ `);
          console.log(
            `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
          );
        }
        sender.sequence = String(parseInt(sender.sequence) + 1);
      }
    }
  } catch (error) {
    console.log('error: ', error);
  }
})();
