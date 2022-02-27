import Wallet from '../models/walletModel.js';
// import uploadAtomicNft from '../rat_core/uploadAtomicNft.js';
// import uploadAtomicNft from '../rat_core/toDeploy/anftCanvas.js';
import checkTxConfirmation from '../helpers/checkTxConfirmation.js'


const uploadNftCtrl = {
  // Atomic NFT Upload
  uploadingAtomicNft : async (reqAtomicNftData) => {
      console.log("start", reqAtomicNftData.req.body);
      const req = await reqAtomicNftData.req;
      const arweave = await reqAtomicNftData.arweave;
      console.log(req.params.id)
      console.log(req.body)
      try {
        
        const walletId = req.params.id;
        const callerWallet = await Wallet.findById(walletId);
        const caller = callerWallet.walletAddAr;
        console.log("caller", caller)

        // const action = {
        //   caller, req, arweave
        // }
        // const result = await uploadAtomicNft(action);
        // console.log("result", result)
      
        const txId = req.body.txNft;
        console.log(txId)
        const isTxConfirm = await checkTxConfirmation(txId, arweave)
  
        const result = {
          txId, isTxConfirm
        }
        console.log("result")
        try {
          const pendingTransaction = {
            txId: result.txId,
            txType: {
              type: "ANFT_CREATION",
              debitedWallet: callerWallet._id,
            },
              body: result.isTxConfirm
          }
          console.log("writing in db")
          await callerWallet.pendingTransactions.push(pendingTransaction);
          await callerWallet.save();
          console.log(callerWallet)

          console.log("finally complete")
          return ("finally", result);

        } catch (err) {
          console.log('err-dbWrite', err);
          return (err);
        }
      } catch (error) {
        console.log('err-last', error);
        return (error);
      }
  }
    
}

export default uploadNftCtrl;