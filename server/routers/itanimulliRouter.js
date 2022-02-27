import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import data from '../data.js';
import { isItanimulli, isAuth } from '../utils.js';


const itanimulliRouter = express.Router();


// seed data

itanimulliRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    const createdUsers = await User.insertMany(data.users);
    res.status(200).send({ createdUsers });
  })
);


// get users list
itanimulliRouter.get(
  '/',
  isAuth,
  isItanimulli,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.status(200).send(users);
  })
);


//  user delete
itanimulliRouter.delete(
  '/:id',
  isAuth,
  isItanimulli,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.email === 'vviicckkyy55@gmail.com') {
        res.status(400).send({
          message: "Cannot delete admin father"
        });
        return;
      }
      const deleteUser = await user.remove();
      res.status(200).send({
        message: 'User Deleted',
        user: deleteUser
      });
    } else {
      res.status(404).send({
        message: 'User not Found'
      });
    }
  })
);

//  
itanimulliRouter.put(
  '/:id',
  isAuth,
  isItanimulli,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isMaster = Boolean(req.body.isMaster);
      user.isItanimulli = Boolean(req.body.isItanimulli);
      user.isAlly = Boolean(req.body.isAlly);
      user.isBrand = Boolean(req.body.isBrand);
      user.isCommissioner = Boolean(req.body.isCommissioner);
      user.isViewer = Boolean(req.body.isViewer);
      const updatedUser = await user.save();
      res.status(200).send({
        message: 'User Updated',
        user: updatedUser
      });
    } else {
      res.status(404).send({
        message: 'User Not found'
      });
    }
  })
);


export default itanimulliRouter;
