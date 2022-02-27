
import { interactWriteDryRun, smartweave } from 'smartweave';
import kohaku from '@_koi/kohaku';
import Wallet from '../models/walletModel.js';
import checkTxConfirmation from '../helpers/checkTxConfirmation.js'
import {writeInContract} from '../helpers/smartContractIntreract.js'
import axios from 'axios';
import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

const tokenTransfer = {
  arTransfer : async (reqArTransferWallet) => {
    console.log(reqArTransferWallet.req.body);
    const req = await reqArTransferWallet.req;

    try {
      console.log("start now")
      const arweave = await reqArTransferWallet.arweave;
      const callerWallet = await Wallet.findById(req.body.walletId);
      console.log(callerWallet.walletAddAr);
      const targetWallet = await Wallet.findOne({walletAddAr: req.body.toWallet})
      // const targetUser = await User.findOne({wallets[req.body.toWallet]});
      console.log(targetWallet);

      const caller = callerWallet.walletAddAr;
      console.log("caller", caller);

      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      
      console.log("key", wallet);
  
      const tx = await arweave.createTransaction({
        target: req.body.toWallet,
        quantity: arweave.ar.arToWinston(Number(req.body.quantity)),
      }, wallet);
  
      console.log(tx);
        
      await arweave.transactions.sign(tx, wallet);
      console.log("signing done", tx) 
      await arweave.transactions.post(tx);
      console.log("submitted", tx.id) 
    
      const txId = await tx.id;

      console.log("start confirmation", txId)
      const isTxConfirm = await checkTxConfirmation(txId, arweave)
  
      const result = {
        txId, isTxConfirm
      }

      console.log("end confirmation", result)

      const pendingTransaction = {
        txId: result.txId,
        txType: {
          type: "AR_TRANSFER",
          debitedWallet: caller,
          creditedWallet: target,
          qty: input.qty,
          ticker: "AR",
        },
        body: result.isTxConfirm
      }
      console.log("writing in db")
      await callerWallet.pendingTransactions.push(pendingTransaction);
      await callerWallet.save();
      console.log(callerWallet)

      await targetWallet.recievedTransactions.push(pendingTransaction);
      await targetWallet.save();
      console.log("last", targetWallet)

      return (result);

    } catch (err) {
      console.log(err);
      return (err)
    }
  
  },
  
  koiiTransfer : async (reqKoiiTransferWallet) => {
    console.log(reqKoiiTransferWallet.req.body.walletId);

    const req = reqKoiiTransferWallet.req;
    try {
      const walletId = reqKoiiTransferWallet.req.body.walletId;
      console.log(walletId);

      const callerWallet = await Wallet.findById(walletId);
      console.log(callerWallet);

      const targetWallet = await Wallet.findOne({walletAddAr: req.body.toWallet})
      // const targetUser = await User.findOne({wallets[req.body.toWallet]});
      console.log(targetWallet);

      const koiiLiveContractId = reqKoiiTransferWallet.koiiLiveContractId;
      const arweave = reqKoiiTransferWallet.arweave;

     
      // connecting to koii contract
      const url = 'https://mainnet.koii.live/state'
      const resData = await axios.get(url);
      // const resData = await myReadContracts.readKoiiContract
      const koiiData = await resData.data;
  
      const caller = callerWallet.walletAddAr;
      console.log("caller", caller);
   
      const input = {
        function: "transfer",
        target: req.body.toWallet,
        qty: Number(req.body.quantity),
    
      }
  
      const state = koiiData;
      console.log("2", state.balances.length)
  
      console.log(state.balances[caller])
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      
      console.log("key", wallet);

      const txId = await writeInContract({
        contractId: koiiLiveContractId,
        input: input,
        wallet: wallet
      })
  
      console.log("txId here", txId)

      if(txId) {
        console.log("start confirmation", txId)
        const isTxConfirm = await checkTxConfirmation(txId, arweave)
    
        const result = {
          txId, isTxConfirm
        }
  
        console.log("end confirmation", result)
  
        const pendingTransaction = {
          txId: result.txId,
          txType: {
            type: "KOII_TRANSFER",
            debitedWallet: caller,
            creditedWallet: target,
            qty: input.qty,
            ticker: "KOII",
          },
          body: result.isTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransaction);
        await callerWallet.save();
        console.log(callerWallet)
  
        await targetWallet.recievedTransactions.push(pendingTransaction);
        await targetWallet.save();
        console.log("last", targetWallet)
  
        return (result);
      } else {
        console.log("transaction failed")
        return ({message: "Transaction failed"});
      }
    } catch (error) {
      console.error(error);
      return (error);
    }
  },

  // transfer rat
  ratTransfer : async (reqRatTransferWallet) => {
    const req = reqRatTransferWallet.reqCommand;
    const arweave = reqRatTransferWallet.arweave;
    const ratLiveContractId = reqRatTransferWallet.ratLiveContractId;
    try {

      const walletId = req.body.walletId;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      console.log("caller", caller)

      const targetWallet = await Wallet.findOne({walletAddAr: req.body.toWallet})
      const target = `${req.body.toWallet.toString()}`;
      console.log("toWallet", target)

      const qty = Number(req.body.quantity);
      const input = {
        function: "transfer",
        target: target,
        qty: qty,
      }
      console.log(input)
    
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));

      const txId = await writeInContract({
        contractId: ratLiveContractId, input, wallet
      });
      

      console.log("4_2", txId)

      if(txId) {
        const isTxConfirm = await checkTxConfirmation(txId, arweave)
        const result = {
          txId, isTxConfirm
        }
        console.log("end confirmation", result)

        const pendingTransaction = {
          txId: result.txId,
          txType: {
            type: "RAT_TRANSFER",
            debitedWallet: caller,
            creditedWallet: target,
            qty: qty,
            ticker: "RAT",
          },
          body: result.isTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransaction);
        await callerWallet.save();
        console.log("caller")

        await targetWallet.recievedTransactions.push(pendingTransaction);
        await targetWallet.save();
        console.log("target")

        const resultStatus = await arweave.transactions.getStatus(result.txId);
        console.log("resultStatus", resultStatus);

      
        return (result, resultStatus);
      } else {
        console.log("transaction failed")
        return ({message: "Transaction failed"});
      }
    } catch (error) {
      console.log(error)
      return (error);
    }
  }
    
}

export default tokenTransfer;