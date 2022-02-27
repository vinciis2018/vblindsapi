
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import advertInteractionBudget from '../venetian/advertInteractionBudget.js';
import advertWorth from '../venetian/advertWorth.js';
import { writeInContract, readContract } from '../helpers/smartContractIntreract.js';
import createAdvertGame from "../rat_core/createAdvertGame.js";
import checkTxConfirmation from '../helpers/checkTxConfirmation.js';

import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const clientUrl = process.env.CLIENT_URL;

const advertGameCtrl = {
  getAdvertParams: async (reqGetAdvertParams) => {
    const req = await reqGetAdvertParams.req;
    const video = await reqGetAdvertParams.video;
    const activeGameContract = video.activeGameContract;
    try {
      // const gameContractState = await readContract(activeGameContract);
      const advertParams = {
        req,
        video: video,
        // gameContractState: gameContractState,
      }

      const {Wdash} = await advertWorth(advertParams);
      const {Bdash} = await advertInteractionBudget(advertParams);

      const result = {
        Wdash, Bdash
      }
      return result;
    } catch (error) {
      console.error(error)
      return error;
    }
  },

  advertGameCreate: async (reqAdvertGameCreateData) => {
    console.log("start creating advert game");
    const video = await reqAdvertGameCreateData.video;
    const arweave = await reqAdvertGameCreateData.arweave;
    const ratLiveContractId = await reqAdvertGameCreateData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let masterUser = await User.findOne({
        _id: video.uploader
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)
      const videoPage = `${clientUrl}/video/${video._id}/${video.video.split("https://arweave.net/")[1]}`;
      const gameParams = {
        expectedViews : video.expectedViews,
        initialBudget : video.adBudget,
        initialWorth : video. adWorth,
        pools : {
          EPb : video.adBudget,
          likeEP : 0,
          flagEP : 0 
        }
      }

      const gameInput = {
        gameId: `${video._id}`,
        gameName: video.title,
        gameTitle: `${video.title}_ADVERT_GAME`,
        gameType: 'ADVERT_GAME',
        gameTags: video.videoTags,
        gamePage: videoPage,
        gameParams: gameParams,
      }

      const action = {
        caller, 
        input : gameInput, wallet, stateRatContract
      }
      console.log(action)


      if(stateRatContract.balances[caller] <= ((video.adWorth) + (video.adBudget))) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const createdGameTxId = await createAdvertGame(action);
        const isGameTxConfirm = await checkTxConfirmation(createdGameTxId, arweave)
        const resultGame = {
          createdGameTxId, isGameTxConfirm
        }
        const pendingTransactionGame = {
          txId: resultGame.createdGameTxId,
          txType: {
            type: "ADVERT_GAME_CREATE",
            debitedWallet: callerWallet._id,
          },
          body: resultGame.isGameTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionGame);
        const input = {
          function : "registerGame",
          gameContract : createdGameTxId,
          qty : Number(video.adWorth),
          type : {game: "ADVERT_GAME", active: true, time: new Date().toString() }
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
            type: "REGISTER_ADVERT_GAME",
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

  advertGameRemove: async (reqAdvertGameRemoveData) => {
    console.log("removing advert game");
    const req = await reqAdvertGameRemoveData.req;
    const video = await reqAdvertGameRemoveData.video;
    const activeGameContract = video.activeGameContract;
    const arweave = await reqAdvertGameRemoveData.arweave;
    const ratLiveContractId = await reqAdvertGameRemoveData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let masterUser = await User.findOne({
        _id: video.uploader
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)

      if(stateRatContract.balances[caller] <= (video.adWorth)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const input = {
          function : "deregisterGame",
          gameContract : activeGameContract,
          qty : Number(video.adWorth),
          type : { game: "ADVERT_GAME", time: new Date().toString() }
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
            type: "DEREGISTER_ADVERT_GAME",
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

  advertGamePlay: async (reqAdvertGamePlayData) => {
    console.log("start");
    const req = await reqAdvertGamePlayData.req;
    const video = await reqAdvertGamePlayData.video;
    const interaction = await reqAdvertGamePlayData.interaction;
    console.log("end")
    try {
      const ratContract = await smartContractInteraction();
      const ratLiveContractId = ratContract.ratLiveContractId;
      const arweave = ratContract.arweave;
      const stateRatContract = ratContract.stateRatContract;
      const vinciis = await stateRatContract.owner;

      let masterUser = await User.findOne({
        _id: video.uploader
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
      const gameContractId = video.activeGameContract;
      const gameContractState = await readContract(gameContractId)
 
      // rat state
      const ratContractState = stateRatContract;

      const videoParams = {
        req,
        video: video,
        gaemContractState: gameContractState,
      }

      const Wdash = await advertWorth(videoParams);
      console.log( Wdash);
      const Rdash = await advertInteractionBudget(videoParams);
      console.log( Rdash);

      // like action
      if(interaction === "like") {

        let input = {
          function: "stake",
          interaction: interaction,
          pool: "likeEP",
          qty: Number((1/video.adWorth).toFixed(5))
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
            type: "LIKE_ADVERT_GAME_PLAY",
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
            qty: Number((1/video.adWorth).toFixed(5)),
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
              type: "LIKE_ADVERT_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: master,
              qty: Number((1/video.adWorth).toFixed(5)),
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
          qty: Number((1/video.adWorth).toFixed(5))
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
            type: "FLAG_ADVERT_GAME_PLAY",
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
            qty: Number((1/video.adWorth).toFixed(5)),
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
              type: "FLAG_ADVERT_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: vinciis,
              qty: Number((1/video.adWorth).toFixed(5)),
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

      // slot booking action
      if(interaction === "view") {
     
      }

    } catch (error) {
      console.log('err-last', error);
      return (error);
    }
  },
}

export default advertGameCtrl;