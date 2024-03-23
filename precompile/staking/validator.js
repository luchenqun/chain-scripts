import { ethers } from 'ethers';
import fs from 'fs-extra';
import path from 'path';

export const main = async () => {
  const { rpc, contracts, stakingAddress } = await fs.readJSON('../cfg.json');
  const { abi } = await fs.readJSON(path.join(contracts, 'staking/IStaking.sol/IStaking.json'));
  const provider = new ethers.JsonRpcProvider(rpc);

  // input params
  const validatorAddress = '0x03E335b02C906643b5f3D864F5A97e5322098585';

  const staking = new ethers.Contract(stakingAddress, abi, provider);
  const validator = await staking.validator(validatorAddress);
  console.log('validator', validator);
};

main();
