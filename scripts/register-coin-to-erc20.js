import { ethers } from 'ethers';
import { decodeReply, execPromis, sleep } from '../utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

let run = async function () {
  try {
    // you should use cmd `node init.js --v=1 --s=true` to run 1 nodes
    const baseDir = '/Users/lcq/go/src/github.com/kbtg/quarix/build';
    const app = `${baseDir}/quarixd`;
    const cwd = `${baseDir}`;
    const home = `${baseDir}/nodes/node0/quarixd/`;
    const proposal = path.join(path.dirname(fileURLToPath(import.meta.url)), './data/proposal-erc20.json');

    const fixed = `--from=node0 --home=${home} --keyring-backend=test --chain-id=quarix_8888888-1 --fees="100000000000000000aqare" --gas="auto" -y`;
    const erc20Address = '0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd';
    const sender = '0xbf657D0ef7b48167657A703Ed8Fd063F075246D7';
    const receiver = 'quarix1qqqqhe5pnaq5qq39wqkn957aydnrm45sywg476'; // "0x00000Be6819f41400225702D32d3dd23663Dd690";
    let cmd;
    let reply;

    {
      cmd = `${app} tx gov submit-legacy-proposal register-coin ${proposal} --title="register qrx coin" --description="register qrx coin to erc20" --deposit="10000000aqrx" ${fixed}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(1500);
    }

    {
      cmd = `${app} tx gov vote 1 yes ${fixed}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(9000);
    }

    {
      // native coin => erc20 tokon
      cmd = `${app} tx erc20 convert-coin ${ethers.parseUnits('8').toString()}aqrx ${sender} ${fixed}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(1500);
    }

    {
      // erc20 tokon => native coin
      cmd = `${app} tx erc20 convert-erc20 ${erc20Address} ${ethers.parseUnits('2').toString()} ${receiver} ${fixed}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(1500);
    }
  } catch (error) {
    console.log('error', error);
  }
};

run();
