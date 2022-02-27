

export default async function getStatusRat (state, action) {
  const arweave = action.arweave;
  const wallet = action.requestedWallet;
  try {
    const pendingTransactions = wallet.pendingTransactions
    const pendingTx = pendingTransactions.map(tx => ({
      _id: tx._id, 
      txId: tx.txId,
      txType: tx.txType,
    }));
    const recievedTransactions = wallet.recievedTransactions;
    const recievedTx = recievedTransactions.map(tx => ({
      _id: tx._id, 
      txId: tx.txId, 
      txType: tx.txType,
    }));
    for(let i=0; i<pendingTx.length; i++) {
      const tx = pendingTx[i];
      const pendingTxId = tx.txId;
      const txStatus = await arweave.transactions.getStatus(pendingTxId)
      if (txStatus.status === 200 && txStatus.confirmed !== null) {
        const completeTx = {
          txId: tx.txId,
          txType: tx.txType,
          body: txStatus
        }
        await wallet.transactions.push(completeTx)
        // await wallet.pendingTransactions.pull(tx._id)
        console.log("pendingTx");
        await wallet.save();
      }
    }
    for (let j=0; j<recievedTx.length; j++) {
      const tx = recievedTx[j];
      const recievedTxId = tx.txId;
      const recievedTxStatus = await arweave.transactions.getStatus(recievedTxId)
      if (recievedTxStatus.status === 200 && recievedTxStatus.confirmed !== null) {
        const completeRecievedTx = {
          txId: tx.txId,
          txType: tx.txType,
          body: recievedTxStatus
        }
        await wallet.recievedTransactions.push(completeRecievedTx)
        // await wallet.recievedTransactions.pull(tx._id)
        console.log("recievedTx");
        await wallet.save();
      }
    }
    console.log("resultant saved wallet");
    return (wallet);
  } catch (err) {
    console.log(err);
    return (err)
  }
}