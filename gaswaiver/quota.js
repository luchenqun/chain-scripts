import { ethers } from 'ethers';
import fs from 'fs-extra';
import path from 'path';
import * as dotenv from 'dotenv';
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

const main = async () => {
  try {
    const chain = {
      chainId: 8888888,
      cosmosChainId: 'quarix_8888888-1'
    };

    dotenv.config();
    const { API, PROVIDER, GRANTER_PRIVATE_KEY, GRANTEE_PRIVATE_KEY } = process.env;
    const provider = new ethers.JsonRpcProvider(PROVIDER);
    const simple = await fs.readJSON(path.join('..', 'data/Simple.json'));
    const granterWallet = new ethers.Wallet(GRANTER_PRIVATE_KEY, provider);
    const granteeWallet = new ethers.Wallet(GRANTEE_PRIVATE_KEY, provider);
    const noExistWallet = new ethers.Wallet('b5383875512d64281acfb81cc37a95b0ddc00b235a3aa60cf8b4be25a3ba8fe5', provider); // 0xfffff01adb78f8951aa28cf06ceb9b8898a29f50
    const GasLimit = BigInt('30000'); // call simple contract gas limit
    const GasPrice = BigInt('1000000000'); // call simple contract gas price
    const option = { gasLimit: GasLimit, gasPrice: GasPrice };

    // DEPLOY CONTRACT
    let contractSimple;
    {
      const factorySimple = new ethers.ContractFactory(simple.abi, simple.bytecode, granterWallet);
      contractSimple = await factorySimple.deploy(123456);

      console.log('deploy simple contract');
      await contractSimple.waitForDeployment();
      console.log('contract simple address = ', contractSimple.target);
      // const simpleAddress = contractSimple.target;
    }

    // GRANT GAS WAIVER
    {
      // set privateKeyOrMnemonic with you private key or mnemonic
      const privateKeyOrMnemonic = GRANTER_PRIVATE_KEY;

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
          amount: ((GasLimit + BigInt(1)) * GasPrice).toString() // GasLimit+1 ensures that there is some remaining quota after the first call, but it is not enough for a second call.
        }
      };

      const contract = contractSimple.target;

      // grant gas waiver ganter
      {
        const params = {
          expiration: '2025-12-01',
          contract,
          allowance: basicAllowance
        };
        const context = { chain, sender, fee, memo };
        const txBytesBase64 = createTx(createTxMsgGrantGasWaiverGranter, context, params, privateKey, SignType.EIP712);
        const result = await app.tx.broadcastTx({ tx_bytes: txBytesBase64, mode: CosmosTxV1Beta1BroadcastMode.BROADCAST_MODE_BLOCK });
        console.log(`============================ GrantGasWaiverGranter result ============================ `);
        console.log(
          `code: ${result?.tx_response?.code}, block height: ${result?.tx_response?.height}, txhash: ${result?.tx_response?.txhash}, log: ${result?.tx_response?.raw_log}`
        );
        sender.sequence = String(parseInt(sender.sequence) + 1);
      }
    }

    // GRANTEE CALL CONTRACT
    {
      let tx, receipt;

      console.log('\n');
      console.log('grantee use gaswaiver call contract');
      console.log('before use gaswaiver granter ', granterWallet.address, ' have balance ', await provider.getBalance(granterWallet.address));
      console.log('before use gaswaiver grantee ', granteeWallet.address, ' have balance ', await provider.getBalance(granteeWallet.address));
      contractSimple = new ethers.Contract(contractSimple.target, simple.abi, granteeWallet);
      tx = await contractSimple.set(666666, option);
      receipt = await tx.wait();
      console.log('after  use gaswaiver granter ', granterWallet.address, ' have balance ', await provider.getBalance(granterWallet.address));
      console.log('after  use gaswaiver grantee ', granteeWallet.address, ' have balance ', await provider.getBalance(granteeWallet.address));

      console.log('\n');
      console.log('grantee use own funds call contract');
      console.log('before use gaswaiver granter ', granterWallet.address, ' have balance ', await provider.getBalance(granterWallet.address));
      console.log('before use gaswaiver grantee ', granteeWallet.address, ' have balance ', await provider.getBalance(granteeWallet.address));
      contractSimple = new ethers.Contract(contractSimple.target, simple.abi, granteeWallet);
      tx = await contractSimple.set(888888, option);
      receipt = await tx.wait();
      console.log('after  use gaswaiver granter ', granterWallet.address, ' have balance ', await provider.getBalance(granterWallet.address));
      console.log('after  use gaswaiver grantee ', granteeWallet.address, ' have balance ', await provider.getBalance(granteeWallet.address));

      console.log('\n');
      console.log('grantee account does not exist on the chain use gaswaiver call contract (make sure this grantee has gaswaiver kyc)');
      console.log('before use gaswaiver granter ', granterWallet.address, ' have balance ', await provider.getBalance(granterWallet.address));
      console.log('before use gaswaiver grantee ', noExistWallet.address, ' have balance ', await provider.getBalance(noExistWallet.address));
      contractSimple = new ethers.Contract(contractSimple.target, simple.abi, noExistWallet);
      tx = await contractSimple.set(555555, option);
      receipt = await tx.wait();
      console.log('after  use gaswaiver granter ', granterWallet.address, ' have balance ', await provider.getBalance(granterWallet.address));
      console.log('after  use gaswaiver grantee ', noExistWallet.address, ' have balance ', await provider.getBalance(noExistWallet.address));

      console.log('\n');
      console.log('grantee gaswaiver quota is used up and their own funds are insufficient the transaction will fail. (make sure this grantee has gaswaiver kyc)');
      tx = await contractSimple.set(999999, option);
    }
  } catch (error) {
    console.log('error: ', error);
  }
};

main();
