import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth } from '../utils.js';
import Pin from '../models/pinModel.js';
import Screen from '../models/screenModel.js';
import Shop from '../models/shopModel.js';
import data from '../data.js'


const pinRouter = express.Router();


pinRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const pins = await Pin.find();
    try {
      return res.status(200).send(pins);
    } catch (error) {
      return res.status(404).send(error);
    }
  })
);



pinRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {

    const createdPins = await Pin.insertMany(data.pins);
    res.send({ createdPins });
  })
);


pinRouter.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const newPin = new Pin(req.body);

    try {
      newPin.lat = req.body.lat;
      newPin.lng = req.body.lng;
      newPin.category = req.body.category;
      newPin.user = req.body.user;
      if(newPin.category === "screen") {
        newPin.screenPin = req.body.screenPin;
        newPin.screen = req.body.screen;
      }
      if(newPin.category === "shop") {
        newPin.shopPin = req.body.shopPin;
        newPin.shop = req.body.shop;
      }
      const pinAdded = await newPin.save();
      console.log(pinAdded)
      return res.status(200).send(pinAdded);
    } catch (error) {
      console.log(error);
      return res.status(400).send(error);
    }
  })
);

pinRouter.put(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const pinAsset = await Screen.findById(req.params.id) || await Shop.findById(req.params.id);
    const pinId = pinAsset.locationPin;
    const pin = await Pin.findById(pinId);
    try {
      pin.lat = req.body.lat || pin.lat;
      pin.lng = req.body.lng || pin.lng;
      await pin.save();
      console.log(pin)
      return res.status(200).send(pin);
    } catch (error) {
      console.log(error);
      return res.status(400).send(error);
    }
  })
);


export default pinRouter;