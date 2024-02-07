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
    const proposal = path.join(path.dirname(fileURLToPath(import.meta.url)), './data/proposal-feemarket-update-params.json');

    const fixed = `--from=node0 --home=${home} --keyring-backend=test --chain-id=quarix_8888888-1 --fees="100000000000000000aqare" --gas="auto" -y`;
    let cmd;
    let reply;

    {
      cmd = `${app} tx gov submit-proposal ${proposal} ${fixed}`;
      reply = await execPromis(cmd, cwd);
      console.log(cmd, '\n', decodeReply(reply));
      await sleep(1500);
    }
  } catch (error) {
    console.log('error', error);
  }
};

run();
