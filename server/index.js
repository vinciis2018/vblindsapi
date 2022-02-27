

import express from "express";
import Mongoose from "mongoose";
// import Arweave from 'arweave';
// import * as SmartWeaveSDK from 'redstone-smartweave';

import dotenv from 'dotenv';
import path from 'path';

import cors from 'cors';
import bodyParser from "body-parser";


import userRouter from "./routers/userRouter.js";
import assetRouter from "./routers/assetRouter.js";
import screenRouter from "./routers/screenRouter.js";
import pinRouter from "./routers/pinRouter.js";
import pleaRouter from "./routers/pleaRouter.js";
import channelRouter from "./routers/channelRouter.js";
import filmRouter from "./routers/filmRouter.js";
import shopRouter from "./routers/shopRouter.js";
import itemRouter from "./routers/itemRouter.js";
import videoRouter from "./routers/videoRouter.js";
import uploadRouter from "./routers/uploadRouter.js";
import walletRouter from "./routers/walletRouter.js";
import calenderRouter from './routers/calenderRouter.js';
import gameRouter from './routers/gameRouter.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

Mongoose.connect('mongodb+srv://vviicckkyy55:toomuchfun@cluster0.xbtpg.mongodb.net/blindsBeta_1?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: "majority",
})

app.use(cors({ origin: '*' }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.use(express.static('public'));

app.use('/api/users', userRouter);
app.use('/api/assets', assetRouter);
app.use('/api/screens', screenRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/videos', videoRouter);
app.use('/api/pleas', pleaRouter);
app.use('/api/channels', channelRouter);
app.use('/api/films', filmRouter);
app.use('/api/shops', shopRouter);
app.use('/api/items', itemRouter);

app.use('/api/pins', pinRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/calender', calenderRouter);
app.use('/api/game', gameRouter);


const __dirname = path.resolve();
app.use('/api/static', express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, '/client/build')));
app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '/client/build/index.html'))
);

app.get('/', (req, res) => {
    res.send('Server is ready')
});

app.use((err, req, res, next) => {
    res.status(500).send({ message: err.message });
});


const port = process.env.PORT;
const host = process.env.HOST_URL
app.listen(port, () => {
    console.log(`Server at ${host}${port}`);
});

