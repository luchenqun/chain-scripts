import { ethers } from 'ethers';
import fs from 'fs-extra';
import path from 'path';

export const main = async () => {
  try {
    const { rpc, contracts, stakingAddress } = await fs.readJSON('../cfg.json');
    const { abi } = await fs.readJSON(path.join(contracts, 'staking/IStaking.sol/IStaking.json'));
    const provider = new ethers.JsonRpcProvider(rpc);

    // input params
    const privateKey = 'c3bad9a438d7e2435b7ae056dca3f5d8268ac9deb45f7833308b8fd00461d75c';
    const wallet = new ethers.Wallet(privateKey, provider);
    const description = ['join node', 'identity', 'http://cosmos.lucq.fun', 'security contract', 'It is my details'];
    const commission = ['100000000000000000', '100000000000000000', '100000000000000000'];
    const minSelfDelegation = '1';
    const pubkey = 'GHVPeHB84+ImKBocT3RtejJbCNydd8LBIlRJQzzJn+s=';
    const value = '100000000000000000000';

    const staking = new ethers.Contract(stakingAddress, abi, wallet);
    const tx = await staking.createValidator(description, commission, minSelfDelegation, pubkey, value);
    const receipt = await tx.wait();
    console.log('create validator success, receipt: ', receipt);
  } catch (error) {
    console.log('error', error);
  }
};

main();
