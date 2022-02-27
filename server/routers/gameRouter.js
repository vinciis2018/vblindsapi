import express from 'express';
import mongoose from 'mongoose';
import expressAsyncHandler from 'express-async-handler';
import axios from 'axios';
// import { smartweave } from 'smartweave';
import kohaku from '@_koi/kohaku';

import {isAuth} from '../utils.js';
// import { arweave } from '../index.js';
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import Screen from  '../models/screenModel.js';
import Calender from  '../models/calenderModel.js';
import Asset from '../models/assetModel.js';
import Video from '../models/videoModel.js';
import Channel from '../models/channelModel.js';
import Film from '../models/filmModel.js';
import Shop from '../models/shopModel.js';
import Item from '../models/itemModel.js';
import screenGameCtrl from '../controllers/screenGameCtrl.js';
import assetGameCtrl from '../controllers/assetGameCtrl.js';
import advertGameCtrl from '../controllers/advertGameCtrl.js';
import channelGameCtrl from '../controllers/channelGameCtrl.js';
import filmGameCtrl from '../controllers/filmGameCtrl.js';
import shopGameCtrl from '../controllers/shopGameCtrl.js';
import itemGameCtrl from '../controllers/itemGameCtrl.js';
import smartContractInteraction from '../smartContractInteraction.js';
import { readContract } from '../helpers/smartContractIntreract.js';
import checkTxConfirmation from '../helpers/checkTxConfirmation.js';


export const gameContractSrc = process.env.RATTRAP_TEST_SOURCE_CONTRACT;
const ratContract = await smartContractInteraction();
const gameRouter = express.Router();

console.log(gameContractSrc)
// screen
gameRouter.post(
  "/screen/:screenId/createScreenGame",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.screenId;
    console.log(screenId)
    try {
      const screen = await Screen.findById(screenId);
      const calender = await Calender.findOne({ screen: screenId });
      if ((!calender.activeGameContract) || (calender.activeGameContract === ("" || null))) {

        const reqScreenGameCreateData = {
          req,
          screen,
          gameContractSrc : gameContractSrc,
          ratLiveContractId: ratContract.ratLiveContractId,
          arweave: ratContract.arweave,
        }
        const result = await screenGameCtrl.screenGameCreate(reqScreenGameCreateData);
        console.log("result@gameRouter", result);
        console.log("result@gameRouter_txId_for_game", result.createdGameTxId);
    
        calender.activeGameContract = result.createdGameTxId;
        const updatedCalender = await calender.save();
        return res.status(200).send({ 
          message: 'game created', 
          calender: updatedCalender,
          result
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Screen Not Found' });
    }
  })
)

gameRouter.get(
  '/screen/:id/gameDetails',
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    const arweave = ratContract.arweave;
    try {
      const calender = await Calender.findOne({ screen: screenId })
      const gameContract = calender.activeGameContract;
      console.log("gameContract", gameContract);
      if(calender.activeGameContract) {
        const isTxConfirm = await checkTxConfirmation(gameContract, arweave)
        console.log(isTxConfirm)
        if(isTxConfirm) {
          const gameData = await readContract(gameContract);
          console.log(gameData);
          return res.status(200).send(gameData);
        } else {
          const gameData = {
            message: "transactions still in confirmation or either isn't confirm. Please wait atleast 10-20 minutes for result"
          }
          return res.status(202).send(gameData);
        }
      } else {
        console.log("no active game in calender")
        return res.status(401).send({ message: 'No game found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Screen Not Found' });
    }
  })
)

