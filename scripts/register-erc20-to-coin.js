import { ethers } from 'ethers';
import { decodeReply, execPromis, sleep } from '../utils.js';

let run = async function () {
  try {
    // you should use cmd `node init.js --v=1 --s=true` to run 1 nodes
    const baseDir = '/Users/lcq/go/src/github.com/kbtg/quarix/build';
    const app = `${baseDir}/quarixd`;
    const cwd = `${baseDir}`;
    const home = `${baseDir}/nodes/node0/quarixd/`;
    const fixed = `--from=qoe --home=${home} --keyring-backend=test --chain-id=quarix_8888888-1 --fees="100000000000000000aqare" --gas="auto" -y`;
    const erc20Address = '0x546bc6E008689577C69C42b9C1f6b4C923f59B5d'; // deploy first
    const from = '0x00000Be6819f41400225702D32d3dd23663Dd690';
    const fromBench32 = 'quarix1qqqqhe5pnaq5qq39wqkn957aydnrm45sywg476'; //
    const receiver = '0xbf657d0ef7b48167657a703ed8fd063f075246d7'; // have kyc

    let cmd;
    let reply;

    {
      cmd = `${app} tx gov submit-legacy-proposal register-erc20 ${erc20Address} --title="register erc20 token thbs" --description="register erc20 token thbs to native token" --deposit="10000000aqrx" ${fixed}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(1500);
    }

    {
      cmd = `${app} tx gov vote 1 yes ${fixed.replace('qoe', 'node0')}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(9000); // must sleep voting_period time
    }

    {
      // erc20 tokon => native coin
      cmd = `${app} tx erc20 convert-erc20 ${erc20Address} ${ethers.parseUnits('8')} ${fromBench32} ${fixed}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(1500);
    }

    {
      // native coin => erc20 tokon
      cmd = `${app} tx erc20 convert-coin ${ethers.parseUnits('2')}erc20/${erc20Address} ${receiver} ${fixed}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(1500);
    }
  } catch (error) {
    console.log('error', error);
  }
};

run();
