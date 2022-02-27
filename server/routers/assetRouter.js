import express from 'express';
import mongoose from 'mongoose';
import expressAsyncHandler from 'express-async-handler';

import Asset from '../models/assetModel.js';
import Screen from '../models/screenModel.js';
import data from '../data.js';
import User from '../models/userModel.js';
import { isItanimulli, isAuth, isItanimulliOrMaster } from '../utils.js';
import Video from '../models/videoModel.js';
import Wallet from '../models/walletModel.js';
import Calender from '../models/calenderModel.js';
import assetGameCtrl from '../controllers/assetGameCtrl.js';

const assetRouter = express.Router();

// top asset adverts
assetRouter.get(
  '/top-adverts',
  expressAsyncHandler(async (req, res) => {
    const topAdverts = await Advert.find({
      isMaster: true
    })
      .sort({ 'master.rating': -1 })
      .limit(3);
    res.send(topMasters);
  })
);


assetRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const pageSize = 6;
    const page = Number(req.query.pageNumber) || 1;
    const name = req.query.name || '';
    const category = req.query.category || '';
    const master = req.query.master || '';
    const plea = req.query.plea || '';
    const min =
      req.query.min && Number(req.query.min) !== 0 ? Number(req.query.min) : 0;
    const max =
      req.query.max && Number(req.query.max) !== 0 ? Number(req.query.max) : 0;
    const rating =
      req.query.rating && Number(req.query.rating) !== 0
        ? Number(req.query.rating)
        : 0;

    const nameFilter = name ? { name: { $regex: name, $options: 'i' } } : {};
    const masterFilter = master ? { master } : {};
    const categoryFilter = category ? { category } : {};
    const costPerSlotFilter = min && max ? { costPerSlot: { $gte: min, $lte: max } } : {};
    const ratingFilter = rating ? { rating: { $gte: rating } } : {};

    const sortPlea =
      plea === 'lowest'
        ? { costPerSlot: 1 }
        : plea === 'highest'
          ? { costPerSlot: -1 }
          : plea === 'toprated'
            ? { rating: -1 }
            : { _id: -1 };

    const countDocuments = await Asset.countDocuments({  //counting replaced in place of count from amazona tutorial [different from item=count]
      ...masterFilter,
      ...nameFilter,
      ...categoryFilter,
      ...costPerSlotFilter,
      ...ratingFilter,
    });

    const assets = await Asset.find({
      ...masterFilter,
      ...nameFilter,
      ...categoryFilter,
      ...costPerSlotFilter,
      ...ratingFilter,
    })
      .populate('master', 'master.name master.logo')
      .sort(sortPlea)
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.send({ assets, page, pages: Math.ceil(countDocuments / pageSize) });
  })
);


assetRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const assetCategories = await Asset.find().distinct('assetCategory');
    res.send(assetCategories);
  })
);

assetRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    const master = await User.findOne({ isMaster: true });
    if (master) {
      const assets = data.assets.map((asset) => ({
        ...asset,
        master: master._id,
      }));
      const createdAssets = await Asset.insertMany(assets);
      res.send({ createdAssets });
    } else {
      res.status(500).send({
        message: 'No master found. first run /api/users/seed'
      });
    }
  })
);


assetRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id).populate(
      'master',
      'master.name master.logo master.rating master.numReviews master.description'
    );
    if (asset) {
      res.send(asset);
    } else {
      res.status(404).send({ message: 'Asset Not Found in Database' });
    }
  })
);


