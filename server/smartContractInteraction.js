import Arweave from 'arweave';
import * as SmartWeaveSdk from 'redstone-smartweave';
import {smartweave} from 'smartweave';
import kohaku from '@_koi/kohaku';
import dotenv from 'dotenv';
dotenv.config();

// const arweave = Arweave.init({
//   host: "dh48zl0solow5.cloudfront.net",
//   port: 443,
//   protocol: "https",
//   timeout: 20000,
//   logging: false,
// })

const arweaveOptions = {
  host: "arweave.net",
  port: 443,
  protocol: "https",
  timeout: 20000,
  logging: false,
}

async function initArweave() {
  let arweave = new Arweave(arweaveOptions);
  return arweave;
}



const koiiLiveContractId = process.env.KOII_LIVE;
const ratLiveContractId = process.env.CRYPTEX_TEST;  //smart contract id



export async function kohakuReadContract (contractId) {
  let arweave = await initArweave();

  const smartweaveReadRatContract = await smartweave.readContract(arweave, contractId);
  const kohakuReadigContract = await kohaku.readContract(arweave, contractId);
  const expKohakuReadingContract = kohaku.exportCache();
  kohaku.importCache(arweave, expKohakuReadingContract);
  await kohaku.readContract(arweave, ratLiveContractId);
  console.log("smartweaveReadRatContract : ", smartweaveReadRatContract );
  console.log("kohakuReadRatContract : ", kohakuReadigContract );
  return kohakuReadigContract;
}

async function smartContractInteraction () {

  let arweave = await initArweave();

  SmartWeaveSdk.LoggerFactory.INST.logLevel("fatal"); 

  const smartweave = SmartWeaveSdk.SmartWeaveWebFactory
    .memCachedBased(arweave, 2)
    .setInteractionsLoader(new SmartWeaveSdk.RedstoneGatewayInteractionsLoader("https://gateway.redstone.finance", {notCorrupted: true}))
    .setDefinitionLoader(new SmartWeaveSdk.RedstoneGatewayContractDefinitionLoader("https://gateway.redstone.finance", arweave, new SmartWeaveSdk.MemCache()))
    .build();

  const ratContract = smartweave.contract(ratLiveContractId)
  const readRatContract = await ratContract.readState();
  const stateRatContract = readRatContract.state;
  
  return {
    arweave,
    koiiLiveContractId,
    ratLiveContractId,
    smartweave,
    ratContract,
    readRatContract,
    stateRatContract,
  }
}
export default smartContractInteraction;

