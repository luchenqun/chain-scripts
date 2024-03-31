import { bech32Chain, ETH, evmosToEth } from '@quarix/address-converter';

export const MC = bech32Chain('MC', 'ethos');

export const ethToMc = (ethAddress) => {
  const data = ETH.decoder(ethAddress);
  return MC.encoder(data);
};

const main = async () => {
  const evmosAccAddress = 'evmos1x2w87cvt5mqjncav4lxy8yfreynn273xn5335v';
  const ethAddress = evmosToEth(evmosAccAddress);
  console.log(ethToMc(ethAddress));
};

main();
