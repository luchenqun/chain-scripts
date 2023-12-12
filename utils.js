export const calcFeeAmount = async (app, gas) => {
  const { base_fee } = await app.feemarket.baseFee();
  const feemarketParams = await app.feemarket.params();
  const minGasPrice = feemarketParams.params.min_gas_price;
  let gasPrice = BigInt(base_fee || 0);
  // TODO: If the value of minGasPrice exceeds 2^53-1, there will be a overflow problem here
  const bigMinGasPrice = BigInt(Math.ceil(minGasPrice));
  if (bigMinGasPrice > gasPrice) {
    gasPrice = bigMinGasPrice;
  }
  return (gasPrice * BigInt(gas)).toString();
};
