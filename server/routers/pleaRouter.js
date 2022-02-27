import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Plea from '../models/pleaModel.js';
import User from '../models/userModel.js';
import Screen from '../models/screenModel.js';

import { isItanimulli, isAuth, isItanimulliOrMaster } from "../utils.js";

const pleaRouter = express.Router();


pleaRouter.post(
  '/access',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const newPlea = new Plea(req.body);

    try {

      const userFrom = await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: {
            pleasMade: newPlea._id
          }
        });
      console.log({ userFrom });

      const userFromAdded = await userFrom.save();
      console.log(userFromAdded);


      const userTo = await User.findOneAndUpdate(
        { _id: "60e7f209c2964350550c5ff6" },
        {
          $push: {
            pleasRecieved: newPlea._id
          }
        });
      console.log({ userTo });

      const userToAdded = await userTo.save();
      console.log(userToAdded);

      newPlea.to = userTo._id;
      const pleaAdded = await newPlea.save();
      console.log(pleaAdded)

      return res.status(200).send(pleaAdded, userToAdded, userFromAdded);
    } catch (error) {
      return res.status(400).send(error);
    }
  })
);


pleaRouter.get(
  '/allPleas',
  isAuth,
  expressAsyncHandler( async (req, res) => {
    try {
      const allPleas = await Plea.find();
      if(allPleas) {
        console.log(allPleas);
        return res.status(200).send(allPleas);
      } else {
        return res.status(400).send('backend get error')
      }
    } catch (error) {
      return res.send(error);
    }
  })
);

pleaRouter.get(
  '/summary',
  isAuth,
  isItanimulliOrMaster,
  expressAsyncHandler(async (req, res) => {
    const pleas = await Plea.aggregate([
      {
        $group: {
          _id: null,
          numPleas: {$sum: 1},
          // totalSales: {$sum: '$totalPrice'}
        },
      },
    ]);

    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: {$sum: 1},
        },
      },
    ]);

    const masters = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: {$sum: 1},
        },
      },
    ]);
    const allies = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: {$sum: 1},
        },
      },
    ]);
    const brands = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: {$sum: 1},
        },
      },
    ]);

    const dailyPleas = await Plea.aggregate([
      {
        $group: {
          _id: { $dateToString: {format: `%Y-%m-%d`, date: `$createdAt`}},
          pleas: { $sum: 1 },
          totalSales: {$sum: '$totalPrice'}
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const screenCategories = await Screen.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ users, masters, allies, brands, pleas, dailyPleas, screenCategories})
  })
);


export default pleaRouter;