import {handle} from '../rat_core/toDeploy/screenGamebit.js';

import fetch from 'node-fetch';
import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

const dummyState = JSON.parse(fs.readFileSync(
  path.join(__dirname, "server/wallet_contract/dummyContract", `init_screenGameContract_state.json`)
));
 
// const caller = "5aAU5cJma31iXuTc2xj03EXoTcqmQ4thQEtVJHjHtgg"
const caller = "APUjfcmSP_UIJGSY9MzBAn0KGeHy5gxfIOXln64uTkg";
// export default 
async function dummy () {

  
  // const stakeInput = {
  //   function: "stake",
  //   pool: "EPs",
  //   rewardPool: "EPa",
  //   qty: 0.29
  // } 


  const pool = "EPs"
  const rewardPool = "EPa"
  const stake = dummyState.stakes[pool];
  console.log(Object.keys(stake).length);
  const EPs = dummyState.gameParams.pools[pool];
  const EPa = dummyState.gameParams.pools[rewardPool]
  const activeStake = stake[caller].map((acStk) =>(acStk)).filter((i) => i.active === true)
  console.log(activeStake)
  const stakeAmt = activeStake[0].value;
  const qty = stakeAmt + (EPa/(Object.keys(stake).length))
  const amt = qty - stakeAmt;

  
  const withdrawInput = {
    function: "withdraw",
    pool: "EPs",
    rewardPool: "EPa",
    qty: Number(qty.toFixed(5)),
    amt: Number(amt.toFixed(5)),
    stakeAmt: Number(stakeAmt.toFixed(5))
  }

  // const pool = "likeEP"
  // const rewardPool = "flagEP"
  // const stake = dummyState.stakes[pool];
  // const likeEP = dummyState.gameParams.pools[pool];
  // const flagEP = dummyState.gameParams.pools[rewardPool]
  // console.log(Object.keys(stake).length); 
  // const target = Object.keys(stake).map((key) => [String(key), stake[key]]).map((i) => i[0])
  // console.log(target)

  // const qty = (likeEP + flagEP)/(Object.keys(stake).length)
  // const input = {
  //   function: "rewardDistribution",
  //   event: "sell",
  //   target: target,
  //   qty: qty
  // }
  console.log(withdrawInput);

  const state = await dummyState;
  // console.log(state)

  console.log(state.gameParams.pools)
  const action = {
    input : withdrawInput,
    caller
  }

  const result = await handle(state, action);
  console.log(result)

  const res = JSON.stringify(result)
  // console.log(res)
  
  fs.writeFileSync(
    path.join(__dirname, "server/wallet_contract/dummyContract", `init_screenGameContract_state.json`), 
    res
  )

}


(async () => await dummy())();
