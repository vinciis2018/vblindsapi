
import Arweave from 'arweave';
import * as SmartWeaveSDK from 'redstone-smartweave';

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

export async function readContract(contractId) {
  let arweave = await initArweave();
  const smartweave = SmartWeaveSDK.SmartWeaveWebFactory.memCachedBased(arweave).setInteractionsLoader(new SmartWeaveSDK.RedstoneGatewayInteractionsLoader("https://gateway.redstone.finance", {confirmed: true})).build();
  const contract = smartweave.contract(contractId)
  const result = await contract.readState();
  const state = result.state;
  console.log("redstone:", state);
  return state;
}


export async function writeInContract(contractHere) {
  let arweave = await initArweave();
  const smartweave = SmartWeaveSDK.SmartWeaveWebFactory.memCachedBased(arweave).setInteractionsLoader(new SmartWeaveSDK.RedstoneGatewayInteractionsLoader("https://gateway.redstone.finance", {confirmed: true})).build();
  const input = contractHere.input;
  const contractId = contractHere.contractId;
  const wallet = contractHere.wallet;
  const contract = smartweave
    .contract(contractId)
    .connect(wallet) // jwk should be a valid private key (in JSON Web Key format)
    .setEvaluationOptions({
      // with this flag set to true, the write will wait for the transaction to be confirmed
      waitForConfirmation: false,
    });
    const result = await contract.writeInteraction(input);
    console.log("redStone-smartweave-writeInteraction:", result);
    return result;
}

export async function viewStateForContract(contractHere) {
  let arweave = await initArweave();
  const smartweave = SmartWeaveSDK.SmartWeaveWebFactory.memCachedBased(arweave).setInteractionsLoader(new SmartWeaveSDK.RedstoneGatewayInteractionsLoader("https://gateway.redstone.finance", {confirmed: true})).build();
  const input = contractHere.input;
  const contractId = contractHere.contractId;
  const contract = smartweave.contract(contractId)
  const result = await contract.viewStateForTx({
    input: input,
    transaction: contractId
  })
  console.log("redStone-smartweave-viewTxState:", result);
  return result;
}

export async function deploySmartContract (
  wallet, initialState, contractSource
) {
  let arweave = await initArweave();
  const smartweave = SmartWeaveSDK.SmartWeaveWebFactory.memCachedBased(arweave).setInteractionsLoader(new SmartWeaveSDK.RedstoneGatewayInteractionsLoader("https://gateway.redstone.finance", {confirmed: true})).build();
  const contractId = await smartweave.createContract.deploy({
    wallet: wallet,
    initState: initialState,
    src: contractSource
  })
  console.log("created contract Id", contractId);
  return contractId;
}