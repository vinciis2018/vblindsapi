// import Arweave from 'arweave';

// const arweave = Arweave.init({
//   host: 'arweave.net',
//   protocol: 'https',
//   port: 443,
// });


// const txid = "l_awQj2sBz2TugkrL4h7LMmWKNlrEQXGvlqE6HsrECA";

export default async function checkTxConfirmation(txId, arweave) {
  console.log(`TxId: ${txId}\nWaiting for confirmation`);
  const start = Date.now();
  for (;;) {
    try {
      const txStatus = await arweave.transactions.getStatus(txId)
      console.log("check confirm", txStatus)
    
      if(txStatus.status === 200 && txStatus.confirmed !== null) {
        return true;
      }
  
      if(txStatus.status === 202 && txStatus.confirmed === null) {
        return txStatus;
      }

      if(txStatus.status === 404) {
        return txStatus;
      }
    } catch (e) {
      if(e.type === "TX_FAILED") {
        console.error(e.type, "while checking tx confirmation");
        return false;
      }
      console.error(e)
    }
    console.log(Math.round((Date.now() - start) / 60000) + "m waiting");
    await new Promise((resolve) => setTimeout(resolve, 10000)); //wait 10s before checks to not get rate limited
  }
}

// checkTxConfirmation(txid, arweave)
//   .then((result) => {(
//     console.log(result)
//   )}
// )
    
