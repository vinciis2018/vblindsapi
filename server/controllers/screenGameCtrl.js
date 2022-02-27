
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import createScreenGame from "../rat_core/createScreenGame.js";
import screenSlotRent from '../venetian/screenSlotRent.js';
import screenWorth from '../venetian/screenWorth.js';
import checkTxConfirmation from '../helpers/checkTxConfirmation.js';
import { writeInContract, readContract } from '../helpers/smartContractIntreract.js';
import smartContractInteraction from '../smartContractInteraction.js';


import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const clientUrl = process.env.CLIENT_URL;

const screenGameCtrl = {
  getScreenParams: async (reqGetScreenParams) => {
    const req = await reqGetScreenParams.req;
    const screen = await reqGetScreenParams.screen;
    const calender = await reqGetScreenParams.calender;
    const activeGameContract = calender.activeGameContract;
    try {
      const gameContractState = await readContract(activeGameContract);
      const screenParams = {
        req,
        screen: screen,
        calender: calender,
        gameContractState: gameContractState,
      }

      const {Wdash} = await screenWorth(screenParams);
      const {Rdash} = await screenSlotRent(screenParams);

      const result = {
        Wdash, Rdash
      }
      return result;
    } catch (error) {
      console.error(error)
      return error;
    }
  },

  screenGameCreate: async (reqCreateScreenGameData) => {
    console.log("start creating screen game");
    const req = await reqCreateScreenGameData.req;
    const screen = await reqCreateScreenGameData.screen;
    const arweave = await reqCreateScreenGameData.arweave;
    const ratLiveContractId = await reqCreateScreenGameData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let masterUser = await User.findOne({
        _id: screen.master
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)
      const screenPage = `${clientUrl}/screen/${screen._id}`;
      const gameParams = {
        slotTimePeriod : screen.slotsTimePeriod,
        initialRent : screen.rentPerSlot,
        initialWorth : screen. scWorth,
        pools : {
          EPs : 0,
          EPa : 0,
          likeEP : 0,
          flagEP : 0 
        }
      }

      const gameInput = {
        gameId: screen._id,
        gameName: screen.name,
        gameTitle: `${screen.name}_SCREEN_GAME`,
        gameType: 'SCREEN_GAME',
        gameTags: screen.screenTags,
        gamePage: screenPage,
        gameParams: gameParams,
      }

      const action = {
        caller, stateRatContract, 
        input : gameInput, 
        wallet
      }
      console.log(action)

      if(stateRatContract.balances[caller] <= ((screen.scWorth) + (screen.rentPerSlot))) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const createdGameTxId = await createScreenGame(action);
        const isGameTxConfirm = await checkTxConfirmation(createdGameTxId, arweave)
        const resultGame = {
          createdGameTxId, isGameTxConfirm
        }
        const pendingTransactionGame = {
          txId: resultGame.createdGameTxId,
          txType: {
            type: "SCREEN_GAME_CREATE",
            debitedWallet: callerWallet._id,
          },
          body: resultGame.isGameTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionGame);
        const input = {
          function : "registerGame",
          gameContract : createdGameTxId,
          qty : Number(screen.scWorth),
          type : {game: "SCREEN_GAME", active: true, time: new Date().toString() }
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
            type: "REGISTER_SCREEN_GAME",
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

  screenGameRemove: async (reqScreenGameRemove) => {
    console.log("removing screen game");
    const req = await reqScreenGameRemove.req;
    const screen = await reqScreenGameRemove.screen;
    const activeGameContract = await reqScreenGameRemove.activeGameContract;
    const arweave = await reqScreenGameRemove.arweave;
    const ratLiveContractId = await reqScreenGameRemove.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let masterUser = await User.findOne({
        _id: screen.master
      });

      const walletId = masterUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)

      if(stateRatContract.balances[caller] <= (screen.rentPerSlot)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const input = {
          function : "deregisterGame",
          gameContract : activeGameContract,
          qty : Number(screen.rentPerSlot),
          type : { game: "SCREEN_GAME", time: new Date().toString() }
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
            type: "DEREGISTER_SCREEN_GAME",
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

  screenGamePlay: async (reqScreenGamePlayData) => { 
    console.log("start");
    const req = await reqScreenGamePlayData.req;
    const screen = await reqScreenGamePlayData.screen;
    const calender = await reqScreenGamePlayData.calender;
    const interaction = await reqScreenGamePlayData.interaction;
    console.log("end")
    try {
      const ratContract = await smartContractInteraction();
      const ratLiveContractId = ratContract.ratLiveContractId;
      const arweave = ratContract.arweave;
      const stateRatContract = ratContract.stateRatContract;
      const vinciis = await stateRatContract.owner;

      let masterUser = await User.findOne({
        _id: screen.master
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

      const screenParams = {
        req,
        screen: screen,
        calender: calender,
        gaemContractState: gameContractState,
      }

      const Wdash = await screenWorth(screenParams);
      console.log( Wdash);
      const Rdash = await screenSlotRent(screenParams);
      console.log( Rdash);

      // like action
      if(interaction === "like") {

        let input = {
          function: "stake",
          interaction: interaction,
          pool: "likeEP",
          qty: Number((1/screen.scWorth).toFixed(5))
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
            type: "LIKE_SCREEN_GAME_PLAY",
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
            qty: Number((1/screen.scWorth).toFixed(5)),
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
              type: "LIKE_SCREEN_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: master,
              qty: Number((1/screen.scWorth).toFixed(5)),
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
          qty: Number((1/screen.scWorth).toFixed(5))
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
            type: "FLAG_SCREEN_GAME_PLAY",
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
            qty: Number((1/screen.scWorth).toFixed(5)),
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
              type: "FLAG_SCREEN_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: vinciis,
              qty: Number((1/screen.scWorth).toFixed(5)),
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

      // subscribe action
      if(interaction === "subscribe") {

        let input = {
          function: "stake",
          interaction: interaction,
          pool: "EPs",
          qty: Number((1/Rdash.Rdash).toFixed(5))
        }
        console.log(input);
  
        const txIdGame = await writeInContract({
          contractId: gameContractId, input, wallet
        });
        console.log("txId", txIdGame);
        const isTxConfirm = await checkTxConfirmation(txIdGame, arweave)
        const resultGame = {
          txIdGame, isTxConfirm
        }
        const pendingGameTransaction = {
          txId: resultGame.txIdGame,
          txType: {
            type: "SUBSCRIBE_SCREEN_GAME_PLAY",
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
            qty: Number((1/Rdash).toFixed(5)),
          }

          const ratTransfer = await writeInContract({
            contractId: gameContractId, input, wallet
          });
          const isRatTxConfirm = await checkTxConfirmation(ratTransfer, arweave)
          const result = {
            ratTransfer, isRatTxConfirm
          }
          console.log("end confirmation", result)

          const pendingTransaction = {
            txId: result.ratTransfer,
            txType: {
              type: "SUBSCRIBE_SCREEN_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: master,
              qty: Number((1/Rdash).toFixed(5)),
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

      // unsubscribe action
      if(interaction === "unsubscribe") {
        const pool = "EPs"
        const rewardPool = "EPa"
        const stake = gameContractState.stakes[pool];
        const activeStake = stake[caller].map((acStk) =>(acStk)).filter((i) => i.active === true)
        const stakeAmount = activeStake[0].value;
        const quantity = stakeAmount + (sumEPa/(Object.keys(stake).length))
        const amount = quantity - stakeAmount
        
        let input = {
          function: "withdraw",
          interaction,
          pool,
          rewardPool,
          qty: Number((quantity).toFixed(5)),
          amt: Number((amount).toFixed(5)),
          stakeAmt: Number((stakeAmount).toFixed(5))
        }
        console.log(input);
  
        const txIdGame = await writeInContract({
          contractId: gameContractId, input, wallet
        });
        console.log("txId", txIdGame);
        const isTxConfirm = await checkTxConfirmation(txIdGame, arweave)
        const resultGame = {
          txIdGame, isTxConfirm
        }
        const pendingGameTransaction = {
          txId: resultGame.txIdGame,
          txType: {
            type: "UNSUBSCRIBE_SCREEN_GAME_PLAY",
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
            function: "incentives",
            gameContract,
            interaction,
            type: {
              action: "UNSUBSCRIBE_SCREEN_GAME_PLAY",
              time: new Date().toString(),
              body: {
                [caller] : Number((quantity).toFixed(5))
              }
            },
            winners: [caller],
            qty: Number((quantity).toFixed(5)),
          }

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
              type: "UNSUBSCRIBE_SCREEN_GAME_PLAY_WITHDRWAL",
              debitedWallet: "new minting",
              creditedWallet: caller,
              qty: Number((quantity).toFixed(5)),
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
      
      // slot booking action
      if(interaction === "bookSlot") {
        let input = {
          function: "stake",
          interaction: interaction,
          pool: "EPa",
          qty: Number((1/Rdash.Rdash).toFixed(5))
        }
        console.log(input);
  
        const txIdGame = await writeInContract({
          contractId: gameContractId, input, wallet
        });
        console.log("txId", txIdGame);
        const isTxConfirm = await checkTxConfirmation(txIdGame, arweave)
        const resultGame = {
          txIdGame, isTxConfirm
        }
        const pendingGameTransaction = {
          txId: resultGame.txIdGame,
          txType: {
            type: "SLOT_BOOKING_GAME_PLAY",
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

          let inputx = {
            function: "transfer",
            target: master,
            qty: Number((Rdash.Rdash - (1/Rdash.Rdash)).toFixed(5)),
          }

          console.log(inputx);

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
              type: "SLOT_BOOKING_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: master,
              qty: Number((Rdash.Rdash - (1/Rdash.Rdash)).toFixed(5)),
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

    } catch (error) {
      console.log('err-last', error);
      return (error);
    }
  },
}

export default screenGameCtrl;