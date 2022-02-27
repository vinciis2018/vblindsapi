'use strict';

import { SmartWeave } from "redstone-smartweave";

// transfer
function transfer (state, action) {
  const balances = state.balances;
  const input = action.input;
  const caller = action.caller;
  const target = input.target;
  const qty = input.qty;
  if (!qty || !target || caller === target) {
    throw new ContractError('Invalid value for "qty" and "target.');
  }
  if (typeof target !== "string" || typeof qty !== "number" || qty <= 0) {
    throw new ContractError("No target specified.");
  }
  if (target.length !== 43 || target.indexOf(" ") >= 0) {
    throw new ContractError("Invalid token transfer.");
  }
  if (!(caller in balances)) {
    throw new ContractError("Caller doesn't own any RAT balance.");
  }
  if (balances[caller] < qty) {
    throw new ContractError(`Caller balance not high enough to send ${qty} token(s)!`);
  }
  balances[caller] -= qty;
  if (target in balances) {
    balances[target] += qty;
  } else {
    balances[target] = qty;
  }
  return {state};
}

//registerGame
async function registerGame (state, action) {
  const vinciis = state.owner;
  const balances = state.balances;
  const input = action.input;
  const caller = action.caller;
  const registeredGames = state.registeredGames;
  const gameContract = input.gameContract;
  const type = input.type;
  const qty = input.qty;
  if(!qty || typeof qty !== "number" || qty <= 0) {
    throw new ContractError("Invalid quantity.");
  }
  if (typeof gameContract !== "string"){
    throw new ContractError("Invalid inputs format");
  }
  if (gameContract.indexOf(" ") >= 0) {
    throw new ContractError("Address should have no space");
  }
  if (caller.length !== 43 || caller.indexOf(" ") >= 0) {
    throw new ContractError("Address should have 43 characters and no space");
  }
  if (balances[caller] < qty) {
    throw new ContractError(
      `Caller balance not high enough to send ${qty} RAT as registration cost!`
    );
  }
  // const gameContractState = await SmartWeave.contracts.readContractState(gameContract);
  // if (caller !== gameContractState.owner) {
  //   throw new ContractError("Only owner can register a game");
  // }
  if(registeredGames[gameContract] && registeredGames[gameContract].active === true){
    throw new ContractError("Game already registered");
  }

  if(caller !== vinciis) {
    balances[caller] -= qty; // pay to admin per registration
    balances[vinciis] += qty; // paid to admin per registration
  }

  registeredGames[gameContract] = type

  return { state };
}

// deregisterGame
async function deregisterGame(state, action) {
  const vinciis = state.owner;
  const balances = state.balances;
  const input = action.input;
  const caller = action.caller;
  const registeredGames = state.registeredGames;
  const deregisteredGames = state.deregisteredGames;
  const gameContract = input.gameContract;
  const type = input.type;
  const qty = input.qty;
  if(!qty || typeof qty !== "number" || qty <= 0) {
    throw new ContractError("Invalid quantity.");
  }
  if (typeof gameContract !== "string"){
    throw new ContractError("Invalid inputs format");
  }
  if (gameContract.indexOf(" ") >= 0) {
    throw new ContractError("Address should have no space");
  }
  if (caller.length !== 43 || caller.indexOf(" ") >= 0) {
    throw new ContractError("Address should have 43 characters and no space");
  }
  if (balances[caller] < qty) {
    throw new ContractError(
      `Caller balance not high enough to send ${qty} RAT as registration cost!`
    );
  }
  // const gameContractState = await SmartWeave.contracts.readContractState(gameContract);
  // if (caller !== gameContractState.owner) {
  //   throw new ContractError("Only owner can deregister a game");
  // }
  if(!registeredGames[gameContract] || registeredGames[gameContract].active === false){
    throw new ContractError("Game not registered");
  }
  
  if(caller !== vinciis) {
    balances[caller] -= qty; // pay to admin per deregistration
    balances[vinciis] += qty; // paid to admin per deregistration
  }

  registeredGames[gameContract].active = false;
  deregisteredGames[gameContract] = type

  return { state };
}

// incentives
async function incentives(state, action) {
  const balances = state.balances;
  const input = action.input;
  const gameContract = input.gameContract;
  const type = input.type;
  const winners = type.winners;
  const qty = type.value;
  if(!qty || typeof qty !== "number" || qty <= 0) {
    throw new ContractError("Invalid quantity.");
  }
  if (typeof gameContract !== "string"){
    throw new ContractError("Invalid inputs format");
  }
  if (gameContract.indexOf(" ") >= 0) {
    throw new ContractError("Address should have no space");
  }
  if(!state.registeredGames[gameContract]){
    throw new ContractError("Game not registered");
  }

  // await SmartWeave.contracts.readContractState(gameContract);
  await winners.map((winner) => {
    balances[winner] += qty;
  })
  state.incentives[gameContract]
    ? state.incentives[gameContract].push(type)
    : state.incentives[gameContract] = [type];
  
  return { state };
}


const handlers = [
  transfer,
  registerGame,
  deregisterGame,
  incentives
];

export async function handle (state, action) {
  const handler = handlers.find((fn) => fn.name === action.input.function);
  if (handler) return await handler(state, action);
  throw new ContractError(`Invalid function: "${action.input.function}"`);
}
