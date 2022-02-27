
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import createChannelGame from "../rat_core/createChannelGame.js";
import channelWorth from '../venetian/channelWorth.js';
import checkTxConfirmation from '../helpers/checkTxConfirmation.js';
import { writeInContract, readContract } from '../helpers/smartContractIntreract.js';
import smartContractInteraction from '../smartContractInteraction.js';


import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const clientUrl = process.env.CLIENT_URL;

const channelGameCtrl = {
  getChannelParams: async (reqGetChannelParams) => {
    const req = await reqGetChannelParams.req;
    const channel = await reqGetChannelParams.channel;
    const activeGameContract = channel.activeGameContract;
    try {
      const gameContractState = await readContract(activeGameContract);
      const channelParams = {
        req,
        channel: channel,
        gameContractState: gameContractState,
      }

      const {Wdash} = await channelWorth(channelParams);

      const result = {
        Wdash,
      }
      return result;
    } catch (error) {
      console.error(error)
      return error;
    }
  },

  channelGameCreate: async (reqCreateChannelGameData) => {
    console.log("start creating channel game");
    const req = await reqCreateChannelGameData.req;
    const channel = await reqCreateChannelGameData.channel;
    const arweave = await reqCreateChannelGameData.arweave;
    const ratLiveContractId = await reqCreateChannelGameData.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let allyUser = await User.findOne({
        _id: channel.ally
      });

      const walletId = allyUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)
      const channelPage = `${clientUrl}/channel/${channel._id}`;
      const gameParams = {
        initialWorth : channel. chWorth,
        pools : {
          EPs : 0,
          EPe: 0,
          likeEP : 0,
          flagEP : 0 
        }
      }

      const gameInput = {
        gameId: channel._id,
        gameName: channel.name,
        gameTitle: `${channel.name}_CHANNEL_GAME`,
        gameType: 'CHANNEL_GAME',
        gameTags: channel.channelTags,
        gamePage: channelPage,
        gameParams: gameParams,
      }

      const action = {
        caller, stateRatContract, 
        input : gameInput, 
        wallet
      }
      console.log(action)

      if(stateRatContract.balances[caller] <= ((channel.chWorth) + (channel.rentPerSlot))) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const createdGameTxId = await createChannelGame(action);
        const isGameTxConfirm = await checkTxConfirmation(createdGameTxId, arweave)
        const resultGame = {
          createdGameTxId, isGameTxConfirm
        }
        const pendingTransactionGame = {
          txId: resultGame.createdGameTxId,
          txType: {
            type: "CHANNEL_GAME_CREATE",
            debitedWallet: callerWallet._id,
          },
          body: resultGame.isGameTxConfirm
        }
        console.log("writing in db")
        await callerWallet.pendingTransactions.push(pendingTransactionGame);
        const input = {
          function : "registerGame",
          gameContract : createdGameTxId,
          qty : Number(channel.chWorth),
          type : {game: "CHANNEL_GAME", active: true, time: new Date().toString() }
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
            type: "REGISTER_CHANNEL_GAME",
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

  channelGameRemove: async (reqChannelGameRemove) => {
    console.log("removing channel game");
    const req = await reqChannelGameRemove.req;
    const channel = await reqChannelGameRemove.channel;
    const activeGameContract = await reqChannelGameRemove.activeGameContract;
    const arweave = await reqChannelGameRemove.arweave;
    const ratLiveContractId = await reqChannelGameRemove.ratLiveContractId;
    const stateRatContract = await readContract(ratLiveContractId);
    try {
      let allyUser = await User.findOne({
        _id: channel.ally
      });

      const walletId = allyUser.defaultWallet;
      const callerWallet = await Wallet.findById(walletId);
      const caller = callerWallet.walletAddAr;
      const wallet = JSON.parse(fs.readFileSync(
        path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
      ));
      console.log("caller", caller)

      if(stateRatContract.balances[caller] <= (channel.chWorth)) {
        console.log("Not enough tokens for transaction");
        return ("Not enough tokens for transaction", wallet);
      } else {
        const input = {
          function : "deregisterGame",
          gameContract : activeGameContract,
          qty : Number(channel.chWorth),
          type : { game: "CHANNEL_GAME", time: new Date().toString() }
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
            type: "DEREGISTER_CHANNEL_GAME",
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

  channelGamePlay: async (reqChannelGamePlayData) => { 
    console.log("start");
    const req = await reqChannelGamePlayData.req;
    const channel = await reqChannelGamePlayData.channel;
    const interaction = await reqChannelGamePlayData.interaction;
    console.log("end")
    try {
      const ratContract = await smartContractInteraction();
      const ratLiveContractId = ratContract.ratLiveContractId;
      const arweave = ratContract.arweave;
      const stateRatContract = ratContract.stateRatContract;
      const vinciis = await stateRatContract.owner;

      let allyUser = await User.findOne({
        _id: channel.ally
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
      const gameContractId = calender.activeGameContract;
      const gameContractState = await readContract(gameContractId)
 
      // rat state
      const ratContractState = stateRatContract;

      const channelParams = {
        req,
        channel: channel,
        gaemContractState: gameContractState,
      }

      const Wdash = await channelWorth(channelParams);
      console.log( Wdash);


      // like action
      if(interaction === "like") {

        let input = {
          function: "stake",
          interaction: interaction,
          pool: "likeEP",
          qty: Number((1/channel.chWorth).toFixed(5))
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
            type: "LIKE_CHANNEL_GAME_PLAY",
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
            qty: Number((1/channel.chWorth).toFixed(5)),
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
              type: "LIKE_CHANNEL_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: ally,
              qty: Number((1/channel.chWorth).toFixed(5)),
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
          qty: Number((1/channel.chWorth).toFixed(5))
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
            type: "FLAG_CHANNEL_GAME_PLAY",
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
            qty: Number((1/channel.chWorth).toFixed(5)),
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
              type: "FLAG_CHANNEL_GAME_PLAY",
              debitedWallet: caller,
              creditedWallet: vinciis,
              qty: Number((1/channel.chWorth).toFixed(5)),
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

export default channelGameCtrl;