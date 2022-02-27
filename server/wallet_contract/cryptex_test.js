
export async function handle(state, action) {
  const settings = new Map(state.settings);
  const vinciis = state.owner;
  const balances = state.balances;
  const stakes = state.stakes;
  const withdraws = state. withdraws;
  const registeredGames = state.registeredGames;
  const deregisteredGames = state.deregisteredGames;
  const preRegisterDatas = state.preRegisterDatas;
  const tasks = state.tasks;
  const rewardDistributions = state.rewardDistributions;
  const vault = state.vault;
  const votes = state.votes;
  const roles = state.roles;
  const canEvolve = state.canEvolve;
  const input = action.input;
  const caller = action.caller;

  // transfer
  if (input.function === "transfer") {
    const target = input.target;
    const qty = input.qty;
    if (!qty) {
      throw new ContractError('Invalid value for "qty". Must be an integer.');
    }
    if (!target) {
      throw new ContractError("No target specified.");
    }
    if (qty <= 0 || caller === target) {
      throw new ContractError("Invalid token transfer.");
    }
    if (!(balances[caller])) {
      throw new ContractError("Caller doesn't own any RAT balance.");
    }
    if (balances[caller] < qty) {
      throw new ContractError(`Caller balance not high enough to send ${qty} token(s)!`);
    }
    balances[caller] -= qty;
    if (balances[target]) {
      balances[target] += qty;
    } else {
      balances[target] = qty;
    }
    return {state}
  }

  //stake
  if (input.function === "stake") {
    const gameContract = input.gameContract;
    const pool = input.pool;
    const qty = input.qty;
    if (!qty) {
      throw new ContractError("Invalid input")
    }
    if (typeof qty !== "number" || qty <= 0){
      throw new ContractError("Invalid input format");
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
      )
    }
    if(!registeredGames.includes(gameContract)){
      throw new ContractError("Game not registered");
    }
  
    const stakeInput = { 
      [gameContract] : { 
        [pool] : {
          value: qty, 
          block: SmartWeave.block.height 
        } 
      } 
    }
  
    stakes[caller] 
      ? stakes[caller].push({ stakeInput }) 
      : (stakes[caller] = [{ stakeInput }]);
  
    return { state }
  }

  // withdraw
  if (input.function === "withdraw") {
    const gameContract = input.gameContract;
    const pool = input.pool;
    const qty = input.qty; 
    if (!gameContract) {
      throw new ContractError("Invalid or no game contract");
    }
    if (typeof gameContract !== "string"){
      throw new ContractError("Invalid inputs format");
    }
    if (gameContract.indexOf(" ") >= 0) {
      throw new ContractError("Address should have no space");
    }
    if (caller !== gameContract.owner) {
      throw new ContractError("Only owner can register a game");
    }
    if (!qty) {
      throw new ContractError("Invalid input");
    }
    if (typeof qty !== "number" || qty <= 0) {
      throw new ContractError("Invalid input format");
    }
    if (!(caller in stakes)) {
      throw new ContractError(`This ${caller}adress hasn't staked`);
    }
  
    const callerStake = stakes[caller][gameContract][pool];
  
    const avaliableTokenToWithdraw = callerStake.filter(
      (poolStake) => SmartWeave.block.height > poolStake.block
    );
  
    for (let poolStake of avaliableTokenToWithdraw) {
      if(qty <= poolStake.value) {
        poolStake.value -= qty;
        balances[caller] += qty;
        break;
      }
      if(qty > poolStake.value) {
        balances[caller] += poolStake.value;
        qty -= poolStake.value;
        poolStake.value -= poolStake.value;
      }
    }

    const withdrawInput = {
      [gameContract] : {
        [pool] : {
          value: qty,
          block: SmartWeave.block.height
        }
      }
    }

    withdraws[caller]
      ? withdraws[caller].push({ withdrawInput })
      : withdraws[caller] = [{ withdrawInput }];
  
    return { state }
  }

  //registerGame
  if (input.function === "registerGame") {
    const gameContract = input.gameContract;
    const qty = input.qty;
    if (!gameContract) {
      throw new ContractError("Invalid or no game contract");
    }
    if (typeof gameContract !== "string"){
      throw new ContractError("Invalid inputs format");
    }
    if (gameContract.indexOf(" ") >= 0) {
      throw new ContractError("Address should have no space");
    }
    if (caller !== gameContract.owner) {
      throw new ContractError("Only owner can register a game");
    }
    if (caller.length !== 43 || caller.indexOf(" ") >= 0) {
      throw new ContractError("Address should have 43 characters and no space");
    }
    if (balances[caller] < qty) {
      throw new ContractError(
        `Caller balance not high enough to send ${qty} RAT as registration cost!`
      )
    }
    if(registeredGames.includes(gameContract)){
      throw new ContractError("Game already registered");
    }
    
    balances[caller] -= qty; // pay to admin per registration
    balances[vinciis] += qty; // paid to admin per registration
  
    registeredGames[caller]
      ? registeredGames[caller].push({gameContract})
      : registeredGames[caller] = [{gameContract}];
  
  
    return { state }
  }

  // deregisterGame
  if (input.function === "deregisterGame") {
 
    const gameContract = input.gameContract;
    const qty = input.qty;
    if (!gameContract) {
      throw new ContractError("Invalid or no game contract");
    }
    if (typeof gameContract !== "string"){
      throw new ContractError("Invalid inputs format");
    }
    if (gameContract.indexOf(" ") >= 0) {
      throw new ContractError("Address should have no space");
    }
    if (caller !== gameContract.owner) {
      throw new ContractError("Only owner can deregister a game");
    }
    if (caller.length !== 43 || caller.indexOf(" ") >= 0) {
      throw new ContractError("Address should have 43 characters and no space");
    }
    if (balances[caller] < qty) {
      throw new ContractError(
        `Caller balance not high enough to send ${qty} RAT as registration cost!`
      );
    }
    if(!registeredGames[caller].includes(gameContract)){
      throw new ContractError("Game not registered");
    }
    
    balances[caller] -= qty; // pay to admin per deregistration
    balances[vinciis] += qty; // paid to admin per deregistration
  
    registeredGames[caller].pull({gameContract});
  
    deregisteredGames[caller]
    ? deregisteredGames[caller].push({gameContract})
    : deregisteredGames[caller] = [{gameContract}];
  
    return { state }
  }

  // rewardDistribution
  if (input.function === "rewardDistribution") {
    const target = input.target;
    const gameContract = input.gameContract;
    const qty = input.qty;
    if (!gameContract) {
      throw new ContractError("Invalid or no game contract");
    }
    if (typeof gameContract !== "string"){
      throw new ContractError("Invalid inputs format");
    }
    if (gameContract.indexOf(" ") >= 0) {
      throw new ContractError("Address should have no space");
    }
    if (caller !== gameContract.owner) {
      throw new ContractError("Only owner can register a game");
    }
    if(!registeredGames.includes(gameContract)){
      throw new ContractError("Game not registered");
    }

    const rewardGameInput = {
      [gameContract] : [
        {
          value: qty,
          block: SmartWeave.block.height
        }
      ]
    }

    rewardDistributions[target]
      ? rewardDistributions[target].push({ rewardGameInput })
      : (rewardDistributions[target] = [{ rewardGameInput }]);
    
  }


  // mint
  if (input.function === "mint") {
    const target = input.target || caller;
    const qty = input.qty;
    if (vinciis !== caller) {
      throw new ContractError("Only the vinciis can mint new tokens");
    }
    if (!target || !qty) {
      throw new ContractError("Invalid Inputs");
    }
    if (typeof target !== "string" || typeof qty !== "number" || qty <= 0) {
      throw new ContractError("Invalid input format");
    }
    if (target.length !== 43 || target.indexOf(" ") >= 0) {
      throw new ContractError("Address should have 43 characters and no space");
    }
    if (balances[target]) {
      balances[target] += qty;
    } else {
      balances[target] = qty;
    }
    return { state }
  }

  // preRegister register contents in koii contract state with their full information in temporary array
  // later this contents will be migrated to their respective contracts
  // to save content creators from interacting two contracts.
  if (input.function === "preRegister") {
    const contractId = input.contractId;
    const contentType = input.contentType;
    const contentTxId = input.contentTxId;
    const owner = input.owner;
    if (!contractId || !contentType || !contentTxId)
      throw new ContractError("Invalid inputs");
    if (typeof contractId !== "string" || typeof contentTxId !== "string") {
      throw new ContractError("Invalid inputs format");
    }
    if (contractId.length !== 43 || contentTxId.length !== 43) {
      throw new ContractError("Inputs should have 43 characters");
    }
    if (!(caller in balances) || balances[caller] < 1)
      throw new ContractError("you do not have enough RAT");
    const data = preRegisterDatas.find(
      (preRegisterData) => preRegisterData.content[contentType] === contentTxId
    );
    if (data !== undefined) {
      throw new ContractError("Content is already registered");
    }
    balances[caller] -= 1; // pay to admin
    balances[vinciis] += 1; // paid to admin per registration

    owner !== undefined
      ? preRegisterDatas.push({
          contractId: contractId,
          insertBlock: SmartWeave.block.height,
          content: { [contentType]: contentTxId },
          owner: owner
        })
      : preRegisterDatas.push({
          contractId: contractId,
          insertBlock: SmartWeave.block.height,
          content: { [contentType]: contentTxId },
          owner: caller
        })
  
    return { state }
  }

  // clear preRegister datas doesn't takes input after burnRAT
  // cleans preRegister array after the contents are migrated to their respective contracts.
  if (input.function === "clearPreRegister") {

    const contractIds = [];
    preRegisterDatas.forEach((preRegisterData) => {
      if ("nft" in preRegisterData.content) {
        if (!contractIds.includes(preRegisterData.contractId)) {
          contractIds.push(preRegisterData.contractId);
        }
      }
    });
  
    await Promise.allSettled(
      contractIds.map(async (contractId) => {
        const contractState = await SmartWeave.contracts.readContractState(
          contractId
        );
        const registeredNfts = Object.values(contractState.nfts).reduce(
          (acc, curVal) => acc.concat(curVal),
          []
        );
        preRegisterDatas = preRegisterDatas.filter(
          (preRegisterData) =>
            !registeredNfts.includes(preRegisterData.content.nft)
        );
      })
    );
    return { state }
  }

  // register task 
  if (input.function === "registerTask"){
    const taskName = input.taskName;
    const taskTxId = input.taskTxId;
    const ratReward = input.ratReward;
    if (caller !== SmartWeave.contract.owner) {
      throw new ContractError("Only owner can register a task");
    }
    if (!taskTxId || !taskName) {
      throw new ContractError("Invalid inputs");
    }
    if (typeof taskTxId !== "string" || typeof taskName !== "string") {
      throw new ContractError("Invalid inputs format");
    }
    if (ratReward && balances[caller] < ratReward + 1) {
      throw new ContractError("Your Balance is not enough");
    }
    const txId = tasks.find((task) => task.txId === taskTxId);
    if (txId !== undefined) {
      throw new ContractError(`task with ${txId}id is already registered `);
    }
    balances[caller] -= 1; // pay to admin
    balances[vinciis] += 1; // paid to admin per registration

    // Required to start caching this task state in kohaku
    await SmartWeave.contracts.readContractState(taskTxId);
    ratReward
      ? (tasks.push({
          owner: caller,
          name: taskName,
          txId: taskTxId,
          bounty: ratReward,
          rewardedBlock: [],
          lockBounty: {
            [caller]: ratReward
          }
        }),
        (balances[caller] -= ratReward))
      : tasks.push({
          owner: caller,
          name: taskName,
          txId: taskTxId,
          rewardedBlock: []
        });

    return { state }
  }

  // deregister task
  if (input.function === "deregisterTask") {
    const txId = action.input.taskTxId;
    if (!txId) throw new ContractError("Invalid input");
    if (typeof txId !== "string") throw new ContractError("Invalid input format");
    if (txId.length !== 43)
      throw new ContractError("Input should have 43 characters");
    const task = tasks.find(
      (task) => task.txId === txId && task.owner === caller
    );
    if (task === undefined) {
      throw new ContractError(
        `Task with ${txId} Id and ${caller} owner is not registered`
      );
    }
    const index = tasks.indexOf(task);
    tasks.splice(index, 1);
    return { state }
  }

  // distributeReward
  if (input.function === "distributeReward") {
    const distributionStatus = state.distributionBlock;
    if (distributionStatus > SmartWeave.block.height) {
      throw new ContractError("Distribution already happen");
    }
    for (const task of tasks) {
      const contractState = await SmartWeave.contracts
        .readContractState(task.txId)
        .catch((e) => {
          if (e.type !== "TX_NOT_FOUND") throw e;
        });
      if (contractState) {
        const prepareDistribution = contractState.task.prepareDistribution;
        const rewardedBlock = task.rewardedBlock;
        // clean rewarded block
        for (let i = rewardedBlock.length - 1; i >= 0; i--) {
          const distributedBlock = prepareDistribution.find(
            (distribution) => distribution.block === rewardedBlock[i]
          );
          if (!distributedBlock) {
            rewardedBlock.splice(i, 1);
          }
        }
        // filter isRewarded = true and if distribution unRewarded in Main Contract
        const unRewardedPrepareDistribution = prepareDistribution.filter(
          (distribution) =>
            !distribution.isRewarded &&
            !rewardedBlock.includes(distribution.block)
        );
        if ("bounty" in task) {
          unRewardedPrepareDistribution.forEach((prepareDistribution) => {
            const lockBounty = task.lockBounty[task.owner];
            const taskDistribution = Object.values(
              prepareDistribution.distribution
            ).reduce((preValue, curValue) => preValue + curValue);
            if (lockBounty >= taskDistribution) {
              for (let address in prepareDistribution.distribution) {
                address in balances
                  ? (balances[address] +=
                      prepareDistribution.distribution[address])
                  : (balances[address] =
                      prepareDistribution.distribution[address]);
              }
              rewardedBlock.push(prepareDistribution.block);
              task.lockBounty[task.owner] -= taskDistribution;
            }
          });
        } else {
          unRewardedPrepareDistribution.forEach((prepareDistribution) => {
            for (let address in prepareDistribution.distribution) {
              address in balances
                ? (balances[address] += prepareDistribution.distribution[address])
                : (balances[address] = prepareDistribution.distribution[address]);
            }
            rewardedBlock.push(prepareDistribution.block);
          });
        }
      }
    }
    state.distributionBlock = SmartWeave.block.height + 600;
    return { state };
  }

  // balance
  if (input.function === "balance") {
    const target = input.target || caller;
    if (typeof target !== "string") {
      throw new ContractError("Must specificy target to get balance for.");
    }
    let balance = 0;
    if (target in balances) {
      balance = balances[target];
    }
    if (vault[target].length && target in vault) {
      balance += vault[target].map((a) => a.balance).reduce((a, b) => a + b, 0);
    }
    return {result: {target, balance}}
  }

  // unlockedBalance
  if (input.function === "unlockedBalance") {
    const target = input.target || caller;
    if (typeof target !== "string") {
      throw new ContractError("Must specificy target to get balance for.");
    }
    if (!(target in balances)) {
      throw new ContractError("Cannnot get balance, target does not exist.");
    }
    let balance = balances[target];
    return {result: {target, balance}}
  }

  // lock
  if (input.function === "lock") {
    const qty = input.qty;
    const lockLength = input.lockLength;
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new ContractError("Quantity must be a positive integer.");
    }
    if (!Number.isInteger(lockLength) || lockLength < settings.get("lockMinLength") || lockLength > settings.get("lockMaxLength")) {
      throw new ContractError(`lockLength is out of range. lockLength must be between ${settings.get("lockMinLength")} - ${settings.get("lockMaxLength")}.`);
    }
    const balance = balances[caller];
    if (isNaN(balance) || balance < qty) {
      throw new ContractError("Not enough balance.");
    }
    balances[caller] -= qty;
    const start = +SmartWeave.block.height;
    const end = start + lockLength;
    if (caller in vault) {
      vault[caller].push({
        balance: qty,
        end,
        start
      })
    } else {
      vault[caller] = [{
        balance: qty,
        end,
        start
      }]
    }
    return {state}
  }

  // increaseVault
  if (input.function === "increaseVault") {
    const lockLength = input.lockLength;
    const id = input.id;
    if (!Number.isInteger(lockLength) || lockLength < settings.get("lockMinLength") || lockLength > settings.get("lockMaxLength")) {
      throw new ContractError(`lockLength is out of range. lockLength must be between ${settings.get("lockMinLength")} - ${settings.get("lockMaxLength")}.`);
    }
    if (caller in vault) {
      if (!vault[caller][id]) {
        throw new ContractError("Invalid vault ID.");
      }
    } else {
      throw new ContractError("Caller does not have a vault.");
    }
    if (+SmartWeave.block.height >= vault[caller][id].end) {
      throw new ContractError("This vault has ended.");
    }
    vault[caller][id].end = +SmartWeave.block.height + lockLength;
    return {state}
  }

  // unlock
  if (input.function === "unlock") {
    if (caller in vault && vault[caller].length) {
      let i = vault[caller].length;
      while (i--) {
        const locked = vault[caller][i];
        if (+SmartWeave.block.height >= locked.end) {
          if (caller in balances && typeof balances[caller] === "number") {
            balances[caller] += locked.balance;
          } else {
            balances[caller] = locked.balance;
          }
          vault[caller].splice(i, 1);
        }
      }
    }
    return {state}
  }

  // vaultBalance
  if (input.function === "vaultBalance") {
    const target = input.target || caller;
    let balance = 0;
    if (target in vault) {
      const blockHeight = +SmartWeave.block.height;
      const filtered = vault[target].filter((a) => blockHeight < a.end);
      for (let i = 0, j = filtered.length; i < j; i++) {
        balance += filtered[i].balance;
      }
    }
    return {result: {target, balance}}
  }

  // purpose
  if (input.function === "propose") {
    const voteType = input.type;
    const note = input.note;
    if (typeof note !== "string") {
      throw new ContractError("Note format not recognized.");
    }
    if (!(caller in vault)) {
      throw new ContractError("Caller needs to have locked balances.");
    }
    const hasBalance = vault[caller] && !!vault[caller].filter((a) => a.balance > 0).length;
    if (!hasBalance) {
      throw new ContractError("Caller doesn't have any locked balance.");
    }
    let totalWeight = 0;
    const vaultValues = Object.values(vault);
    for (let i = 0, j = vaultValues.length; i < j; i++) {
      const locked = vaultValues[i];
      for (let j2 = 0, k = locked.length; j2 < k; j2++) {
        totalWeight += locked[j2].balance * (locked[j2].end - locked[j2].start);
      }
    }
    let vote = {
      status: "active",
      type: voteType,
      note,
      yays: 0,
      nays: 0,
      voted: [],
      start: +SmartWeave.block.height,
      totalWeight
    };
    if (voteType === "mint" || voteType === "mintLocked") {
      const recipient = input.recipient;
      const qty = +input.qty;
      if (!recipient) {
        throw new ContractError("No recipient specified");
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new ContractError('Invalid value for "qty". Must be a positive integer.');
      }
      let totalSupply = 0;
      const vaultValues2 = Object.values(vault);
      for (let i = 0, j = vaultValues2.length; i < j; i++) {
        const locked = vaultValues2[i];
        for (let j2 = 0, k = locked.length; j2 < k; j2++) {
          totalSupply += locked[j2].balance;
        }
      }
      const balancesValues = Object.values(balances);
      for (let i = 0, j = balancesValues.length; i < j; i++) {
        totalSupply += balancesValues[i];
      }
      if (totalSupply + qty > Number.MAX_SAFE_INTEGER) {
        throw new ContractError("Quantity too large.");
      }
      let lockLength = {};
      if (input.lockLength) {
        if (!Number.isInteger(input.lockLength) || input.lockLength < settings.get("lockMinLength") || input.lockLength > settings.get("lockMaxLength")) {
          throw new ContractError(`lockLength is out of range. lockLength must be between ${settings.get("lockMinLength")} - ${settings.get("lockMaxLength")}.`);
        }
        lockLength = {lockLength: input.lockLength};
      }
      Object.assign(vote, {
        recipient,
        qty
      }, lockLength);
      votes.push(vote);
    } else if (voteType === "burnVault") {
      const target = input.target;
      if (!target || typeof target !== "string") {
        throw new ContractError("Target is required.");
      }
      Object.assign(vote, {
        target
      });
      votes.push(vote);
    } else if (voteType === "set") {
      if (typeof input.key !== "string") {
        throw new ContractError("Data type of key not supported.");
      }
      if (input.key === "quorum" || input.key === "support" || input.key === "lockMinLength" || input.key === "lockMaxLength") {
        input.value = +input.value;
      }
      if (input.key === "quorum") {
        if (isNaN(input.value) || input.value < 0.01 || input.value > 0.99) {
          throw new ContractError("Quorum must be between 0.01 and 0.99.");
        }
      } else if (input.key === "support") {
        if (isNaN(input.value) || input.value < 0.01 || input.value > 0.99) {
          throw new ContractError("Support must be between 0.01 and 0.99.");
        }
      } else if (input.key === "lockMinLength") {
        if (!Number.isInteger(input.value) || input.value < 1 || input.value >= settings.get("lockMaxLength")) {
          throw new ContractError("lockMinLength cannot be less than 1 and cannot be equal or greater than lockMaxLength.");
        }
      } else if (input.key === "lockMaxLength") {
        if (!Number.isInteger(input.value) || input.value <= settings.get("lockMinLength")) {
          throw new ContractError("lockMaxLength cannot be less than or equal to lockMinLength.");
        }
      }
      if (input.key === "role") {
        const recipient = input.recipient;
        if (!recipient) {
          throw new ContractError("No recipient specified");
        }
        Object.assign(vote, {
          key: input.key,
          value: input.value,
          recipient
        });
      } else {
        Object.assign(vote, {
          key: input.key,
          value: input.value
        });
      }
      votes.push(vote);
    } else if (voteType === "indicative") {
      votes.push(vote);
    } else {
      throw new ContractError("Invalid vote type.");
    }
    return {state}
  }

  // vote
  if (input.function === "vote") {
    const id = input.id;
    const cast = input.cast;
    if (!Number.isInteger(id)) {
      throw new ContractError('Invalid value for "id". Must be an integer.');
    }
    const vote = votes[id];
    let voterBalance = 0;
    if (caller in vault) {
      for (let i = 0, j = vault[caller].length; i < j; i++) {
        const locked = vault[caller][i];
        if (locked.start < vote.start && locked.end >= vote.start) {
          voterBalance += locked.balance * (locked.end - locked.start);
        }
      }
    }
    if (voterBalance <= 0) {
      throw new ContractError("Caller does not have locked balances for this vote.");
    }
    if (vote.voted.includes(caller)) {
      throw new ContractError("Caller has already voted.");
    }
    if (+SmartWeave.block.height >= vote.start + settings.get("voteLength")) {
      throw new ContractError("Vote has already concluded.");
    }
    if (cast === "yay") {
      vote.yays += voterBalance;
    } else if (cast === "nay") {
      vote.nays += voterBalance;
    } else {
      throw new ContractError("Vote cast type unrecognised.");
    }
    vote.voted.push(caller);
    return {state}
  }

  // finalize
  if (input.function === "finalize") {
    const id = input.id;
    const vote = votes[id];
    const qty = vote.qty;
    if (!vote) {
      throw new ContractError("This vote doesn't exists.");
    }
    if (+SmartWeave.block.height < vote.start + settings.get("voteLength")) {
      throw new ContractError("Vote has not yet concluded.");
    }
    if (vote.status !== "active") {
      throw new ContractError("Vote is not active.");
    }
    if (vote.totalWeight * settings.get("quorum") > vote.yays + vote.nays) {
      vote.status = "quorumFailed";
      return {state};
    }
    if (vote.yays !== 0 && (vote.nays === 0 || vote.yays / vote.nays > settings.get("support"))) {
      vote.status = "passed";
      if (vote.type === "mint" || vote.type === "mintLocked") {
        let totalSupply = 0;
        const vaultValues = Object.values(vault);
        for (let i = 0, j = vaultValues.length; i < j; i++) {
          const locked = vaultValues[i];
          for (let j2 = 0, k = locked.length; j2 < k; j2++) {
            totalSupply += locked[j2].balance;
          }
        }
        const balancesValues = Object.values(balances);
        for (let i = 0, j = balancesValues.length; i < j; i++) {
          totalSupply += balancesValues[i];
        }
        if (totalSupply + qty > Number.MAX_SAFE_INTEGER) {
          throw new ContractError("Quantity too large.");
        }
      }
      if (vote.type === "mint") {
        if (vote.recipient in balances) {
          balances[vote.recipient] += qty;
        } else {
          balances[vote.recipient] = qty;
        }
      } else if (vote.type === "mintLocked") {
        const start = +SmartWeave.block.height;
        const end = start + vote.lockLength;
        const locked = {
          balance: qty,
          start,
          end
        };
        if (vote.recipient in vault) {
          vault[vote.recipient].push(locked);
        } else {
          vault[vote.recipient] = [locked];
        }
      } else if (vote.type === "burnVault") {
        if (vote.target in vault) {
          delete vault[vote.target];
        } else {
          vote.status = "failed";
        }
      } else if (vote.type === "set") {
        if (vote.key === "role") {
          roles[vote.recipient] = vote.value;
        } else {
          settings.set(vote.key, vote.value);
          settings = Array.from(settings);
        }
      }
    } else {
      vote.status = "failed";
    }
    return {state}
  }

  // role
  if (input.function === "role") {
    const target = input.target || caller;
    const role = target in roles ? roles[target] : "";
    if (!role.trim().length) {
      throw new Error("Target doesn't have a role specified.");
    }
    return {result: {target, role}}
  }

  // can evolve
  if(input.function === 'evolve' && canEvolve) {
    if(vinciis !== caller) {
      throw new ContractError('Only the owner can evolve a contract.');
    }

    state.evolve = input.value

    return { state }
  }

  throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
}
