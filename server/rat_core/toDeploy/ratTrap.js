
async function stake (state, action) {
  const stakes = state.stakes;
  const pools = state.gameParams.pools;
  const input = action.input;
  const pool = input.pool
  const caller = action.caller;
  const qty = input.qty;
  if (!qty) {
    throw new ContractError("Invalid input");
  }
  if (typeof qty !== "number" || qty <= 0) {
    throw new ContractError("Invalid input format");
  }
  stakes[pool] ? stakes[pool] : stakes[pool] = {};
  const stake = stakes[pool]
  if(stake[caller]) {
    const activeStake = stake[caller].map((acStk) =>(acStk)).filter((i) => i.active === true)
    if(activeStake.length !== 0) {
      throw new ContractError(`${caller} already staked`)
    }
  }
  stake[caller]
    ? stake[caller].push({
        value: qty,
        active: true,
        type: input.interaction,
        block: SmartWeave.block.height 
      })
    : stake[caller] = [{ 
        value: qty,
        active: true,
        type: input.interaction,
        block: SmartWeave.block.height 
      }]
  pools[pool] += qty; 
  return {state};
}

async function withdraw (state, action) {
  const stakes = state.stakes;
  const pools = state.gameParams.pools;
  const input = action.input;
  const pool = input.pool;
  const rewardPool = input.rewardPool;
  const caller = action.caller;
  const qty = input.qty;
  const amt = input.amt;
  const stakeAmt = input.stakeAmt;
  if (!qty) {
    throw new ContractError("Invalid input");
  }
  if (typeof qty !== "number" || qty <= 0) {
    throw new ContractError("Invalid input format");
  }
  stakes[pool] ? stakes[pool] : stakes[pool] = {}
  const stake = stakes[pool];
  if(!stake[caller]) {
    throw new ContractError(`${caller} not staked in ${pool} pool`)
  }
  const activeStake = stake[caller].map((acStk) =>(acStk)).filter((i) => i.active === true)
  if(activeStake.length === 0) {
    throw new ContractError(`${caller} is not staked`)
  }
  state.withdraws[caller]
    ? state.withdraws[caller].push({
        pool: pool, 
        amt: stakeAmt,
        value: qty, 
        stake_block: activeStake.block,
        block: SmartWeave.block.height 
      }) 
    : state.withdraws[caller] = [{ 
        pool: pool, 
        amt: stakeAmt,
        value: qty, 
        stake_block: activeStake.block,
        block: SmartWeave.block.height 
      }];
  pools[pool] = (pools[pool] - stakeAmt);
  pools[rewardPool] = (pools[rewardPool] - amt);
  activeStake[0].active = false;
  return {state};
}

async function rewardDistribution (state, action) {
  const rewardDistributions = state.rewardDistributions;
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
  rewardDistributions[event] ? rewardDistributions[event] : rewardDistributions[event] = {}
  target.map(i => {
    const rewardEvent = rewardDistributions[event]
    const rewardEventPlayer = rewardEvent[i]
    if(rewardEventPlayer !== undefined) {
      rewardEventPlayer.push({
        value: qty,
        block: SmartWeave.block.height
        })
    } else {
      rewardEvent[i] = [{
        value: qty,
        block: SmartWeave.block.height
      }]
    }
  });
  return {state};
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
