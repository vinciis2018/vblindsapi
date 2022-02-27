import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import userCtrl from '../controllers/userCtrl.js';
import verifyCtrl from '../controllers/verifyCtrl.js';
import data from '../data.js';
import { generateToken, isItanimulli, isAuth } from '../utils.js';
import Asset from '../models/assetModel.js';
import Screen from '../models/screenModel.js';
import Channel from '../models/channelModel.js';
import Shop from '../models/shopModel.js';
import Film from '../models/filmModel.js';
import Item from '../models/itemModel.js';
import Video from '../models/videoModel.js'
import walletCtrl from '../controllers/walletCtrl.js';
import smartContractInteraction from '../smartContractInteraction.js';





const userRouter = express.Router();

// signup
userRouter.post('/register', userCtrl.register)
userRouter.post('/activation', userCtrl.activateEmail)
userRouter.post('/refresh_token', userCtrl.getAccessToken)


// signin
userRouter.post('/login', userCtrl.login)

userRouter.post('/forgot', userCtrl.forgotPassword)
userRouter.post('/reset', isAuth, userCtrl.resetPassword)

// Social Login
userRouter.post('/google_login', userCtrl.googleLogin)

// OTP SMS number validate
userRouter.get('/getCode', isAuth, verifyCtrl.getCode)

// OTP SMS verification
userRouter.get('/verifyCode', isAuth, verifyCtrl.verifyCode)


// signin
userRouter.post(
  '/signin',
  expressAsyncHandler(async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      console.log("1", user);
      if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          return res.status(200).send({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isItanimulli: user.isItanimulli,
            isMaster: user.isMaster,
            isAlly: user.isAlly,
            isBrand: user.isBrand,
            isCommissioner: user.isCommissioner,
            isViewer: user.isViewer,

            defaultWallet: user.defaultWallet,
            wallets: user.wallets,

            assets: user.assets,
            assetsSubscribed: user.assetsSubscribed,
            assetsLiked: user.assetsLiked,
            assetsFlagged: user.assetsFlagged,
            screens: user.screens,
            screensSubscribed: user.screensSubscribed,
            screensLiked: user.screensLiked,
            screensFlagged: user.screensFlagged,
            videos: user.videos,
            videosLiked: user.videosLiked,
            videosFlagged: user.videosFlagged,
            videosViewed: user.videosViewed,


            pleasMade: user.pleasMade,
            alliedScreens: user.alliedScreens,

            channels: user.channels,
            channelsSubscribed: user.channelsSubscribed,
            channelsLiked: user.channelsLiked,
            channelsFlagged: user.channelsFlagged,
            films: user.films,
            filmsLiked: user.filmsLiked,
            filmsFlagged: user.filmsFlagged,
            filmsViewed: user.filmsViewed,

            shops: user.shops,
            shopsSubsribed: user.shopsSubsribed,
            shopsLiked: user.shopsLiked,
            shopsFlagged: user.shopsFlagged,
            items: user.items,
            itemsLiked: user.itemsLiked,
            itemsFlagged: user.itemsFlagged,
            itemsbought: user.itemsBought,
            itemsViewed: user.itemsViewed,

            createdAt: user.createdAt,
            token: generateToken(user),
          });
        }
      }
      return res.status(401).send({ message: "New user, please sign up to continue" });
    } catch (error) {
      return res.send(error);
    }
  })
);

// signup user