assetRouter.post(
  '/',
  isAuth,
  isItanimulliOrMaster,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const calenderId = new mongoose.Types.ObjectId();
    const videoId = new mongoose.Types.ObjectId();
    const screenId = new mongoose.Types.ObjectId();
    const assetId = new mongoose.Types.ObjectId();
    try {

      const calender = new Calender({
        _id: calenderId,
        screen: screenId,
        screenName: req.body.name,
        slotDetails: [],
        createdOn: Date.now(),
      });
      console.log("calender", calender._id);
      await calender.save();

      const video = new Video({
        _id: videoId,
        uploader: req.user._id,
        uploaderName: req.user.name,
        description: "Steve Jobs Speech Motivation",
        reviews: [],
        numReviews: 0,
        views: 0,
        rating: 0,
        likedBy: [],
        screen: screenId,

        video: "https://nnv6aulakgabuixgo4uez2vofiydprpyav3sucsyozx4ppxivkqa.arweave.net/a2vgUWBRgBoi5ncoTOquKjA3xfgFdyoKWHZvx77oqqA",
        title: "Best Motivational Advert.mp4",
        thumbnail: "https://rvvb2ge2m7vhxm4yhlfhno4sabrw4l3g2avqptflurgdwgltpa6q.arweave.net/jWodGJpn6nuzmDrKdruSAGNuL2bQKwfMq6RMOxlzeD0",
        viewedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(video._id);
      const createdScreenVideo = await video.save();

      const screen = new Screen({
        _id: screenId,
        name: 'sample name' + Date.now() || req.body.name,
        master: req.user._id,
        image: 'https://t4.ftcdn.net/jpg/04/21/03/43/360_F_421034341_K4rQMuveqTwinJmrOPDDa4UAhurbZazk.jpg' || req.body.image,

        screenAddress: 'address' || req.body.screenAddress,
        districtCity: 'district/city' || req.body.districtCity,
        stateUT: 'state/UT' || req.body.stateUT,
        country: 'country' || req.body.country,

        category: 'WEB_SCREEN' || req.body.screenCategory,
        screenType: 'TOP_HORIZONTAL' || req.body.screenType,

        rating: 0,
        numReviews: 0,
        description: 'sample description' || req.body.description,
        locationPin: "WEB_SCREEN",
        size: {
          length: 10 || req.body.screenLength,
          width: 5 || req.body.screenWidth,
          measurementUnit: req.body.measurementUnit
        },

        scWorth: req.body.scWorth,
        slotsTimePeriod: req.body.slotsTimePeriod,
        rentPerSlot: req.body.rentPerSlot,

        allies: [],
        pleas: [],
        videos: [video],
        subscribers: [],
        likedBy: [],
        flaggedBy: [],
        calender: calender,
        asset: assetId,
        allyUploads: [],
        reviews: [],
        screenTags: ["blinds", "vinciis"]
      });
      console.log(screen._id);
      const createdScreen = await screen.save();

      const asset = new Asset({
        _id: assetId,
        name: 'sample name' + Date.now() || req.body.name,
        master: req.user._id,
        image: 'https://t4.ftcdn.net/jpg/04/21/03/43/360_F_421034341_K4rQMuveqTwinJmrOPDDa4UAhurbZazk.jpg' || req.body.image,
        link: 'https://blindsab.herokuapp.com' || req.body.link,

        address: 'address' || req.body.assetAddress,
        country: 'country' || req.body.country,

        category: 'PORTFOLIO_WEB' || req.body.assetCategory,
        rating: 0,
        numReviews: 0,
        description: 'sample description' || req.body.description,
        assetWorth: req.body.assetWorth,
        screens: [screen],
        likedBy: [],
        flaggedBy: [],
        reviews: [],
        assetTags: ["blinds", "vinciis", "arweave", "koii"]
      });
      console.log(asset._id);
      const createdAsset = await asset.save();

      await user.videos.push(video);
      await user.screens.push(screen);
      await user.assets.push(asset);
      await user.save();

      return res.status(200).send({ 
        message: 'Asset & Advert List Created', 
        asset: createdAsset, 
        screen: createdScreen,
        video: createdScreenVideo 
      });

    } catch (error) {
      console.log(error);
      return res.status(404).send( error);
    }
  })
);


