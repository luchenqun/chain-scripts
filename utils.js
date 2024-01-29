import util from 'util';
import crypto from 'crypto';
import { exec } from 'child_process';

export const calcFeeAmount = async (app, gas) => {
  const { base_fee } = await app.feemarket.baseFee();
  const feemarketParams = await app.feemarket.params();
  const minGasPrice = feemarketParams.params.min_gas_price;
  let gasPrice = BigInt(base_fee || 0);
  // TODO: If the value of minGasPrice exceeds 2^53-1, there will be a overflow problem here
  const bigMinGasPrice = BigInt(Math.ceil(minGasPrice));
  if (bigMinGasPrice > gasPrice) {
    gasPrice = bigMinGasPrice;
  }
  return (gasPrice * BigInt(gas)).toString();
};

export const execPromis = async (cmd, cwd) => {
  const f = util.promisify(exec);
  return f(cmd, { cwd });
};

export const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};
export const decodeReply = (reply) => {
  const stdout = reply.stdout;
  if (stdout) {
    const i = stdout.indexOf('code:');
    const j = stdout.indexOf('codespace:');
    const k = stdout.indexOf('txhash:');
    return (stdout.substring(i, j) + ', ' + stdout.substring(k)).replace('\n', '');
  }
  return reply.stdout;
};

export const privKeyToBurrowAddres = (privKey, isBase64 = true) => {
  if (isBase64) {
    privKey = Buffer.from(privKey, 'base64').toString('hex');
  }
  const publicKey = privKey.substring(64, 128);
  const digest = crypto.createHash('sha256').update(Buffer.from(publicKey, 'hex')).digest('hex');
  return digest.toLowerCase().substring(0, 40);
};
