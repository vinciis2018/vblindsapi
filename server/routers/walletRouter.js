import express from 'express';
import mongoose from 'mongoose';

import expressAsyncHandler from 'express-async-handler';

import Wallet from '../models/walletModel.js';
import tokenTransfer from '../controllers/tokenTransferCtrl.js'
import { auth, generateToken, isItanimulli, isAuth } from '../utils.js';

import walletCtrl from '../controllers/walletCtrl.js';
import uploadNftCtrl from '../controllers/uploadNftCtrl.js';
import screenGameCtrl from '../controllers/screenGameCtrl.js';
import smartContractInteraction, { kohakuReadContract } from '../smartContractInteraction.js';


const ratContract = await smartContractInteraction();
const walletRouter = express.Router();

// wallet Create
walletRouter.post(
  '/walletCreate', 
  isAuth, 
  expressAsyncHandler(
  async (req, res) => {
    try {
      const reqCreateWallet = {
        req, 
        ratLiveContractId: ratContract.ratLiveContractId,
        arweave: ratContract.arweave,
      }
      const result = await walletCtrl.walletCreate(reqCreateWallet);
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
    
  })
  
);


// wallet to wallet transaction.
walletRouter.post(
  '/transfer/ar', 
  isAuth,
  expressAsyncHandler(async (req, res) => {

    try {
      const reqArTransferWallet = {
        req, 
        arweave: ratContract.arweave,
      }
      const result = await tokenTransfer.arTransfer(reqArTransferWallet);
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
);

walletRouter.post(
  '/transfer/koii', 
  isAuth,
  expressAsyncHandler(async (req, res) => {


    try {
      const reqKoiiTransferWallet = {
        req, 
        koiiLiveContractId: ratContract.koiiLiveContractId,
        arweave: ratContract.arweave,
      }
      const result = await tokenTransfer.koiiTransfer(reqKoiiTransferWallet);
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
);

walletRouter.post(
  '/transfer/rat', 
  isAuth, 
  expressAsyncHandler(async (req, res) => {

    try {
      console.log(req.body)
      const reqCommand = req;
      const reqRatTransferWallet = {
        reqCommand, 
        ratLiveContractId: ratContract.ratLiveContractId,
        arweave: ratContract.arweave,
      }
      const resultHere = await tokenTransfer.ratTransfer(reqRatTransferWallet);
      console.log(resultHere);
      const result = resultHere.result;
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
);



// edit walletRouter
walletRouter.put(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      const reqEditWallet = {
        req, 
        ratLiveContractId: ratContract.ratLiveContractId,
        arweave: ratContract.arweave,
      }
      const result = await walletCtrl.walletEdit(reqEditWallet);
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
);


// get all wallets
walletRouter.get(
  '/wallets',
  isAuth,
  expressAsyncHandler(async (req, res) => {

    try {
      const allWallets = await Wallet.find();
      if (allWallets) {
        
        return res.status(200).send(allWallets)
      } else {
        return res.status(400).send({ message: 'No wallets found' })
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
);


// rat details
walletRouter.get(
  '/rat',
  expressAsyncHandler(async (req, res) => {
    try {
      const ratState = await smartContractInteraction();

      const data = ratState.stateRatContract
      res.send(data)
    } catch (error) {
      console.error(error);
      res.send(error);
    }
  })
)

//get wallet details
walletRouter.get(
  '/:id',
  isAuth, 
  expressAsyncHandler ( async (req, res) => {
    try {
      const reqDetailsWallet = {
        req, 
        ratLiveContractId: ratContract.ratLiveContractId,
        arweave: ratContract.arweave,
      }
      console.log(reqDetailsWallet.ratLiveContractId)
      const result = await walletCtrl.walletDetails(reqDetailsWallet);
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
   
  })
);

// upload atomic nft
walletRouter.post(
  '/uploadAtomicNft/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log(req.body);
    console.log(req.params.id);
    try {
      const reqAtomicNftData = {
        req,
        arweave: ratContract.arweave,
      }
      const result = await uploadNftCtrl.uploadingAtomicNft(reqAtomicNftData);
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
)

walletRouter.post(
  '/advertWorth/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log(req.body);
    console.log(req.params.id);
    try {
      const reqAdvertWorthData = {
        req,
        arweave: ratContract.arweave,
      }
      const result = await screenGameCtrl.advertWorth(reqAdvertWorthData);
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
)

export default walletRouter;