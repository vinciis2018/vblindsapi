
function stake (state, action) {
  const stakes = state.stakes;
  const pools = state.gameParams.pools;
  const input = action.input;
  const pool = input.pool
  const caller = action.caller;
  const qty = input.qty;
  console.log(pool)
  if (!qty) {
    throw new ContractError("Invalid input");
  }
  if (typeof qty !== "number" || qty <= 0) {
    throw new ContractError("Invalid input format");
  }
  console.log(stakes)
  stakes[pool] ? stakes[pool] : stakes[pool] = {}
  console.log(stakes)
  const stake = stakes[pool]; 
  console.log(stake)
  if(stake[caller]) {
    const activeStake = stake[caller].map((acStk) =>(acStk)).filter((i) => i.active === true)
    console.log(activeStake)
    if(activeStake.length !== 0) {
      throw new ContractError(`${caller} already staked`)
    }
  }
  
  stake[caller]
    ? stake[caller].push({
        value: qty,
        active: true,
        block: 787898
        // block: SmartWeave.block.height 
      })
    : stake[caller] = [{ 
        value: qty,
        active: true,
        block: 787898
        // block: SmartWeave.block.height 
      }]
  pools[pool] += qty; 
  console.log(pools)
  console.log(pools[pool])

  return state;
}

function withdraw (state, action) {
  const stakes = state.stakes;
  const pools = state.gameParams.pools;
  const input = action.input;
  const pool = input.pool;   // EPs
  const rewardPool = input.rewardPool; // EPa
  const caller = action.caller;
  const qty = input.qty;  // EPst + (EPa/lengthEPs)
  const amt = input.amt;
  const stakeAmt = input.stakeAmt;

  if (!qty) {
    throw new ContractError("Invalid input");
  }
  if (typeof qty !== "number" || qty < 0) {
    throw new ContractError("Invalid input format");
  }
  stakes[pool] ? stakes[pool] : stakes[pool] = {}
  const stake = stakes[pool];
  const activeStake = stake[caller].map((acStk) =>(acStk)).filter((i) => i.active === true)
  console.log("activeStake", activeStake);

  if(activeStake.length === 0) {
    throw new ContractError(`${caller} is not staked`)
  }

  state.withdraws[caller]
    ? state.withdraws[caller].push({
        pool: pool, 
        amt: stakeAmt,
        value: qty, 
        stake_block: stake[caller][0].block 
        // block: SmartWeave.block.height 
      }) 
    : state.withdraws[caller] = [{ 
        pool: pool, 
        amt: stakeAmt,
        value: qty, 
        stake_block: stake[caller][0].block
        // block: SmartWeave.block.height 
      }];
  console.log(state.withdraws[caller])

  console.log("o.1", pools[pool])
  pools[pool] = (pools[pool] - stakeAmt); //EPs
  console.log("1", pools[pool])

  console.log("o.2", pools[rewardPool])
  pools[rewardPool] = (pools[rewardPool] - amt); //value; //EPa
  console.log("2", pools[rewardPool])

  activeStake[0].active = false;
  console.log("3", activeStake)

  return state;
}

function rewardDistribution (state, action) {
  const input = action.input;
  const event = input.event;
  const target = input.target;
  const qty = input.qty;
  if (!qty) {
    throw new ContractError("Invalid input");
  }
  if (typeof qty !== "number" || qty <= 0) {
    throw new ContractError("Invalid input format");
  }
  target.map(i => {
    const rewardEvent = state.rewardDistributions[event]
    console.log("reward event", rewardEvent)
    const rewardEventPlayer = rewardEvent[i]
    if(rewardEventPlayer !== undefined) {
      rewardEventPlayer.push({
        value: qty,
        block: 74573
        // block: SmartWeave.block.height
        })
        console.log("for defined", rewardEvent)
    } else {
      rewardEvent[i] = [{
        value: qty,
        block: 74573
        // block: SmartWeave.block.height
      }]
      console.log("for undefined", rewardEvent[i])
    }
  });

  return  state ;
}



const handlers = [
  stake,
  withdraw,
  rewardDistribution
];

export async function handle (state, action) {
  const handler = handlers.find((fn) => fn.name === action.input.function);
  if (handler) return await handler(state, action);
  throw new ContractError(`Invalid function: "${action.input.function}"`);
}
