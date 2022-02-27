
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import createShopGame from "../rat_core/createShopGame.js";
import shopWorth from '../venetian/shopWorth.js';
import checkTxConfirmation from '../helpers/checkTxConfirmation.js';
import { writeInContract, readContract } from '../helpers/smartContractIntreract.js';
import smartContractInteraction from '../smartContractInteraction.js';


import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const clientUrl = process.env.CLIENT_URL;

const shopGameCtrl = {
  getShopParams: async (reqGetShopParams) => {
    const req = await reqGetShopParams.req;
    const shop = await reqGetShopParams.shop;
    const activeGameContract = shop.activeGameContract;
    try {
      const gameContractState = await readContract(activeGameContract);
      const shopParams = {
        req,
        shop: shop,
        gameContractState: gameContractState,
      }

      const {Wdash} = await shopWorth(shopParams);

      const result = {
        Wdash
      }
      return result;
    } catch (error) {
      console.error(error)
      return error;
    }
  },

  shopGameCreate: async (reqCreateShopGameData) => {
    console.log("start creating shop game");
    const req = await reqCreateShopGameData.req;
    const shop = await reqCreateShopGameData.shop;
    const arweave = await reqCreateShopGameData.arweave;
    const ratLiveContractId = await reqCreateShopGameData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let brandUser = await User.findOne({
        _id: shop.brand
      });

      const walletId = brandUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)
      const shopPage = `${clientUrl}/shop/${shop._id}`;
      const gameParams = {
        initialWorth : shop. shWorth,
        pools : {
          likeEP : 0,
          flagEP : 0 
        }
      }

      const gameInput = {
        gameId: shop._id,
        gameName: shop.name,
        gameTitle: `${shop.name}_SHOP_GAME`,
        gameType: 'SHOP_GAME',
        gameTags: shop.shopTags,
        gamePage: shopPage,
        gameParams: gameParams,
      }

      const action = {
        caller, stateRatContract, 
        input : gameInput, 
        wallet
      }
      console.log(action)

      if(stateRatContract.balances[caller] <= (shop.shWorth)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const createdGameTxId = await createShopGame(action);
        const isGameTxConfirm = await checkTxConfirmation(createdGameTxId, arweave)
        const resultGame = {
          createdGameTxId, isGameTxConfirm
        }
        const pendingTransactionGame = {
          txId: resultGame.createdGameTxId,
          txType: {
            type: "SHOP_GAME_CREATE",
            debitedWallet: callerWallet._id,
          },
          body: resultGame.isGameTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionGame);
        const input = {
          function : "registerGame",
          gameContract : createdGameTxId,
          qty : Number(shop.shWorth),
          type : {game: "SHOP_GAME", active: true, time: new Date().toString() }
        };

        const ratStateTxId = await writeInContract({
          contractId: ratLiveContractId, input, wallet
        });
          
        console.log("ratStateTxId", ratStateTxId)

        const isRatTxConfirm = await checkTxConfirmation(ratStateTxId, arweave)
        const resultRat = {
          ratStateTxId, isRatTxConfirm
        }
        const pendingTransactionRat = {
          txId: resultRat.ratStateTxId,
          txType: {
            type: "REGISTER_SHOP_GAME",
            debitedWallet: callerWallet._id,
          },
          body: resultRat.isRatTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionRat);

        await callerWallet.save();
        console.log("caller")
        const resultStatusGame = await arweave.transactions.getStatus(resultGame.createdGameTxId);
        const resultStatusRat = await arweave.transactions.getStatus(resultRat.ratStateTxId);
        console.log("resultHere");

        return ({createdGameTxId, ratStateTxId, resultStatusGame, resultStatusRat});
      }
    } catch (error) {
      console.log('err-last', error);
      return (error);
    }
  },

  shopGameRemove: async (reqShopGameRemove) => {
    console.log("removing shop game");
    const req = await reqShopGameRemove.req;
    const shop = await reqShopGameRemove.shop;
    const activeGameContract = await reqShopGameRemove.activeGameContract;
    const arweave = await reqShopGameRemove.arweave;
    const ratLiveContractId = await reqShopGameRemove.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let brandUser = await User.findOne({
        _id: shop.brand
      });

      const walletId = brandUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)

      if(stateRatContract.balances[caller] <= (shop.shWorth)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const input = {
          function : "deregisterGame",
          gameContract : activeGameContract,
          qty : Number(shop.shWorth),
          type : { game: "SHOP_GAME", time: new Date().toString() }
        }

        console.log(input);

        const ratStateTxId = await writeInContract({
          contractId: ratLiveContractId, input, wallet
        });
          
        const isRatTxConfirm = await checkTxConfirmation(ratStateTxId, arweave)
        const resultRat = {
          ratStateTxId, isRatTxConfirm
        }

        const pendingTransactionRat = {
          txId: resultRat.ratStateTxId,
          txType: {
            type: "DEREGISTER_SHOP_GAME",
            debitedWallet: callerWallet._id,
          },
          body: resultRat.isRatTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionRat);
        await callerWallet.save();
        console.log("caller")
        const resultStatusRat = await arweave.transactions.getStatus(resultRat.ratStateTxId);
        console.log("resultHere");
        return ({ratStateTxId, resultStatusRat});

      }
    } catch (error) {
      console.log('err-last', error);
      return (error);
    }
  },

  shopGamePlay: async (reqShopGamePlayData) => { 
    console.log("start");
    const req = await reqShopGamePlayData.req;
    const shop = await reqShopGamePlayData.shop;
    const interaction = await reqShopGamePlayData.interaction;
    console.log("end")
    try {
      const ratContract = await smartContractInteraction();
      const ratLiveContractId = ratContract.ratLiveContractId;
      const arweave = ratContract.arweave;
      const stateRatContract = ratContract.stateRatContract;
      const vinciis = await stateRatContract.owner;

      let brandUser = await User.findOne({
        _id: shop.brand
      });

      const vinciisWallet = await Wallet.findOne({ walletAddAr: vinciis});
      const brandWalletId = brandUser.defaultWallet;
      const brandWallet = await Wallet.findById(brandWalletId);
      const brand = await brandWallet.walletAddAr;
      
      let callerUser = await User.findOne({
        _id: req.user._id
      })
      const callerWalletId = callerUser.defaultWallet;
      const callerWallet = await Wallet.findById(callerWalletId);
      const caller = await callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));

      // game contract
      const gameContractId = shop.activeGameContract;
      const gameContractState = await readContract(gameContractId)
 
      // rat state
      const ratContractState = stateRatContract;

      const shopParams = {
        req,
        shop: shop,
        gaemContractState: gameContractState,
      }

      const Wdash = await shopWorth(shopParams);
      console.log( Wdash);

      // like action
      if(interaction === "like") {

        let input = {
          function: "stake",
          interaction: interaction,
          pool: "likeEP",
          qty: Number((1/shop.shWorth).toFixed(5))
        }

        console.log(input);

        const txIdGame = await writeInContract({
          contractId: gameContractId, input, wallet
        })
        
        console.log("txId", txIdGame);
        const isTxConfirm = await checkTxConfirmation(txIdGame, arweave);
        const resultGame = {
          txIdGame, isTxConfirm
        }
        const pendingGameTransaction = {
          txId: resultGame.txIdGame,
          txType: {
            type: "LIKE_SHOP_GAME_PLAY",
            debitedWallet: caller,
            qty: "data",
            ticker: "Ar",
          },
          body: resultGame.isTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingGameTransaction);
        await callerWallet.save();
        console.log("caller")
        const resultGameStatus = await arweave.transactions.getStatus(resultGame.txIdGame);
        console.log("resultStatus", resultGameStatus);

        if(isTxConfirm !== false) {

          let input = {
            function: "transfer",
            target: brand,
            qty: Number((1/shop.shWorth).toFixed(5)),
          }

          const ratTransfer = await writeInContract({
            contractId: ratLiveContractId, input, wallet
          })
         
          const isRatTxConfirm = await checkTxConfirmation(ratTransfer, arweave)
          const result = {
            ratTransfer, isRatTxConfirm
          }
          console.log("end confirmation", result)

          const pendingTransaction = {
            txId: result.ratTransfer,
            txType: {
              type: "LIKE_SHOP_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: brand,
              qty: Number((1/shop.shWorth).toFixed(5)),
              ticker: "RAT",
            },
            body: result.isRatTxConfirm
          }
          console.log("writing in db")
          await callerWallet.pendingTransactions.push(pendingTransaction);
          await callerWallet.save();
          console.log("caller")

          await brandWallet.recievedTransactions.push(pendingTransaction);
          await brandWallet.save();
          console.log("target")

          const resultStatus = await arweave.transactions.getStatus(result.ratTransfer);
          console.log("resultStatus", resultStatus);

          return ({ratTransfer, resultStatus, txIdGame, resultGameStatus, interaction})
        }
      }

      // flag action
      if(interaction === "flag") {
        let input = {
          function: "stake",
          interaction: interaction,
          pool: "flagEP",
          qty: Number((1/shop.shWorth).toFixed(5))
        }
        console.log(input);

        const txIdGame = await writeInContract({
          contractId: gameContractId, input, wallet
        });
        console.log("txId", txIdGame);
        const isTxConfirm = await checkTxConfirmation(txIdGame, arweave);
        const resultGame = {
          txIdGame, isTxConfirm
        }
        const pendingGameTransaction = {
          txId: resultGame.txIdGame,
          txType: {
            type: "FLAG_SHOP_GAME_PLAY",
            debitedWallet: caller,
            qty: "data",
            ticker: "Ar",
          },
          body: resultGame.isTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingGameTransaction);
        await callerWallet.save();
        console.log("caller")
        const resultGameStatus = await arweave.transactions.getStatus(resultGame.txIdGame);
        console.log("resultStatus", resultGameStatus);

        if(isTxConfirm !== false) {
          let input = {
            function: "transfer",
            target: vinciis,
            qty: Number((1/shop.shWorth).toFixed(5)),
          };

          const ratTransfer = await writeInContract({
            contractId: ratLiveContractId, input, wallet
          });
         
          const isRatTxConfirm = await checkTxConfirmation(ratTransfer, arweave)
          const result = {
            ratTransfer, isRatTxConfirm
          }
          console.log("end confirmation", result)

          const pendingTransaction = {
            txId: result.ratTransfer,
            txType: {
              type: "FLAG_SHOP_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: vinciis,
              qty: Number((1/shop.shWorth).toFixed(5)),
              ticker: "RAT",
            },
            body: result.isRatTxConfirm
          }
          console.log("writing in db")
          await callerWallet.pendingTransactions.push(pendingTransaction);
          await callerWallet.save();
          console.log("caller")

          await vinciisWallet.recievedTransactions.push(pendingTransaction);
          await vinciisWallet.save();
          console.log("target")

          const resultStatus = await arweave.transactions.getStatus(result.ratTransfer);
          console.log("resultStatus", resultStatus);

          return ({ratTransfer, resultStatus, txIdGame, resultGameStatus, interaction})
        }
      }

     
    } catch (error) {
      console.log('err-last', error);
      return (error);
    }
  },
}

export default shopGameCtrl;