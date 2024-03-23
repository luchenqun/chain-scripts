import { ethers } from 'ethers';
import fs from 'fs-extra';
import path from 'path';

export const main = async () => {
  const { rpc, contracts, stakingAddress } = await fs.readJSON('../cfg.json');
  const { abi } = await fs.readJSON(path.join(contracts, 'staking/IStaking.sol/IStaking.json'));
  const provider = new ethers.JsonRpcProvider(rpc);

  // input params
  const validatorAddress = '0xA3b6E7aA04962778232b70CCFF55b71B11228b9b';

  const staking = new ethers.Contract(stakingAddress, abi, provider);
  const validator = await staking.validator(validatorAddress);
  console.log('validator', validator);
};

main();