userRouter.post(
  '/signup',
  expressAsyncHandler(async (req, res) => {
    try {
      console.log(req.body.email);
      const newUser = await User.findOne({ email: req.body.email });

      if (!newUser) {
        const user = new User({
          name: req.body.name,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 8),
        });
        const createdUser = await user.save();
        console.log('user created...');

        return res.status(200).send({
          _id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          avatar: createdUser.avatar,
          isItanimulli: createdUser.isItanimulli,
          isMaster: createdUser.isMaster,
          isAlly: createdUser.isAlly,
          isBrand: createdUser.isBrand,
          isCommissioner: createdUser.isCommissioner,
          isViewer: createdUser.isViewer,
          
          defaultWallet: createdUser.defaultWallet,
          wallets: createdUser.wallets,

          assets: createdUser.assets,
          assetsSubscribed: createdUser.assetsSubscribed,
          assetsLiked: createdUser.assetsLiked,
          assetsFlagged: createdUser.assetsFlagged,
          screens: createdUser.screens,
          screensSubscribed: createdUser.screensSubscribed,
          screensLiked: createdUser.screensLiked,
          screensFlagged: createdUser.screensFlagged,
          videos: createdUser.videos,
          videosLiked: createdUser.videosLiked,
          videosFlagged: createdUser.videosFlagged,
          videosViewed: createdUser.videosViewed,

          pleasMade: createdUser.pleasMade,
          alliedScreens: createdUser.alliedScreens,

          channels: createdUser.channels,
          channelsSubscribed: createdUser.channelsSubscribed,
          channelsLiked: createdUser.channelsLiked,
          channelsFlagged: createdUser.channelsFlagged,
          films: createdUser.films,
          filmsLiked: createdUser.filmsLiked,
          filmsFlagged: createdUser.filmsFlagged,
          filmsViewed: createdUser.filmsViewed,

          shops: createdUser.shops,
          shopsSubsribed: createdUser.shopsSubsribed,
          shopsLiked: createdUser.shopsLiked,
          shopsFlagged: createdUser.shopsFlagged,
          items: createdUser.items,
          itemsLiked: createdUser.itemsLiked,
          itemsFlagged: createdUser.itemsFlagged,
          itemsbought: createdUser.itemsBought,
          itemsViewed: createdUser.itemsViewed,

          createdAt: createdUser.createdAt,
          token: generateToken(createdUser),
        });
      }
      return res.status(401).send({
        message: 'mail already in use, try different email'
      });
    } catch (error) {
      return res.status(404).send(error);
    };
  })
);


// top-Masters

userRouter.get(
  '/top-masters',
  expressAsyncHandler(async (req, res) => {
    const topMasters = await User.find({
      isMaster: true
    })
      .sort({ 'master.rating': -1 })
      .limit(3);
    res.status(200).send(topMasters);
  })
);

// top-Allies

userRouter.get(
  '/top-allies',
  expressAsyncHandler(async (req, res) => {
    const topAllies = await User.find({
      isAlly: true
    })
      .sort({ 'ally.rating': -1 })
      .limit(5);
    res.status(200).send(topAllies);
  })
);

// top Brands

userRouter.get(
  '/top-brands',
  expressAsyncHandler(async (req, res) => {
    const topBrands = await User.find({
      isAlly: true
    })
      .sort({ 'brand.rating': -1 })
      .limit(7);
    res.status(200).send(topBrands);
  })
);

// seed data

userRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    const createdUsers = await User.insertMany(data.users);
    res.status(200).send({ createdUsers });
  })
);

// user default wallet

userRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      return res.status(200).send({user});
    } else {
      return res.status(404).send({ message: 'User not found' });
    }
  })
);

// user profile update

