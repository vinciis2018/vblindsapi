
import Arweave from 'arweave';
import * as fs from 'fs';
import path from 'path';
const __dirname = path.resolve();

const arweave = Arweave.init({
    host: 'arweave.net',
    protocol: 'https',
    port: 443
});

// const initialState = fs.readFileSync(
//   path.join(__dirname, "server/wallet_contract", `init_tokenRat_state.json`)
// );

const contractSource = fs.readFileSync(
  path.join(__dirname, "./ratTrap.js")
);
// const contractSource = "lpo8x-d58Oh4uvlSb2bfBN2j2INBct7i5erSTcpMzwo";

const wallet = JSON.parse(fs.readFileSync(
  path.join(__dirname, `../../wallet_drive/key_5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg.json`)
));
async function createContract() {
  try {
    // Let's first create the contract transaction.
    const contractTx = await arweave.createTransaction({ data: contractSource }, wallet);
    contractTx.addTag('Service', 'Blinds by Vinciis');
    contractTx.addTag('App-Name', 'SmartWeaveContractSource');
    contractTx.addTag('App-Version', '0.3.0');
    contractTx.addTag('Content-Type', 'application/javascript');
    
    // Sign
    await arweave.transactions.sign(contractTx, wallet);
    // Let's keep the ID, it will be used in the state transaction.
    const contractSourceTxId = contractTx.id;
    
    // Deploy the contract source
    await arweave.transactions.post(contractTx);
    console.log(contractSourceTxId)
    console.log(contractTx)
    
    // // Now, let's create the Initial State transaction
    // console.log(initialState)
    // const initialStateTx = await arweave.createTransaction({ data: initialState }, wallet);
    // initialStateTx.addTag('Service', 'Blinds by Vinciis');
    // initialStateTx.addTag('App-Name', 'SmartWeaveContract');
    // initialStateTx.addTag('App-Version', '0.3.0');
    // initialStateTx.addTag('Contract-Src', contractSourceTxId);
    // initialStateTx.addTag('Content-Type', 'application/json');
    
    // // Sign
    // await arweave.transactions.sign(initialStateTx, wallet);
    // const initialStateTxId = initialStateTx.id;
    // // Deploy
    // await arweave.transactions.post(initialStateTx);
    // console.log(initialStateTxId)
    // console.log(initialStateTx)

  } catch (error) {
    console.error(error);
  }

}
createContract();