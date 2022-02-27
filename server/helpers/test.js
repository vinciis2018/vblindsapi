import Arweave from 'arweave';
import { smartweave } from 'smartweave';
import kohaku from '@_koi/kohaku';
import * as fs from 'fs';
import path from 'path';
const __dirname = path.resolve();


const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 20000,
  logging: false,
});

const koiiLiveContractId ='APUjfcmSP_UIJGSY9MzBAn0KGeHy5gxfIOXln64uTkg'
const ratLiveContractId = 'xtKfcqs-DiuC6cbdkn3qXxWKjW2c-FM-4fiV6YkiH6Y'  //smart contract id
const smartweaveReadRatContract = await smartweave.readContract(arweave, ratLiveContractId);
const kohakuReadRatContract = await kohaku.readContract(arweave, ratLiveContractId);
const expKohakuRatContract = kohaku.exportCache();
kohaku.importCache(arweave, expKohakuRatContract);
await kohaku.readContract(arweave, ratLiveContractId);

const initialState = 
{
  balances: {
    "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg": 11,
    "APUjfcmSP_UIJGSY9MzBAn0KGeHy5gxfIOXln64uTkg": 6
  },
  stakes: {
    "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg": [{
      "gamesdffsdfContract": {
        EPs: {
          value: 4,
          block: 56721
        }
      }
    }],
    "APUjfcmSP_UIJGSY9MzBAn0KGeHy5gxfIOXln64uTkg": {
      "gamesdffsdfContract": {
        EPs: {
          value: 10,
          block: 56721
        },
      }
    }
  },
  withdraws: {

  },
  rewardDistrbution: {

  }
}

const gameState = {
  stakes: {
    "EPa": {
      "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg": [
        {
          value: 4,
          block: 90989
        }
      ],
      "APUjfcmSP_UIJGSY9MzBAn0KGeHy5gxfIOXln64uTkg": [
          {
          value: 10,
          block: 98977
        }
      ]
    },
    "EPs": {
      "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg": [
          {
          value: 4,
          block: 544534
        }
      ]
    },
    "likeEP": {
      "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg": [
          {
          value: 2,
          block: 346575
        }
      ],
      "APUjfcmSP_UIJGSY9MzBAn0KGeHy5gxfIOXln64uTkg": [
          {
          value: 5,
          block: 98977
        }
      ]
    },
    "flagEP": {
      "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg": [
        {
          value: 3,
          block: 765897
        }
      ]
    }
  },
  withdraws: {
    "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg": [
      {
        value: 4,
        block: 34324
      }
    ]
  },
  rewardDistribution: {
  }
}

async function test() {
 
  
  // console.log(smartweaveReadRatContract);

  // console.log("1", kohakuReadRatContract);

  // console.log("2", expKohakuRatContract);

  // console.log("3", kohakuReadRatContract);

  // const state = initialState;
  const caller = "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg";
  // const gameContract = "gamesdffsdfContract";
  // const pool = "EPs";
  // const stakes = initialState.stakes.EPa;
  // const gameStakes = initialState.gameStakes[caller[gameContract[pool]]]


  // const stakes = kohakuReadRatContract.balances;
  // console.log(kohakuReadRatContract.balances);
  // const array = 
  //    Object.keys(kohakuReadRatContract.balances)
  //      .map((key) => [String(key), kohakuReadRatContract.balances[key]]);
  // console.log( array)
  // const sum = array.map((i) => i[1]).reduce((a,b) => a + b, 0);
  // console.log(sum)

  const gameStakes = gameState.stakes.likeEP;
  const stake = gameStakes[caller];
  const array = Object.keys(gameStakes).map((key) => [String(key), gameStakes[key]]).map((i) => i[1]);
  // console.log("gameStakes", gameStakes)
  console.log(array)
  console.log(stake[0].value)
  // const array2 = Object.keys(gameStakes).map((key) => 
  //   [String(key), gameStakes[key]]).map((i) => i[1]).map((j) => j[0]);
  // console.log(array2)
  // const array2 = Object.keys(gameStakes).map((key) => 
  //   [String(key), gameStakes[key]]).map((i) => i[1]).map((j) => j[0]).map((k) => k.value).reduce((a,b) => a + b, 0);
  // console.log(array2)
  // const sum = array2.reduce((a,b) => a + b, 0);
  // console.log(sum);

  // function handle (element, value, state) {

  //   state.balances[element] += value
  //   console.log(state.balances)

  //   return {state}
  // }
  // const distribution = array.forEach((element) => {

  //   return handle(element, 5, state)
  // })
  
  // const distribution = array.forEach((element, i, array) => {
  //   // console.log({[element]: 2})
  //   for( i = 0; i < array.length; i++) {
  //     array[i] = {[element]: +5}
  //     console.log("1", array[i])
  //     // return array[i]
  //     return handle(element, 5, state)

  //   }
    
  // })

  // const rewardDistrbution = {
  //   date: new Date.now(), 
  //   block: SmartWeave.block.height,
  //   type: input.function,
  //   body: {
  //    distribution
  //   } 

  // }
  // state.rewardDistrbution.push({rewardDistrbution});
  // console.log(distribution)

  
}


(async () => await test())();
