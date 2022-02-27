// import kohaku from '@_koi/kohaku';

import Wallet from '../models/walletModel.js';
import User from '../models/userModel.js';
import createWallet from '../rat_core/createWallet.js'
import getStatusRat from '../rat_core/getStatusRat.js';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import * as fs from 'fs';
import path from 'path';
import axios from 'axios';
import { readContract } from '../helpers/smartContractIntreract.js';

const __dirname = path.resolve();


const walletCtrl = {

  walletCreate: async (reqCreateWallet) =>{
    console.log(reqCreateWallet.req.body);
    const reqBody = await reqCreateWallet.req.body;
    const arweave = await reqCreateWallet.arweave;
    
    try {
      const user = await User.findById(reqBody.user._id);
      console.log("User");
      if (user.isItanimulli === true || user.wallets.length < 1) {
        const walletId = new mongoose.Types.ObjectId();
        // creates the key
        const action = {
          arweave, reqBody, 
        };

        const result = await createWallet(action);
        const walletKey = result.newWalletKey;
        const walletAddress = result.newWalletAddress;
        console.log("walletKey, walletAddress");

        fs.writeFile(
          path.join(__dirname, "server/wallet_drive", `key_${walletAddress}.json`),
          JSON.stringify(walletKey),((err) => { if(err) {console.log(err)} })
        )
        
        const createdWallet = new Wallet({
          _id: walletId,
          user: user._id,
          // will be saved using bcrypt
          walletAddAr: result.newWalletAddress,
        });
        // await createdWallet.save();
        console.log("createdWallet");

        await user.wallets.push(createdWallet._id);
        if(!user.defaultWallet){
          user.defaultWallet = createdWallet._id;
          console.log("defaultWallet");
        }
        // await user.save();
        console.log("user saved in db");

     

        const jwk = result.newWalletKey;
        
        console.log("key", jwk);
        console.log("writing done", result);

        return ({
          message: 'new wallet created',
          wallet: createdWallet,
          jwk: jwk
        });

      } else {
        console.log('wallet already exists');
        return ({ message: 'wallet already exist' });
      }
    } catch (error) {
      console.error(error);
      return (error);
    }
  },

  walletDetails: async (reqDetailsWallet) => {
    const req = await reqDetailsWallet.req;
    const arweave = await reqDetailsWallet.arweave;
    const ratLiveContractId = await reqDetailsWallet.ratLiveContractId;

    try {
      const walletId = req.params.id
      const requestedWallet = await Wallet.findById(walletId);

    if (requestedWallet) {
      const myWalletKey = requestedWallet.walletAddAr;
      console.log(myWalletKey);
      
      const liveState = await axios.get(`${process.env.HOST_URL}${process.env.PORT}/api/wallet/rat`)
      const state = liveState.data
      const ratBalance = state.balances
      requestedWallet.balanceRAT = ratBalance[myWalletKey] || 0;

      // // connecting to koii contract
      const url = 'https://mainnet.koii.live/state'
      const koiiLiveState = await axios.get(url);
      const koiiState = koiiLiveState.data
      const koiiBalance = koiiState.balances;
      requestedWallet.balanceKOII = koiiBalance[myWalletKey] || 0;

        // arweave balance
        const balance = await arweave.wallets.getBalance(myWalletKey);
        const ar = await arweave.ar.winstonToAr(balance);
        requestedWallet.balanceAR = ar;

        console.log(ratBalance[myWalletKey]);
        console.log(koiiBalance[myWalletKey]);
        console.log(ar);


        const action = {
          requestedWallet, arweave
        }

        const resultantWallet = await getStatusRat(state, action);
        requestedWallet.pendingTransactions = resultantWallet.pendingTransactions;
        requestedWallet.transactions = resultantWallet.transactions;
        requestedWallet.recievedTransactions = resultantWallet.recievedTransactions;

        requestedWallet.save();
        console.log("requestedWallet now");

        return (requestedWallet)

      } else {
        return ({ message: 'request wallet not found' })
      }
    } catch (error) {
      console.error(error);
      return (error);
    }

  },

  walletEdit: async(reqEditWallet) => {
    const req = await reqEditWallet.req;
    const arweave = await reqEditWallet.arweave;
    const ratLiveContractId = await reqEditWallet.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId)
    try {
      const walletId = req.params.id;
      const requestedWallet = await Wallet.findById(walletId);
      const user = await User.findById(requestedWallet.user);

      const ratBalance = stateRatContract.balances

      // connecting to koii contract
      const url = 'https://mainnet.koii.live/state'
      const koiiLiveState = await fetch(url);
      const koiiState = await koiiLiveState.json();
      const koiiBalance = koiiState.balances;

      if(requestedWallet) {
        const myWalletKey = requestedWallet.walletAddAr;

        // arweave balance
        const balanceAR = await arweave.wallets.getBalance(myWalletKey);
        console.log(balanceAR);

        const state = stateRatContract

        const action = {
          requestedWallet, arweave
        }

        const resultantWallet = await getStatusRat(state, action);
  
        requestedWallet.walletName = req.body.walletName;
        requestedWallet.balanceAr = await arweave.ar.winstonToAr(balanceAR) || "";
        requestedWallet.balanceKOII = await koiiBalance[myWalletKey] || 0;
        requestedWallet.balanceRAT = await ratBalance[myWalletKey] || 0;
        requestedWallet.pendingTransactions = resultantWallet.pendingTransactions;
        requestedWallet.transactions = resultantWallet.transactions;

        requestedWallet.defaultWallet = Boolean(req.body.defaultWallet);

        if(requestedWallet.defaultWallet === true) {
          console.log("adding defaultWallet to user")
          user.defaultWallet = requestedWallet._id;
          await user.save();
        } 
        if(requestedWallet.defaultWallet === false) {
          console.log("removing defaultWallet from user")
          user.defaultWallet = null;
          await user.save();
        }
        const updatedUserForWallet= await user.save();

        await requestedWallet.save();
        console.log("wallet Saved")
        return (requestedWallet);

      } else {
        return ({ message: 'Wallet not found' });
      }
      
    } catch (error) {
      return (error);
    }
  },

}

    
export default walletCtrl;

