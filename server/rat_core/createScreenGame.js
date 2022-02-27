import Arweave from 'arweave';

const arweave =  Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
  timeout: 20000,
  logging: false,
})

export default async function createScreenGame(action) {
  const caller = action.caller;
  const input = action.input;

  const initialState = {
    ratId: input.gameId,
    owner: caller,
    title: input.gameTitle,
    name: input.gameName,
    description: input.gamePage,
    gameType: input.gameType,
    gameParams: input.gameParams,
    stakes: {
      likeEP: {},
      flagEP: {},
      EPs: {},
      EPa: {}
    },
    withdraws: {},
    rewardDistributions: {
      sell: {},
      worthless: {}
    },
    locked: [],
    contentType: "application/json",
    createdAt: new Date().toString(),
    tags: input.gameTags,
    additonal: {}
  };
  
  const contractSource = 'lpo8x-d58Oh4uvlSb2bfBN2j2INBct7i5erSTcpMzwo';

  const wallet = action.wallet;
  const contentType = initialState.contentType

  console.log(contentType)
  try {
    // Now, let's create the Initial State transaction
    const initialStateTx = await arweave.createTransaction(
      { 
        data:  JSON.stringify(initialState)
      }, wallet
    );
    initialStateTx.addTag('App-Name', 'SmartWeaveContract');
    initialStateTx.addTag('App-Version', '0.3.0');
    initialStateTx.addTag('Contract-Src', contractSource);
    initialStateTx.addTag('Content-Type', contentType);
    initialStateTx.addTag('Init-State', JSON.stringify(initialState));
    initialStateTx.addTag('Service-Name', 'Blinds By Vinciis');
    console.log(initialStateTx)
    
    // Sign
    await arweave.transactions.sign(initialStateTx, wallet);
    const initialStateTxId = initialStateTx.id;
    console.log(initialStateTxId)
    // Deploy
    await arweave.transactions.post(initialStateTx);

    return initialStateTxId;
  } catch (error) {
    console.error(error);
    return error;
  }

}