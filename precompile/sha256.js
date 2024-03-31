import { ethers } from 'ethers';

export const main = async () => {
  try {
    const rpc = 'http://127.0.0.1:8545';
    const abi = [
      {
        inputs: [
          {
            internalType: 'string',
            name: 'data',
            type: 'string'
          }
        ],
        name: 'calculateSha256Hash',
        outputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32'
          }
        ],
        stateMutability: 'pure',
        type: 'function'
      }
    ];
    const provider = new ethers.JsonRpcProvider(rpc);

    // input params
    const data = '1';
    const address = '0x0000000000000000000000000000000000000002';

    const hashContract = new ethers.Contract(address, abi, provider);
    const hash = await hashContract.calculateSha256Hash(data);
    console.log('hash', hash);
  } catch (error) {
    console.log('error', error);
  }
};

main();