assetRouter.put(
  '/:id',
  isAuth,
  isItanimulliOrMaster,
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.id;
    const asset = await Asset.findById(assetId);
    const user = await User.findById(asset.master)

    try {
      const masterAsset = user.assets.filter(asset => asset._id.toString() === assetId);

      if(masterAsset) {
        asset.name = req.body.name || asset.name;
        asset.image = req.body.image || asset.image;
        asset.link = req.body.link || asset.link;
        asset.category = req.body.assetCategory || asset.category;
        asset.assetWorth = req.body.assetWorth || asset.assetWorth; 
        asset.description = req.body.description || asset.description;
        asset.address = req.body.assetAddress || asset.address;
        asset.country = req.body.country || asset.country;
        asset.assetTags = req.body.assetTags || asset.assetTags;

        const updatedAsset = await asset.save();
        return res.status(200).send({ 
          message: 'Asset Updated', 
          asset : updatedAsset
        });
      } else {
        return res.status(404).send({ message: 'Asset Not Found' });
      }
    } catch (error) {
      console.log(error);
      return res.status(404).send(error);
    }
  })
);

assetRouter.post(
  '/:id/createScreen',
  isAuth,
  isItanimulliOrMaster,
  expressAsyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);
    const user = await User.findById(asset.master)
    const calenderId = new mongoose.Types.ObjectId();
    const videoId = new mongoose.Types.ObjectId();
    const screenId = new mongoose.Types.ObjectId();

    try {
      const calender = new Calender({
        _id: calenderId,
        screen: screenId,
        screenName: req.body.name,
        slotDetails: [],
        createdOn: Date.now(),
      });
      console.log("calender", calender._id);
      await calender.save();


      const video = new Video({
        _id: videoId,
        uploader: req.user._id,
        uploaderName: req.user.name,
        description: "Steve Jobs Speech Motivation",
        reviews: [],
        numReviews: 0,
        views: 0,
        rating: 0,
        likedBy: [],
        flaggedBy: [],
        screen: screenId,
        video: "https://nnv6aulakgabuixgo4uez2vofiydprpyav3sucsyozx4ppxivkqa.arweave.net/a2vgUWBRgBoi5ncoTOquKjA3xfgFdyoKWHZvx77oqqA",

        title: "Best Motivational Video.mp4",
        thumbnail: "https://rvvb2ge2m7vhxm4yhlfhno4sabrw4l3g2avqptflurgdwgltpa6q.arweave.net/jWodGJpn6nuzmDrKdruSAGNuL2bQKwfMq6RMOxlzeD0",
        viewedBy: [],
        reviews: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log("video", video._id);
      await video.save();


      const screen = new Screen({
        _id: screenId,
        name: 'sample name' + Date.now() || req.body.name,
        master: req.user._id,
        image: 'https://t4.ftcdn.net/jpg/04/21/03/43/360_F_421034341_K4rQMuveqTwinJmrOPDDa4UAhurbZazk.jpg' || req.body.image,

        screenAddress: 'address' || req.body.screenAddress,
        districtCity: 'district/city' || req.body.districtCity,
        stateUT: 'state/UT' || req.body.stateUT,
        country: 'country' || req.body.country,

        category: 'DOOH_SCREEN' || req.body.screenCategory,
        screenType: 'TOP_HORIZONTAL' || req.body.screenType,

        rating: 0,
        numReviews: 0,
        description: 'sample description' || req.body.description,
        locationPin: "WEB_SCREEN",
        size: {
          length: 10 || req.body.screenLength,
          width: 5 || req.body.screenWidth,
          measurementUnit: req.body.measurementUnit
        },

        scWorth: req.body.scWorth,
        slotsTimePeriod: req.body.slotsTimePeriod,
        rentPerSlot: req.body.rentPerSlot,

        allies: [],
        pleas: [],
        videos: [video],
        subscribers: [],
        likedBy: [],
        flaggedBy: [],
        calender: calender,
        allyUploads: [],
        reviews: [],
        screenTags: ["blinds", "vinciis"]
      });
      console.log(screen._id);
      await screen.save();

      await user.videos.push(video);
      await user.screens.push(screen);
      await user.save();

      await asset.screens.push(screen);
      await asset.save();

      return res.status(200).send({ 
        message: 'Screen & Video List Created', 
        screen, 
        asset
      });
    } catch (error) {
      console.log(error);
      return res.status(404).send(error);
    }

  })
)


