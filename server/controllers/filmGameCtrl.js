
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import filmInteractionBudget from '../venetian/filmInteractionBudget.js';
import filmWorth from '../venetian/filmWorth.js';
import { writeInContract, readContract } from '../helpers/smartContractIntreract.js';
import createFilmGame from "../rat_core/createFilmGame.js";
import checkTxConfirmation from '../helpers/checkTxConfirmation.js';

import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const clientUrl = process.env.CLIENT_URL;

const filmGameCtrl = {
  getFilmParams: async (reqGetFilmParams) => {
    const req = await reqGetFilmParams.req;
    const film = await reqGetFilmParams.film;
    const activeGameContract = film.activeGameContract;
    try {
      // const gameContractState = await readContract(activeGameContract);
      const filmParams = {
        req,
        film: film,
        // gameContractState: gameContractState,
      }

      const {Wdash} = await filmWorth(filmParams);
      const {Bdash} = await filmInteractionBudget(filmParams);

      const result = {
        Wdash, Bdash
      }
      return result;
    } catch (error) {
      console.error(error)
      return error;
    }
  },

  filmGameCreate: async (reqFilmGameCreateData) => {
    console.log("start creating film game");
    const film = await reqFilmGameCreateData.film;
    const arweave = await reqFilmGameCreateData.arweave;
    const ratLiveContractId = await reqFilmGameCreateData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let allyUser = await User.findOne({
        _id: film.uploader
      });

      const walletId = allyUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)
      const filmPage = `${clientUrl}/film/${film._id}/${film.film.split("https://arweave.net/")[1]}`;
      const gameParams = {
        expectedViews : film.expectedViews,
        initialBudget : film.flBudget,
        initialWorth : film. flWorth,
        initialRent: film.flRent,
        pools : {
          EPb : film.flBudget,
          EPr: 0,
          likeEP : 0,
          flagEP : 0 
        }
      }

      const gameInput = {
        gameId: `${film._id}`,
        gameName: film.title,
        gameTitle: `${film.title}_FILM_GAME`,
        gameType: 'FILM_GAME',
        gameTags: film.filmTags,
        gamePage: filmPage,
        gameParams: gameParams,
      }

      const action = {
        caller, 
        input : gameInput, wallet, stateRatContract
      }
      console.log(action)


      if(stateRatContract.balances[caller] <= ((film.flWorth) + (film.flBudget))) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const createdGameTxId = await createFilmGame(action);
        const isGameTxConfirm = await checkTxConfirmation(createdGameTxId, arweave)
        const resultGame = {
          createdGameTxId, isGameTxConfirm
        }
        const pendingTransactionGame = {
          txId: resultGame.createdGameTxId,
          txType: {
            type: "FILM_GAME_CREATE",
            debitedWallet: callerWallet._id,
          },
          body: resultGame.isGameTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionGame);
        const input = {
          function : "registerGame",
          gameContract : createdGameTxId,
          qty : Number(film.flWorth),
          type : {game: "FILM_GAME", active: true, time: new Date().toString() }
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
            type: "REGISTER_FILM_GAME",
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

  filmGameRemove: async (reqFilmGameRemoveData) => {
    console.log("removing film game");
    const req = await reqFilmGameRemoveData.req;
    const film = await reqFilmGameRemoveData.film;
    const activeGameContract = film.activeGameContract;
    const arweave = await reqFilmGameRemoveData.arweave;
    const ratLiveContractId = await reqFilmGameRemoveData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let allyUser = await User.findOne({
        _id: film.uploader
      });

      const walletId = allyUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)

      if(stateRatContract.balances[caller] <= (film.flBudget)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const input = {
          function : "deregisterGame",
          gameContract : activeGameContract,
          qty : Number(film.flBudget),
          type : { game: "FILM_GAME", time: new Date().toString() }
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
            type: "DEREGISTER_FILM_GAME",
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

  filmGamePlay: async (reqFilmGamePlayData) => {
    console.log("start");
    const req = await reqFilmGamePlayData.req;
    const film = await reqFilmGamePlayData.film;
    const interaction = await reqFilmGamePlayData.interaction;
    console.log("end")
    try {
      const ratContract = await smartContractInteraction();
      const ratLiveContractId = ratContract.ratLiveContractId;
      const arweave = ratContract.arweave;
      const stateRatContract = ratContract.stateRatContract;
      const vinciis = await stateRatContract.owner;

      let allyUser = await User.findOne({
        _id: film.uploader
      });

      const vinciisWallet = await Wallet.findOne({ walletAddAr: vinciis});
      const allyWalletId = allyUser.defaultWallet;
      const allyWallet = await Wallet.findById(allyWalletId);
      const ally = await allyWallet.walletAddAr;
      
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
      const gameContractId = film.activeGameContract;
      const gameContractState = await readContract(gameContractId)
 
      // rat state
      const ratContractState = stateRatContract;

      const filmParams = {
        req,
        film: film,
        gaemContractState: gameContractState,
      }

      const Wdash = await filmWorth(filmParams);
      console.log( Wdash);
      const Rdash = await filmInteractionBudget(filmParams);
      console.log( Rdash);

      // like action
      if(interaction === "like") {

        let input = {
          function: "stake",
          interaction: interaction,
          pool: "likeEP",
          qty: Number((1/film.flWorth).toFixed(5))
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
            type: "LIKE_FILM_GAME_PLAY",
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
            target: ally,
            qty: Number((1/film.flWorth).toFixed(5)),
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
              type: "LIKE_FILM_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: ally,
              qty: Number((1/film.flWorth).toFixed(5)),
              ticker: "RAT",
            },
            body: result.isRatTxConfirm
          }
          console.log("writing in db")
          await callerWallet.pendingTransactions.push(pendingTransaction);
          await callerWallet.save();
          console.log("caller")

          await allyWallet.recievedTransactions.push(pendingTransaction);
          await allyWallet.save();
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
          qty: Number((1/film.flWorth).toFixed(5))
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
            type: "FLAG_FILM_GAME_PLAY",
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
            qty: Number((1/film.flWorth).toFixed(5)),
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
              type: "FLAG_FILM_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: vinciis,
              qty: Number((1/film.flWorth).toFixed(5)),
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

export default filmGameCtrl;