import { ethers } from 'ethers';
import fs from 'fs-extra';
import path from 'path';

export const main = async () => {
  const ValidatorAddress = '0xad4a96ad189b638a7429694df2de366841847ca5';
  const { rpc, contracts, stakingAddress } = await fs.readJSON('../cfg.json');
  const { abi } = await fs.readJSON(path.join(contracts, 'staking/IStaking.sol/IStaking.json'));
  const provider = new ethers.JsonRpcProvider(rpc);

  const staking = new ethers.Contract(stakingAddress, abi, provider);
  const validator = await staking.validator(ValidatorAddress);
  console.log('validator', validator);
};

main();
