
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import createAssetGame from "../rat_core/createAssetGame.js";
import assetWorth from '../venetian/assetWorth.js';
import checkTxConfirmation from '../helpers/checkTxConfirmation.js';
import { writeInContract, readContract } from '../helpers/smartContractIntreract.js';

import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const clientUrl = process.env.CLIENT_URL;

const assetGameCtrl = {
  getAssetParams: async (reqGetAssetParams) => {
      const req = await reqGetAssetParams.req;
      const asset = await reqGetAssetParams.asset;
      const activeGameContract = asset.activeGameContract;
      try {
        const gameContractState = await readContract(activeGameContract);
        const assetParams = {
          req,
          asset: asset,
          gameContractState: gameContractState,
        }
  
        const {Wdash} = await assetWorth(assetParams);
  
        const result = {
          Wdash
        }
        return result;
      } catch (error) {
        console.error(error)
        return error;
      }
  },

  assetGameCreate: async (reqCreateAssetGameData) => {
    console.log("start creating asset game");
    const asset = await reqCreateAssetGameData.asset;
    const arweave = await reqCreateAssetGameData.arweave;
    const ratLiveContractId = await reqCreateAssetGameData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let masterUser = await User.findOne({
        _id: asset.master
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)
      const assetPage = `${clientUrl}/asset/${asset._id}`;
      const gameParams = {
        initialWorth : asset. assetWorth,
        pools : {
          likeEP : 0,
          flagEP : 0 
        }
      }

      const gameInput = {
        gameId: `${asset._id}`,
        gameTitle: `${asset.name}_ASSET_GAME`,
        gameName: asset.name,
        gameType: `ASSET_GAME`,
        gamePage: assetPage,
        gameParams: gameParams,
        gameTags: asset.assetTags
      }

      const action = {
        caller, stateRatContract, 
        input: gameInput,
        wallet,
      }
      console.log(action)

      if(stateRatContract.balances[caller] <= (asset.assetWorth)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const createdGameTxId = await createAssetGame(action);

        const input = {
          function : "registerGame",
          gameContract : createdGameTxId,
          qty : Number(asset.assetWorth),
          type : {game: "ASSET_GAME", active: true, time: new Date().toString() }
        }
        const isGameTxConfirm = await checkTxConfirmation(createdGameTxId, arweave)
        const resultGame = {
          createdGameTxId, isGameTxConfirm
        }
        const pendingTransactionGame = {
          txId: resultGame.createdGameTxId,
          txType: {
            type: "ASSET_GAME_CREATE",
            debitedWallet: callerWallet._id,
          },
          body: resultGame.isGameTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionGame);

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
            type: "REGISTER_ASSET_GAME",
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

  assetGameRemove: async (reqAssetGameRemove) => {
    console.log("removing asset game");
    const req = await reqAssetGameRemove.req;
    const asset = await reqAssetGameRemove.asset;
    const activeGameContract = await reqAssetGameRemove.activeGameContract;
    const arweave = await reqAssetGameRemove.arweave;
    const ratLiveContractId = await reqAssetGameRemove.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);

    try {
      let masterUser = await User.findOne({
        _id: asset.master
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)

      if(stateRatContract.balances[caller] <= (asset.assetWorth)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const input = {
          function : "deregisterGame",
          gameContract : activeGameContract,
          qty : Number(asset.assetWorth),
          type : { game: "ASSET_GAME", time: new Date().toString() }
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
            type: "DEREGISTER_ASSET_GAME",
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

  assetGamePlay: async (reqAssetGamePlayData) => { 
    console.log("start");
    const req = await reqAssetGamePlayData.req;
    const asset = await reqAssetGamePlayData.asset;
    const calender = await reqAssetGamePlayData.calender;
    const interaction = await reqAssetGamePlayData.interaction;
    const stateRatContract = await readContract(ratLiveContractId)
    const vinciis = await stateRatContract.owner;

    console.log("end")

    try {
      let masterUser = await User.findOne({
        _id: asset.master
      });

      const vinciisWallet = await Wallet.findOne({ walletAddAr: vinciis});
      const masterWalletId = masterUser.defaultWallet;
      const masterWallet = await Wallet.findById(masterWalletId);
      const master = await masterWallet.walletAddAr;
      
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
      const gameContractId = calender.activeGameContract;
      const gameContractState = await readContract(gameContractId)


      // rat state
      const ratContractState = stateRatContract;

      const assetParams = {
        req,
        asset: asset,
        gaemContractState: gameContractState,
      }

      const Wdash = await assetWorth(assetParams);
      console.log( Wdash);

      // like action
      if(interaction === "like") {

        let input = {
          function: "stake",
          interaction: interaction,
          pool: "likeEP",
          qty: Number((1/asset.assetWorth).toFixed(5))
        }

        console.log(input);
        // const txIdGame = await smartweave.interactWrite(
        //   arweave,
        //   wallet,
        //   gameContract,
        //   input
        // )

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
            type: "LIKE_ASSETGAME_PLAY",
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
            target: master,
            qty: Number((1/asset.assetWorth).toFixed(5)),
          }
          // const ratTransfer = await smartweave.interactWrite(
          //   arweave,
          //   wallet,
          //   ratLiveContractId,
          //   input
          // )

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
              type: "LIKE_ASSET_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: master,
              qty: Number((1/asset.assetWorth).toFixed(5)),
              ticker: "RAT",
            },
            body: result.isRatTxConfirm
          }
          console.log("writing in db")
          await callerWallet.pendingTransactions.push(pendingTransaction);
          await callerWallet.save();
          console.log("caller")

          await masterWallet.recievedTransactions.push(pendingTransaction);
          await masterWallet.save();
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
          qty: Number((1/asset.assetWorth).toFixed(5))
        }
        console.log(input);
        // const txIdGame = await smartweave.interactWrite(
        //   arweave,
        //   wallet,
        //   gameContract,
        //   input
        // )

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
            type: "FLAG_ASSET_GAME_PLAY",
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
            qty: Number((1/asset.assetWorth).toFixed(5)),
          }
          // const ratTransfer = await smartweave.interactWrite(
          //   arweave,
          //   wallet,
          //   ratLiveContractId,
          //   input
          // )

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
              type: "FLAG_ASSET_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: vinciis,
              qty: Number((1/asset.assetWorth).toFixed(5)),
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

export default assetGameCtrl;