userRouter.put(
  '/profile',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.avatar = req.body.avatar || user.avatar;
      user.address = req.body.address || user.address;
      user.districtCity = req.body.districtCity || user.districtCity;
      user.municipality = req.body.municipality || user.municipality;
      user.pincode = req.body.pincode || user.pincode;
      user.stateUt = req.body.stateUt || user.stateUt;
      user.country = req.body.country || user.country;

      if (user.isMaster) {
        user.master.name = req.body.masterName || user.master.name;
        user.master.logo = req.body.masterLogo || user.master.logo;
        user.master.description = req.body.masterDescription || user.master.description;
      }
      if (user.isAlly) {
        user.ally.name = req.body.allyName || user.ally.name;
        user.ally.logo = req.body.allyLogo || user.ally.logo;
        user.ally.description = req.body.allyDescription || user.ally.description;
        user.ally.perHrHiring = req.body.allyPerHrHiring || user.ally.perHrHiring;
      }
      if (user.isBrand) {
        user.brand.name = req.body.brandName || user.brand.name;
        user.brand.logo = req.body.brandLogo || user.brand.logo;
        user.brand.description = req.body.brandDescription || user.brand.description;
      }
      if (user.isCommissioner) {
        user.commissioner.name = req.body.commissionerName || user.commissioner.name;
        user.commissioner.logo = req.body.commissionerLogo || user.commissioner.logo;
        user.commissioner.description = req.body.commissionerDescription || user.commissioner.description;
      }

      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }
      const updatedUser = await user.save();
      res.status(200).send({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        address: updatedUser.address,
        districtCity: updatedUser.districtCity,
        municipality: updatedUser.municipality,
        pincode: updatedUser.pincode,
        stateUt: updatedUser.stateUt,
        country: updatedUser.country,
        isItanimulli: updatedUser.isItanimulli,
        isMaster: user.isMaster,
        isAlly: user.isAlly,
        isBrand: user.isBrand,
        isCommissioner: user.isCommissioner,

        defaultWallet: updatedUser.defaultWallet,
        wallets: updatedUser.wallets,
        assets: updatedUser.assets,
        assetsSubscribed: updatedUser.assetsSubscribed,
        assetsLiked: updatedUser.assetsLiked,
        assetsFlagged: updatedUser.assetsFlagged,
        screens: updatedUser.screens,
        screensSubscribed: updatedUser.screensSubscribed,
        screensLiked: updatedUser.screensLiked,
        screensFlagged: updatedUser.screensFlagged,
        videos: updatedUser.videos,
        videosLiked: updatedUser.videosLiked,
        videosFlagged: updatedUser.videosFlagged,
        videosViewed: updatedUser.videosViewed,

        pleasMade: updatedUser.pleasMade,
        alliedScreens: updatedUser.alliedScreens,

        channelsSubscribed: updatedUser.channelsSubscribed,
        channels: updatedUser.channels,
        shopsSubscribed: updatedUser.shopsSubscribed,
        shops: updatedUser.shops,

        createdAt: user.createdAt,
        token: generateToken(updatedUser),
      });
    }
  })
);

// get users list
userRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    return res.status(200).send(users);
  })
);

//  user delete
userRouter.delete(
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
userRouter.put(
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
      user.pleasMade = req.body.pleasMade || user.pleasMade;
      user.alliedScreens = req.body.alliedScreens || user.alliedScreens;
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


// master asset list
userRouter.get(`/:id/myAssets`, isAuth, async (req, res) => {
  try {
    const myAssets = await Asset.find({ master: req.user._id });
    if (myAssets)
      return res.status(200).send(myAssets);
    else
      return res.status(401).send({ message: "Assets not found" });
  } catch (error) {
    return res.send(error);
  }
})

// master screen list
userRouter.get(`/:id/myScreens`, isAuth, async (req, res) => {
  try {
    const myScreens = await Screen.find({ master: req.user._id });
    if (myScreens)
      return res.status(200).send(myScreens);
    else
      return res.status(401).send({ message: "Screens not found" });
  } catch (error) {
    return res.send(error);
  }
})


// master video list
userRouter.get(`/:id/myVideos`, isAuth, async (req, res) => {
  try {
    const myVideos = await Video.find({ uploader: req.user._id });
    if (myVideos)
      return res.status(200).send(myVideos);
    else
      return res.status(401).send({ message: "Videos not found" });
  } catch (error) {
    return res.send(error);
  }
})


// ally channel list
userRouter.get(`/:id/myChannels`, isAuth, async (req, res) => {
  try {
    const myChannels = await Channel.find({ ally: req.user._id });
    if (myChannels)
      return res.status(200).send(myChannels);
    else
      return res.status(401).send({ message: "Channels not found" });
  } catch (error) {
    return res.send(error);
  }
})


// ally film list
userRouter.get(`/:id/myFilms`, isAuth, async (req, res) => {
  try {
    const myFilms = await Film.find({ uploader: req.user._id });
    if (myFilms)
      return res.status(200).send(myFilms);
    else
      return res.status(401).send({ message: "Films not found" });
  } catch (error) {
    return res.send(error);
  }
})

// brand shop list
userRouter.get(`/:id/myShops`, isAuth, async (req, res) => {
  try {
    const myShops = await Shop.find({ brand: req.user._id });
    if (myShops)
      return res.status(200).send(myShops);
    else
      return res.status(401).send({ message: "Shops not found" });
  } catch (error) {
    return res.send(error);
  }
})

// brand item list
userRouter.get(`/:id/myItems`, isAuth, async (req, res) => {
  try {
    const myItems = await Item.find({ uploader: req.user._id });
    if (myItems)
      return res.status(200).send(myItems);
    else
      return res.status(401).send({ message: "Items not found" });
  } catch (error) {
    return res.send(error);
  }
})






export default userRouter;