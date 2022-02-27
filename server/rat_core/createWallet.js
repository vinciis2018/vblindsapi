
export default async function createWallet (action) {

  const arweave = action.arweave;
  console.log('state & action recieved');
  try {

    const newWalletKey = await arweave.wallets.generate()
    console.log("walletKey", newWalletKey);
    // gives the json address
    const newWalletAddress = await arweave.wallets.jwkToAddress(newWalletKey);
    console.log("walletAddress", newWalletAddress)

    if(newWalletKey && newWalletAddress) {
      
      // get wallet Balance
      const newWalletBalance = await arweave.wallets.getBalance(newWalletAddress)
      let winston = newWalletBalance;
      console.log("winston", winston);

      const ar = arweave.ar.winstonToAr(newWalletBalance);
      console.log("arweave", ar);
      
      const result = {
        newWalletKey,
        newWalletAddress,
        ar
      } 
      return result;
    }
  
  } catch (err) {
    console.error(err)
    return res.status(401).send(err);

  }


}