import { ethers } from "ethers";
import fs from "fs-extra";
import path from "path";
import * as dotenv from "dotenv";

const main = async () => {
  dotenv.config();
  const { PROVIDER, OWNER_KEY, SERVICE_WRAPPER_CONTRACT_PATH } = process.env;
  const serviceWrapper = await fs.readJSON(SERVICE_WRAPPER_CONTRACT_PATH);
  const proxyAdmin = await fs.readJSON(path.join("..", "data/ProxyAdmin.json"));
  const serviceWrapperProxyAdminAddress = "0x1111111111111111111111111111111111120002";
  const serviceWrapperProxyAddress = "0x1111111111111111111111111111111111120003";
  const serviceProviderProxyAddress = "0x1111111111111111111111111111111111120006";
  const kycPermissionAll = 1099511627791;
  const provider = new ethers.JsonRpcProvider(PROVIDER);
  const ownerPrivateKey = OWNER_KEY;
  const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);

  let tx;

  const factoryServiceWrapper = new ethers.ContractFactory(serviceWrapper.abi, serviceWrapper.bytecode, ownerWallet);
  const contractServiceWrapper = await factoryServiceWrapper.deploy();

  // deploy a new logic service provider contract
  console.log("deploy service wrapper contract");
  await contractServiceWrapper.waitForDeployment();
  console.log("contract service wrapper address = ", contractServiceWrapper.target);

  const logicServiceWrapperAddress = contractServiceWrapper.target;

  {
    // update
    console.log("update service wrapper proxy logic address");
    const contractServiceWrapperProxyAdmin = new ethers.Contract(serviceWrapperProxyAdminAddress, proxyAdmin.abi, ownerWallet);
    tx = await contractServiceWrapperProxyAdmin.upgrade(serviceWrapperProxyAddress, logicServiceWrapperAddress);
    await tx.wait();

    // setServiceProviderPermissions
    const contractServiceWrapperProxy = new ethers.Contract(serviceWrapperProxyAddress, serviceWrapper.abi, ownerWallet);
    tx = await contractServiceWrapperProxy.setServiceProviderPermissions(serviceProviderProxyAddress, kycPermissionAll);
  }

  // we cannot complete the upgrade in one step using the method upgradeAndCall below because the proxy admin is not qoe in the service wrapper
  {
    /*
    // update and setServiceProviderPermissions
    const calldata = new ethers.Interface(ServiceWrapper.abi).encodeFunctionData('setServiceProviderPermissions', [serviceProviderProxyAddress, kycPermissionAll])

    console.log('update service wrapper proxy logic address and setServiceProviderPermissions')
    const contractServiceWrapperProxyAdmin = new ethers.Contract(serviceWrapperProxyAdminAddress, ProxyAdmin.abi, ownerWallet)
    tx = await contractServiceWrapperProxyAdmin.upgradeAndCall(serviceWrapperProxyAddress, logicServiceWrapperAddress, calldata)
    await tx.wait()
    */
  }
};

main();