assetRouter.delete(
  '/:id',
  isAuth,
  isItanimulliOrMaster,
  expressAsyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);

    if (asset) {

      console.log('yes');
      const deleteAsset = asset.remove();

      res.status(200).send({
        message: 'Asset Deleted',
        asset: deleteAsset
      });

    } else {
      res.status(404).send({ message: 'Screeen Not Found' });
    };

  })
);


assetRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.id;
    const asset = await Asset.findById(assetId);
    if (asset) {
      if (asset.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      asset.reviews.push(review);
      asset.numReviews = asset.reviews.length;
      asset.rating =
        asset.reviews.reduce((a, c) => c.rating + a, 0) /
        asset.reviews.length;

      const updatedAsset = await asset.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedAsset.reviews[updatedAsset.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: 'Asset Not Found' });
    }
  })
);


// screen related
assetRouter.get(`/:id/myscreens`, isAuth, async (req, res) => {
  const assetId = req.params.id;
  console.log("for asset screens", assetId);
  try {
    const myAssetScreens = await Screen.find({ asset: assetId });
    if (myAssetScreens)
      return res.status(200).send(myAssetScreens);
    else
      return res.status(401).send({ message: "Adverts not found" });
  } catch (error) {
    return res.send(error.message);
  }
})

// upload asset adverts

assetRouter.post(
  '/:id/uploadAdvert',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.id;
    console.log("from backend", req.params.id);
    const assetAdvert = await Asset.findById(assetId);

    if (assetId) {
      console.log("after from backend", assetId);
      // res.send(asset);

      try {
        const userAdvert = await User.findById(req.user._id);

        if (userAdvert) {
          // console.log(userAdvert);
 
          const advert = new Advert({
            title: req.body.title,
            description: req.body.description,
            advert: req.body.advert,
            // duration: duration,
            thumbnail: req.body.thumbnail,
            uploader: req.user._id,
            asset: req.params.id,
            uploaderName: req.user.name,

            adWorth: req.body.adWorth,
            adBudget: req.body.adBudget,
            expectedViews: req.body.expectedViews,

            hrsToComplete: req.body.hrsToComplete,

          })
          console.log(advert);
          const newAdvert = await advert.save();
          userAdvert.adverts.push(newAdvert._id);
          assetAdvert.adverts.push(newAdvert._id);

          await userAdvert.save();
          await assetAdvert.save();
          return res.status(200).send(newAdvert);
        }
        return res.status(401).send({ message: "user does not exist" });

      } catch (error) {
        return res.status(401).send(error);
      }
    }
    return res.status(401).send({ message: "please choose a asset first" });
  })
);


// delete asset adverts

assetRouter.delete(
  '/:id/deleteAdvert',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      const advert = await Advert.findById(req.params.id);
      console.log(advert._id);

      if (advert) {

        const assetId = advert.asset._id;
        const uploaderId = advert.uploader._id;

        const advertAsset = await Asset.findById(assetId)
        const advertUploader = await User.findById(uploaderId);

        console.log('yes', advert._id);

        advertAsset.adverts.remove(advert._id);
        const deletedAdvertAsset = await advertAsset.save();
        console.log('1', deletedAdvertAsset.adverts);


        advertUploader.adverts.remove(advert._id);
        const deletedAdvertUploader = await advertUploader.save();
        console.log('2', deletedAdvertUploader.adverts);



        const deletedAdvert = await advert.remove();

        return res.status(200).send({
          message: 'Advert deleted',
          advert: deletedAdvert,
          deletedAdvertAsset,
          deletedAdvertUploader
        })

      } else {
        res.status(404).send({ message: "Advert not found" });
      }
    } catch (error) {
      return res.status(405).send({ error });
    }
  })
);


