
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import itemInteractionBudget from '../venetian/itemInteractionBudget.js';
import itemWorth from '../venetian/itemWorth.js';
import { writeInContract, readContract } from '../helpers/smartContractIntreract.js';
import createItemGame from "../rat_core/createItemGame.js";
import checkTxConfirmation from '../helpers/checkTxConfirmation.js';

import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const clientUrl = process.env.CLIENT_URL;

const itemGameCtrl = {
  getItemParams: async (reqGetItemParams) => {
    const req = await reqGetItemParams.req;
    const item = await reqGetItemParams.item;
    const activeGameContract = item.activeGameContract;
    try {
      // const gameContractState = await readContract(activeGameContract);
      const itemParams = {
        req,
        item: item,
        // gameContractState: gameContractState,
      }

      const {Wdash} = await itemWorth(itemParams);
      const {Bdash} = await itemInteractionBudget(itemParams);

      const result = {
        Wdash, Bdash
      }
      return result;
    } catch (error) {
      console.error(error)
      return error;
    }
  },

  itemGameCreate: async (reqItemGameCreateData) => {
    console.log("start creating item game");
    const item = await reqItemGameCreateData.item;
    const arweave = await reqItemGameCreateData.arweave;
    const ratLiveContractId = await reqItemGameCreateData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let brandUser = await User.findOne({
        _id: item.uploader
      });

      const walletId = brandUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)
      const itemPage = `${clientUrl}/item/${item._id}/${item.item.split("https://arweave.net/")[1]}`;
      const gameParams = {
        expectedViews : item.expectedViews,
        initialBudget : item.itBudget,
        initialWorth : item. itWorth,
        pools : {
          EPb : item.itBudget,
          EPr: 0,
          likeEP : 0,
          flagEP : 0 
        }
      }

      const gameInput = {
        gameId: `${item._id}`,
        gameName: item.title,
        gameTitle: `${item.title}_ITEM_GAME`,
        gameType: 'ITEM_GAME',
        gameTags: item.itemTags,
        gamePage: itemPage,
        gameParams: gameParams,
      }

      const action = {
        caller, 
        input : gameInput, wallet, stateRatContract
      }
      console.log(action)


      if(stateRatContract.balances[caller] <= ((item.itWorth) + (item.itBudget))) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const createdGameTxId = await createItemGame(action);
        const isGameTxConfirm = await checkTxConfirmation(createdGameTxId, arweave)
        const resultGame = {
          createdGameTxId, isGameTxConfirm
        }
        const pendingTransactionGame = {
          txId: resultGame.createdGameTxId,
          txType: {
            type: "ITEM_GAME_CREATE",
            debitedWallet: callerWallet._id,
          },
          body: resultGame.isGameTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionGame);
        const input = {
          function : "registerGame",
          gameContract : createdGameTxId,
          qty : Number(item.itWorth),
          type : {game: "ITEM_GAME", active: true, time: new Date().toString() }
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
            type: "REGISTER_ITEM_GAME",
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

  itemGameRemove: async (reqItemGameRemoveData) => {
    console.log("removing item game");
    const req = await reqItemGameRemoveData.req;
    const item = await reqItemGameRemoveData.item;
    const activeGameContract = item.activeGameContract;
    const arweave = await reqItemGameRemoveData.arweave;
    const ratLiveContractId = await reqItemGameRemoveData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let brandUser = await User.findOne({
        _id: item.uploader
      });

      const walletId = brandUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)

      if(stateRatContract.balances[caller] <= (item.itBudget)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const input = {
          function : "deregisterGame",
          gameContract : activeGameContract,
          qty : Number(item.itBudget),
          type : { game: "ITEM_GAME", time: new Date().toString() }
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
            type: "DEREGISTER_ITEM_GAME",
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

  itemGamePlay: async (reqItemGamePlayData) => {
    console.log("start");
    const req = await reqItemGamePlayData.req;
    const item = await reqItemGamePlayData.item;
    const interaction = await reqItemGamePlayData.interaction;
    console.log("end")
    try {
      const ratContract = await smartContractInteraction();
      const ratLiveContractId = ratContract.ratLiveContractId;
      const arweave = ratContract.arweave;
      const stateRatContract = ratContract.stateRatContract;
      const vinciis = await stateRatContract.owner;

      let brandUser = await User.findOne({
        _id: item.uploader
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
      const gameContractId = item.activeGameContract;
      const gameContractState = await readContract(gameContractId)
 
      // rat state
      const ratContractState = stateRatContract;

      const itemParams = {
        req,
        item: item,
        gaemContractState: gameContractState,
      }

      const Wdash = await itemWorth(itemParams);
      console.log( Wdash);
      const Rdash = await itemInteractionBudget(itemParams);
      console.log( Rdash);

      // like action
      if(interaction === "like") {

        let input = {
          function: "stake",
          interaction: interaction,
          pool: "likeEP",
          qty: Number((1/item.itWorth).toFixed(5))
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
            type: "LIKE_ITEM_GAME_PLAY",
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
            qty: Number((1/item.itWorth).toFixed(5)),
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
              type: "LIKE_ITEM_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: brand,
              qty: Number((1/item.itWorth).toFixed(5)),
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
          qty: Number((1/item.itWorth).toFixed(5))
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
            type: "FLAG_ITEM_GAME_PLAY",
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
            qty: Number((1/item.itWorth).toFixed(5)),
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
              type: "FLAG_ITEM_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: vinciis,
              qty: Number((1/item.itWorth).toFixed(5)),
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

      // view booking action
      if(interaction === "view") {
     
      }

    } catch (error) {
      console.log('err-last', error);
      return (error);
    }
  },
}

export default itemGameCtrl;