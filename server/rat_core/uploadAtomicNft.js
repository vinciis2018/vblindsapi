import checkTxConfirmation from '../helpers/checkTxConfirmation.js'

import fetch from 'node-fetch';
import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const port = process.env.PORT || 3333;

async function getDataBlob(imageUrl) {
  
  var res = await fetch(`http://localhost:${port}/api/static/${imageUrl}`);
  console.log(res)
  var blob = await res.blob();
  console.log(blob);

  var obj = {};
  obj.contentType = blob.type;

  var buffer = await blob.arrayBuffer();
  obj.data = buffer;

  console.log(obj)
  return obj;
}

export default async function uploadAtomicNft(action) {
  console.log(action)
  const caller = action.caller;
  const req = action.req;
  const arweave = action.arweave;
  try {

    let contractSrc = "r_ibeOTHJW8McJvivPJjHxjMwkYfAKRjs-LjAeaBcLc";

    const wallet = JSON.parse(fs.readFileSync(
      path.join(__dirname, "server/wallet_drive", `key_${caller}.json`)
    ));
    
    console.log("key", wallet);


    const fileToUpload = await req.body.anft;
    console.log(fileToUpload);

    // const imageUrl = "http://blindsab.herokuapp.com/images/circlelogo.png";
    const imageUrl = req.body.anft.originalname.replace(/ /g, '_');

    console.log(imageUrl);

    
    let imageOBJ = await getDataBlob(imageUrl);

    console.log("imageUrl", imageOBJ);

    // initial state of nft being created
    let initialState = {
      "owner": caller,
      "title": req.body.anftTitle,
      "name": req.body.user.name,
      "description": req.body.anftDescription,
      "ticker": "KORAAN",
      "balances": {
        [caller]: 1
      },
      "locked": [],
      "contentType": imageOBJ.contentType,
      "createdAt": Date.now(),
      "tags":req.body.anftTags,
      "isNsfw": req.body.isNsfw,
    };

    console.log(initialState);
    let tx;

    tx = await arweave.createTransaction(
      {
        data: imageOBJ.data,
      },
      wallet
    );

    tx.addTag('Content-Type', imageOBJ.contentType);
    tx.addTag('Network', 'Koii');
    tx.addTag('Action', 'marketplace/Create');
    tx.addTag('App-Name', 'SmartWeaveContract');
    tx.addTag('App-Version', '0.3.0');
    tx.addTag('Contract-Src', contractSrc);
    tx.addTag('Init-State', JSON.stringify(initialState));
    tx.addTag("NSFW", initialState.isNsfw);

    await arweave.transactions.sign(tx, wallet);
    console.log("signing done") 

    try {
      // console.log(" wallet : ", wallet);
      console.log('TX', tx);
      let uploader = await arweave.transactions.getUploader(tx);
      console.log('uploder', uploader);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(uploader.pctComplete + '% complete', uploader.uploadedChunks + '/' + uploader.totalChunks);
      }

      const uploadedNftData = uploader;
      console.log("uploader", uploadedNftData)


      let txId = tx.id;
      const resultStatus = await arweave.transactions.getStatus(txId);
      console.log("resultStatus", resultStatus);

      const isTxConfirm = await checkTxConfirmation(txId, arweave)
      let txFee = await arweave.transactions.getPrice(tx.data_size);

      const result = {
        txId, isTxConfirm
      }
      console.log("result")

      return ({result, uploadedNftData, txFee});


    } catch (err) {
      console.log('err-uploadAnft_noresult', err);
      return (err);
    }
  } catch (error) {
    console.log('err-uploadAnft', error);
    return (error);
  }
}