// asset like

assetRouter.post(
  '/:id/likeAsset/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.id;
    const interaction = req.params.interaction;
    const asset = await Asset.findById(assetId);
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = calender.activeGameContract;
      const kohakuReadGameContract = await kohaku.readContract(arweave, gameContract);
      const expKohakuGameContract = kohaku.exportCache();
      kohaku.importCache(arweave, expKohakuGameContract);
      const walletInGameState = kohakuReadGameContract.stakes.likeEP[walletAddress]
      if(!walletInGameState) {
        console.log("liking in gameState")
        const reqAssetGamePlayData = {
          req,
          asset,
          interaction
        }
        const result = await assetGameCtrl.assetGamePlay(reqAssetGamePlayData);
        console.log("liked in game state", result);
      }
      if(!asset.likedBy.includes(req.user._id) && !user.assetsLiked.includes(asset._id)) {
        user.assetsLiked.push(asset._id);
        await user.save();
        console.log('liked in user db')
        asset.likedBy.push(req.user._id);
        await asset.save();
        console.log('liked in asset db')
      }
      return res.status(200).send({ 
        message: 'like game played',
        asset: asset, 
      });
    } catch (error) {
      return res.send(error);
    }
  })
)

// asset unlike

assetRouter.delete(
  '/:id/likeAsset',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.id;
    const asset = await Asset.findById(assetId);
    const user = await User.findById(req.user._id)
    try {
      console.log("Unliking now")
      if (asset.likedBy.includes(user._id) && user.assetsLiked.includes(asset._id)) {
        user.assetsLiked.remove(asset._id);
        await user.save();
        console.log('unliked from user db')
        asset.likedBy.remove(req.user._id);
        const asset = await asset.save();
        console.log('unliked from asset db')
        return res.status(200).send(asset);
      } else {
        return res.status(401).send('You already do not like this asset');
      }
    } catch (error) {
      return res.send(error);
    }
  })
)

// asset flag 
assetRouter.post(
  '/:id/flagAsset/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const assetId = req.params.id;
    const interaction = req.params.interaction;
    const asset = await Asset.findById(assetId);
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = calender.activeGameContract;
      const kohakuReadGameContract = await kohaku.readContract(arweave, gameContract);
      const expKohakuGameContract = kohaku.exportCache();
      kohaku.importCache(arweave, expKohakuGameContract);
      const walletInGameState = kohakuReadGameContract.stakes.flagEP[walletAddress]
      if(!walletInGameState) {
        console.log("flagging in gameState")
        const reqAssetGamePlayData = {
          req,
          asset,
          interaction
        }
        const result = await assetGameCtrl.assetGamePlay(reqAssetGamePlayData);
        console.log("flagged in game state", result);
      }
      if (!asset.flaggedBy.includes(req.user._id) && !user.assetsFlagged.includes(asset._id)) {

        user.assetsFlagged.push(asset._id);
        await user.save();
        console.log('flagged in user db')

        asset.flaggedBy.push(req.user._id);
        await asset.save();
        console.log('flagged in asset db')

        return res.status(200).send({
          message: 'flag game played',
          asset: asset, 
        });
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)


// asset worth
assetRouter.get(
  '/:id/assetParams',
  expressAsyncHandler(async (req, res) => {
    const asset = await Asset.findById(req.params.id);
    req = { timeHere: new Date().toLocaleTimeString([], { hour12: false }) }
    console.log("req", req)
    try {
      const reqGetAssetParams = {
        req, asset,
      }
      const result = await assetGameCtrl.getAssetParams(reqGetAssetParams);
      return res.status(200).send(result);
    } catch (error) {
			console.error(error);
      return res.status(404).send(error);
    }
  })
)



export default assetRouter;