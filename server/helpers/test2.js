import Arweave from 'arweave';
import { smartweave } from 'smartweave';
import kohaku from '@_koi/kohaku';
import {handle} from '../rat_core/toDeploy/cryptex2.js'
import * as fs from 'fs';
import path from 'path';
const __dirname = path.resolve();

const gameContract = `0dtjI7hd5bQT7f-lVWMNVNn_sho7ATxppMr-x4-Mg68`;

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 20000,
  logging: false,
});

// const smartweaveReadRatContract = await smartweave.readContract(arweave, gameContract);
// const kohakuReadRatContract = await kohaku.readContract(arweave, gameContract);
// const expKohakuRatContract = kohaku.exportCache();
// kohaku.importCache(arweave, expKohakuRatContract);
// await kohaku.readContract(arweave, gameContract);



const initialState = JSON.parse(fs.readFileSync(
  path.join(__dirname, "server/wallet_contract/dummyContract", `init_dummyRATstate.json`)
));
async function test() {
  const state = await initialState;
  const caller = '5kUbe9C_zkZSDWI1ygve3jZDDrh3MSu-AT8M4tu7mpA'
  console.log(state.balances[caller])
  // const input = {
  //   function: "registerGame",
  //   gameContract: gameContract,
  //   type: {game: "SCREEN_GAME", active: true},
  //   qty: Number(50),
  // }

  const input = {
    function: "deregisterGame",
    gameContract: gameContract,
    type: {game: "SCREEN_GAME", time: new Date().toString()},
    qty: Number(5),
  }
  // const input = {
  //   function: "incentives",
  //   gameContract: gameContract,
  //   type: {
  //     game: "SCREEN_GAME", 
  //     value: Number(3), 
  //     block: 32432, 
  //     winners: [
  //       "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg", 
  //       "APUjfcmSP_UIJGSY9MzBAn0KGeHy5gxfIOXln64uTkg"
  //     ]
  //   },
  // }
  
  console.log(input)

  const action = {
    input, caller
  }

  console.log(state.registeredGames[gameContract])
  const result = await handle(state, action);
  
  const res = JSON.stringify(result);
  console.log(res);

  fs.writeFileSync(
    path.join(__dirname, "server/wallet_contract/dummyContract", `init_dummyRATstate.json`), 
    res
  )


}


(async () => await test())();
