import { ethers } from 'ethers';
import fs from 'fs-extra';
import path from 'path';

export const main = async () => {
  try {
    const { rpc, contracts, stakingAddress } = await fs.readJSON('../cfg.json');
    const { abi } = await fs.readJSON(path.join(contracts, 'staking/IStaking.sol/IStaking.json'));
    const provider = new ethers.JsonRpcProvider(rpc);

    // input params
    const privateKey = '080615ce974ea9c26c02c9a483686be2b25932d324660b3f95dacc91e2d3b269';
    const wallet = new ethers.Wallet(privateKey, provider);
    const validatorAddress = wallet.address;
    const description = ['[do-not-modify]', '[do-not-modify]', '[do-not-modify]', '[do-not-modify]', 'i want update my details'];
    const commissionRate = '50000000000000000';
    const minSelfDelegation = 8000000;

    let validator;

    const staking = new ethers.Contract(stakingAddress, abi, wallet);
    validator = await staking.validator(validatorAddress);
    console.log('validator before modify', validator);

    const tx = await staking.editValidator(description, commissionRate, minSelfDelegation);
    await tx.wait();

    validator = await staking.validator(validatorAddress);
    console.log('validator after modify', validator);
  } catch (error) {
    console.log('error', error);
  }
};

main();
