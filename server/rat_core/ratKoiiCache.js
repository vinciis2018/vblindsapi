import Arweave from 'arweave';
import { smartweave } from 'smartweave';
import kohaku from '@_koi/kohaku';
import * as SmartWeaveSdk from 'redstone-smartweave';


// export default 
async function kohakuCache ( ) {

  // const arweave = Arweave.init({
  //   host: 'arweave.net',
  //   port: 443,
  //   protocol: 'https',
  //   timeout: 20000,
  //   logging: false,
  // });

  // // const ratLiveContractId = 'xtKfcqs-DiuC6cbdkn3qXxWKjW2c-FM-4fiV6YkiH6Y'  //smart contract id
  const ratLiveContractId = 'l_awQj2sBz2TugkrL4h7LMmWKNlrEQXGvlqE6HsrECA'  //smart contract id
  
  // const smartweaveReadRatContract = await smartweave.readContract(arweave, ratLiveContractId);
  // const kohakuReadRatContract = await kohaku.readContract(arweave, ratLiveContractId);
  // const expKohakuRatContract = kohaku.exportCache();
  // kohaku.importCache(arweave, expKohakuRatContract);
  // console.log("smartweave", smartweaveReadRatContract);
  // console.log("kohaku", kohakuReadRatContract);
  
  // return {kohakuReadRatContract };

  
  const arweave = Arweave.init({
    host: "dh48zl0solow5.cloudfront.net",
    port: 443,
    protocol: "https",
    timeout: 20000,
    logging: false,
  })

  const smartweave = SmartWeaveSdk.SmartWeaveNodeFactory.memCached(arweave);
  const contract = smartweave.contract(ratLiveContractId)
  const state = await contract.readState();
  // const kohakuReadRatContract = await kohaku.readContract(arweave, ratLiveContractId);
  // const expKohakuRatContract = kohaku.exportCache();
  // kohaku.importCache(arweave, expKohakuRatContract);

  console.log(state.state.balances)
  // console.log("kohaku", kohakuReadRatContract);
}

(async () => await kohakuCache())();