gameRouter.post(
  '/screen/:screenId/removeScreenGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.screenId;
    console.log(screenId)
    try{
      const screen = await Screen.findById(screenId);
      const calender = await Calender.findOne({ screen: screenId });
      const masterUser = await User.findOne({
        _id: screen.master
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      console.log(caller)
      if(calender.activeGameContract !== "" || calender.activeGameContract !== null) {
        console.log("deregistering game")
        const reqScreenGameRemove = {
          req,
          screen,
          activeGameContract: calender.activeGameContract,
          arweave: ratContract.arweave,
          ratLiveContractId: ratContract.ratLiveContractId

        }
        const result = await screenGameCtrl.screenGameRemove(reqScreenGameRemove)
        console.log("3", result)
        screen.likedBy = [],
        screen.flaggedBy = [],
        screen.subscribers = [],
        screen.pleas = [],
        screen.allies = [],
        await screen.save();
        calender.allGameContracts.push(calender.activeGameContract);
        calender.activeGameContract = "";
        console.log(calender)
        const updatedCalender = await calender.save();
        return res.status(200).send({ 
          message: 'game removed', 
          calender: updatedCalender,
          result
        });
      } else {
        console.log("no game to remove");
        return ("no game to remove");
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Screen Not Found' });
    }
  })
)

// asset
gameRouter.post(
  "/asset/:assetId/createAssetGame",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.assetId;
    console.log(assetId)
    try {
      const asset = await Asset.findById(assetId);
      if ((!asset.activeGameContract) || (asset.activeGameContract === ("" || null))) {

        const reqAssetGameCreateData = {
          req,
          asset,
          gameContractSrc : gameContractSrc,
          ratLiveContractId: ratContract.ratLiveContractId,
          arweave: ratContract.arweave,
        }
        const result = await assetGameCtrl.assetGameCreate(reqAssetGameCreateData);
        console.log("result@gameRouter", result);
        console.log("result@gameRouter_txId_for_game", result.createdGameTxId);
    
        asset.activeGameContract = result.createdGameTxId;
        const updatedAsset = await asset.save();
        return res.status(200).send({ 
          message: 'game created', 
          asset: updatedAsset,
          result
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Asset Not Found' });
    }
  })
)

gameRouter.get(
  '/asset/:id/gameDetails',
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.id;
    const arweave = ratContract.arweave;
    console.log(assetId)
    try {
      const asset = await Asset.findById(assetId)
      const gameContract = asset.activeGameContract;
      console.log("gameCOntract Here",gameContract)
      if(asset.activeGameContract) {
        const isTxConfirm = await checkTxConfirmation(gameContract, arweave)
        console.log(isTxConfirm)
        if(isTxConfirm) {
          const gameData = await readContract(gameContract);
          console.log(gameData);
          return res.status(200).send(gameData);
        } else {
          const gameData = {
            message: "transactions still in confirmation or either isn't confirm. Please wait atleast 10-20 minutes for result"
          }
          return res.status(202).send(gameData);
        }
      } else {
        console.log("no active game in asset")
        return res.status(401).send({ message: 'No game found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Asset Not Found' });
    }
  })
)

gameRouter.post(
  '/asset/:assetId/removeAssetGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.assetId;
    console.log(assetId)
    try{

      const asset = await Asset.findById(assetId);
      const masterUser = await User.findOne({
        _id: asset.master
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      console.log(caller)
      if(asset.activeGameContract !== "" || asset.activeGameContract !== null) {
        console.log("deregistering game")
        const reqAssetGameRemove = {
          req,
          asset,
          activeGameContract: asset.activeGameContract,
          arweave: ratContract.arweave,
          ratLiveContractId: ratContract.ratLiveContractId

        }
        const result = await assetGameCtrl.assetGameRemove(reqAssetGameRemove)
        console.log("3", result)
        asset.allGameContracts.push(asset.activeGameContract);
        asset.activeGameContract = "";
        console.log(asset)
        const updatedAsset = await asset.save();
        return res.status(200).send({ 
          message: 'game removed', 
          asset: updatedAsset,
          result
        });
      } else {
        console.log("no game to remove");
        return ("no game to remove");
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Asset Not Found' });
    }
  })
)

// advert
gameRouter.post(
  '/video/:videoId/createAdvertGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    console.log(videoId)
    try {
      const video = await Video.findById(videoId);
      if ((!video.activeGameContract) || (video.activeGameContract === ("" || null))) {

        const reqAdvertGameCreateData = {
          req,
          video,
          gameContractSrc : gameContractSrc,
          ratLiveContractId: ratContract.ratLiveContractId,
          arweave: ratContract.arweave,
        }
        const result = await advertGameCtrl.advertGameCreate(reqAdvertGameCreateData);
        console.log("result@gameRouter", result);
        console.log("result@gameRouter_txId_for_game", result.createdGameTxId);
    
        video.activeGameContract = result.createdGameTxId;
        const updateVideo = await video.save();
        return res.status(200).send({ 
          message: 'game created', 
          video: updateVideo,
          result
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Screen Not Found' });
    }
  })
)

gameRouter.get(
  '/video/:id/gameDetails',
  expressAsyncHandler(async (req, res) => {
     const videoId = req.params.id;
     const arweave = ratContract.arweave;
    console.log("videoId", videoId)
     try {
       const video = await Video.findById(videoId)
       const gameContract = video.activeGameContract;
       if(video.activeGameContract) {
        const isTxConfirm = await checkTxConfirmation(gameContract, arweave)
        console.log(isTxConfirm)
        if(isTxConfirm === true) {
          const gameData = await readContract(gameContract);
          console.log(gameData);
          return res.status(200).send(gameData);
        } else {
          const gameData = {
            message: "transactions still in confirmation or either isn't confirm. Please wait atleast 10-20 minutes for result"
          }
          console.log(gameData);
          return res.status(202).send(gameData);
        }
      } else {
        console.log("no active game in advert")
        return res.status(401).send({ message: 'No game found' });
      }
     } catch (error) {
       console.error(error);
       return res.status(404).send({ message: 'Advert Not Found' });
     }
  })
)

gameRouter.post(
  '/video/:videoId/removeAdvertGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    console.log(videoId)
    try{
      const video = await Video.findById(screenId);
      const masterUser = await User.findOne({
        _id: video.uploader
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      console.log(caller)
      if(video.activeGameContract !== "" || video.activeGameContract !== null) {
        console.log("deregistering game")
        const reqAdvertGameRemove = {
          req,
          video,
          activeGameContract: video.activeGameContract,
          arweave: ratContract.arweave,
          ratLiveContractId: ratContract.ratLiveContractId

        }
        const result = await advertGameCtrl.advertGameRemove(reqAdvertGameRemove)
        console.log("3", result)
        return res.status(200).send({ 
          message: 'game removed', 
          result
        });
      } else {
        console.log("no game to remove");
        return ("no game to remove");
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Screen Not Found' });
    }
  })
)


// channel
gameRouter.post(
  "/channel/:channelId/createChannelGame",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.channelId;
    console.log(channelId)
    try {
      const channel = await Channel.findById(channelId);
      if ((!channel.activeGameContract) || (channel.activeGameContract === ("" || null))) {

        const reqChannelGameCreateData = {
          req,
          channel,
          gameContractSrc : gameContractSrc,
          ratLiveContractId: ratContract.ratLiveContractId,
          arweave: ratContract.arweave,
        }
        const result = await channelGameCtrl.channelGameCreate(reqChannelGameCreateData);
        console.log("result@gameRouter", result);
        console.log("result@gameRouter_txId_for_game", result.createdGameTxId);
    
        channel.activeGameContract = result.createdGameTxId;
        const updatedChannel = await channel.save();
        return res.status(200).send({ 
          message: 'game created', 
          channel: updatedChannel,
          result
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Channel Not Found' });
    }
  })
)

gameRouter.get(
  '/channel/:id/gameDetails',
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    const arweave = ratContract.arweave;
    console.log(channelId)
    try {
      const channel = await Channel.findById(channelId)
      const gameContract = channel.activeGameContract;
      console.log("gameCOntract Here",gameContract)
      if(channel.activeGameContract) {
        const isTxConfirm = await checkTxConfirmation(gameContract, arweave)
        console.log(isTxConfirm)
        if(isTxConfirm) {
          const gameData = await readContract(gameContract);
          console.log(gameData);
          return res.status(200).send(gameData);
        } else {
          const gameData = {
            message: "transactions still in confirmation or either isn't confirm. Please wait atleast 10-20 minutes for result"
          }
          return res.status(202).send(gameData);
        }
      } else {
        console.log("no active game in channel")
        return res.status(401).send({ message: 'No game found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Channel Not Found' });
    }
  })
)

gameRouter.post(
  '/channel/:channelId/removeChannelGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.channelId;
    console.log(channelId)
    try{

      const channel = await Channel.findById(channelId);
      const allyUser = await User.findOne({
        _id: channel.ally
      });

      const walletId = allyUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      console.log(caller)
      if(channel.activeGameContract !== "" || channel.activeGameContract !== null) {
        console.log("deregistering game")
        const reqChannelGameRemove = {
          req,
          channel,
          activeGameContract: channel.activeGameContract,
          arweave: ratContract.arweave,
          ratLiveContractId: ratContract.ratLiveContractId

        }
        const result = await channelGameCtrl.channelGameRemove(reqChannelGameRemove)
        console.log("3", result)
        channel.allGameContracts.push(channel.activeGameContract);
        channel.activeGameContract = "";
        console.log(channel)
        const updatedChannel = await channel.save();
        return res.status(200).send({ 
          message: 'game removed', 
          channel: updatedChannel,
          result
        });
      } else {
        console.log("no game to remove");
        return ("no game to remove");
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Channel Not Found' });
    }
  })
)

// film
gameRouter.post(
  '/film/:filmId/createFilmGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const filmId = req.params.videoId;
    console.log(filmId)
    try {
      const film = await Film.findById(filmId);
      if ((!film.activeGameContract) || (film.activeGameContract === ("" || null))) {

        const reqFilmGameCreateData = {
          req,
          film,
          gameContractSrc : gameContractSrc,
          ratLiveContractId: ratContract.ratLiveContractId,
          arweave: ratContract.arweave,
        }
        const result = await filmGameCtrl.filmGameCreate(reqFilmGameCreateData);
        console.log("result@gameRouter", result);
        console.log("result@gameRouter_txId_for_game", result.createdGameTxId);
    
        film.activeGameContract = result.createdGameTxId;
        const updateFilm = await film.save();
        return res.status(200).send({ 
          message: 'game created', 
          film: updateFilm,
          result
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Screen Not Found' });
    }
  })
)

gameRouter.get(
  '/film/:id/gameDetails',
  expressAsyncHandler(async (req, res) => {
     const filmId = req.params.id;
     const arweave = ratContract.arweave;
    console.log("filmId", filmId)
     try {
       const film = await Film.findById(film)
       const gameContract = film.activeGameContract;
       if(film.activeGameContract) {
        const isTxConfirm = await checkTxConfirmation(gameContract, arweave)
        console.log(isTxConfirm)
        if(isTxConfirm === true) {
          const gameData = await readContract(gameContract);
          console.log(gameData);
          return res.status(200).send(gameData);
        } else {
          const gameData = {
            message: "transactions still in confirmation or either isn't confirm. Please wait atleast 10-20 minutes for result"
          }
          console.log(gameData);
          return res.status(202).send(gameData);
        }
      } else {
        console.log("no active game in film")
        return res.status(401).send({ message: 'No game found' });
      }
     } catch (error) {
       console.error(error);
       return res.status(404).send({ message: 'Film Not Found' });
     }
  })
)

gameRouter.post(
  '/film/:filmId/removeFilmGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const filmId = req.params.filmId;
    console.log(filmId)
    try{
      const film = await Film.findById(filmId);
      const allyUser = await User.findOne({
        _id: film.uploader
      });

      const walletId = allyUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      console.log(caller)
      if(film.activeGameContract !== "" || film.activeGameContract !== null) {
        console.log("deregistering game")
        const reqFilmGameRemove = {
          req,
          film,
          activeGameContract: film.activeGameContract,
          arweave: ratContract.arweave,
          ratLiveContractId: ratContract.ratLiveContractId

        }
        const result = await filmGameCtrl.filmGameRemove(reqFilmGameRemove)
        console.log("3", result)
        return res.status(200).send({ 
          message: 'game removed', 
          result
        });
      } else {
        console.log("no game to remove");
        return ("no game to remove");
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Film Not Found' });
    }
  })
)


// shop
gameRouter.post(
  "/shop/:shopId/createShopGame",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.shopId;
    console.log(shopId)
    try {
      const shop = await Shop.findById(shopId);
      if ((!shop.activeGameContract) || (shop.activeGameContract === ("" || null))) {

        const reqShopGameCreateData = {
          req,
          shop,
          gameContractSrc : gameContractSrc,
          ratLiveContractId: ratContract.ratLiveContractId,
          arweave: ratContract.arweave,
        }
        const result = await shopGameCtrl.shopGameCreate(reqShopGameCreateData);
        console.log("result@gameRouter", result);
        console.log("result@gameRouter_txId_for_game", result.createdGameTxId);
    
        shop.activeGameContract = result.createdGameTxId;
        const updatedShop = await shop.save();
        return res.status(200).send({ 
          message: 'game created', 
          shop: updatedShop,
          result
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Shop Not Found' });
    }
  })
)

gameRouter.get(
  '/shop/:id/gameDetails',
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    const arweave = ratContract.arweave;
    console.log(shopId)
    try {
      const shop = await Shop.findById(shopId)
      const gameContract = shop.activeGameContract;
      console.log("gameCOntract Here",gameContract)
      if(shop.activeGameContract) {
        const isTxConfirm = await checkTxConfirmation(gameContract, arweave)
        console.log(isTxConfirm)
        if(isTxConfirm) {
          const gameData = await readContract(gameContract);
          console.log(gameData);
          return res.status(200).send(gameData);
        } else {
          const gameData = {
            message: "transactions still in confirmation or either isn't confirm. Please wait atleast 10-20 minutes for result"
          }
          return res.status(202).send(gameData);
        }
      } else {
        console.log("no active game in shop")
        return res.status(401).send({ message: 'No game found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Shop Not Found' });
    }
  })
)

gameRouter.post(
  '/shop/:shopId/removeShopGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.shopId;
    console.log(shopId)
    try{

      const shop = await Shop.findById(shopId);
      const brandUser = await User.findOne({
        _id: shop.brand
      });

      const walletId = brandUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      console.log(caller)
      if(shop.activeGameContract !== "" || shop.activeGameContract !== null) {
        console.log("deregistering game")
        const reqShopGameRemove = {
          req,
          shop,
          activeGameContract: shop.activeGameContract,
          arweave: ratContract.arweave,
          ratLiveContractId: ratContract.ratLiveContractId

        }
        const result = await shopGameCtrl.shopGameRemove(reqShopGameRemove)
        console.log("3", result)
        shop.allGameContracts.push(shop.activeGameContract);
        shop.activeGameContract = "";
        console.log(shop)
        const updatedShop = await shop.save();
        return res.status(200).send({ 
          message: 'game removed', 
          shop: updatedShop,
          result
        });
      } else {
        console.log("no game to remove");
        return ("no game to remove");
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Shop Not Found' });
    }
  })
)

// item
gameRouter.post(
  '/item/:itemId/createItemGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const itemId = req.params.itemId;
    console.log(itemId)
    try {
      const item = await Item.findById(itemId);
      if ((!item.activeGameContract) || (item.activeGameContract === ("" || null))) {

        const reqItemGameCreateData = {
          req,
          item,
          gameContractSrc : gameContractSrc,
          ratLiveContractId: ratContract.ratLiveContractId,
          arweave: ratContract.arweave,
        }
        const result = await itemGameCtrl.itemGameCreate(reqItemGameCreateData);
        console.log("result@gameRouter", result);
        console.log("result@gameRouter_txId_for_game", result.createdGameTxId);
    
        item.activeGameContract = result.createdGameTxId;
        const updateItem = await item.save();
        return res.status(200).send({ 
          message: 'game created', 
          item: updateItem,
          result
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Item Not Found' });
    }
  })
)

gameRouter.get(
  '/item/:id/gameDetails',
  expressAsyncHandler(async (req, res) => {
     const itemId = req.params.id;
     const arweave = ratContract.arweave;
    console.log("itemId", itemId)
     try {
       const item = await Item.findById(item)
       const gameContract = item.activeGameContract;
       if(item.activeGameContract) {
        const isTxConfirm = await checkTxConfirmation(gameContract, arweave)
        console.log(isTxConfirm)
        if(isTxConfirm === true) {
          const gameData = await readContract(gameContract);
          console.log(gameData);
          return res.status(200).send(gameData);
        } else {
          const gameData = {
            message: "transactions still in confirmation or either isn't confirm. Please wait atleast 10-20 minutes for result"
          }
          console.log(gameData);
          return res.status(202).send(gameData);
        }
      } else {
        console.log("no active game in film")
        return res.status(401).send({ message: 'No game found' });
      }
     } catch (error) {
       console.error(error);
       return res.status(404).send({ message: 'Item Not Found' });
     }
  })
)

gameRouter.post(
  '/item/:itemId/removeItemGame',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const itemId = req.params.itemId;
    console.log(itemId)
    try{
      const item = await Item.findById(itemId);
      const brandUser = await User.findOne({
        _id: item.uploader
      });

      const walletId = brandUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      console.log(caller)
      if(item.activeGameContract !== "" || item.activeGameContract !== null) {
        console.log("deregistering game")
        const reqItemGameRemove = {
          req,
          item,
          activeGameContract: item.activeGameContract,
          arweave: ratContract.arweave,
          ratLiveContractId: ratContract.ratLiveContractId

        }
        const result = await itemGameCtrl.itemGameRemove(reqItemGameRemove)
        console.log("3", result)
        return res.status(200).send({ 
          message: 'game removed', 
          result
        });
      } else {
        console.log("no game to remove");
        return ("no game to remove");
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send({ message: 'Item Not Found' });
    }
  })
)



export default gameRouter;