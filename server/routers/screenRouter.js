import express from 'express';
import mongoose from 'mongoose';
import expressAsyncHandler from 'express-async-handler';
import kohaku from '@_koi/kohaku';

import Screen from '../models/screenModel.js';
import data from '../data.js';
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';

import { isItanimulli, isAuth, isItanimulliOrMaster } from '../utils.js';
import Video from '../models/videoModel.js';
import Pin from '../models/pinModel.js';
import Calender from '../models/calenderModel.js';
import Plea from '../models/pleaModel.js';
import screenGameCtrl from '../controllers/screenGameCtrl.js';
import { readContract } from '../helpers/smartContractIntreract.js';



const screenRouter = express.Router();

// top screen videos
screenRouter.get(
  '/top-videos',
  expressAsyncHandler(async (req, res) => {
    const topVideos = await Video.find({
      isMaster: true
    })
      .sort({ 'master.rating': -1 })
      .limit(3);
    res.send(topMasters);
  })
);


screenRouter.get(
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

    const countDocuments = await Screen.countDocuments({  //counting replaced in place of count from amazona tutorial [different from item=count]
      ...masterFilter,
      ...nameFilter,
      ...categoryFilter,
      ...costPerSlotFilter,
      ...ratingFilter,
    });

    const screens = await Screen.find({
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
    res.send({ screens, page, pages: Math.ceil(countDocuments / pageSize) });
  })
);


screenRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const screenCategories = await Screen.find().distinct('screenCategory');
    res.send(screenCategories);
  })
);

screenRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    const master = await User.findOne({ isMaster: true });
    if (master) {
      const screens = data.screens.map((screen) => ({
        ...screen,
        master: master._id,
      }));
      const createdScreens = await Screen.insertMany(screens);
      res.send({ createdScreens });
    } else {
      res.status(500).send({
        message: 'No master found. first run /api/users/seed'
      });
    }
  })
);


screenRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const screen = await Screen.findById(req.params.id).populate(
      'master',
      'master.name master.logo master.rating master.numReviews master.description'
    );
    if (screen) {
      res.status(200).send(screen);
    } else {
      res.status(404).send({ message: 'Screen Not Found in Database' });
    }
  })
);

screenRouter.get(
  '/:id/pin',
  expressAsyncHandler(async (req, res) => {
    const screen = await Screen.findById(req.params.id).populate();
    const pinId = screen.locationPin;
    const pin = await Pin.findById(pinId);
    try {
      return res.status(200).send(pin);
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)


screenRouter.post(
  '/',
  isAuth,
  isItanimulliOrMaster,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const calenderId = new mongoose.Types.ObjectId();
    const pinId = new mongoose.Types.ObjectId();
    const videoId = new mongoose.Types.ObjectId();
    const screenId = new mongoose.Types.ObjectId();
    try {

      const calender = new Calender({
        _id: calenderId,
        screen: screenId,
        screenName: req.body.name,
        slotDetails: [],
        dayDetails: [],
        createdOn: Date.now(),
      });
      console.log("calender", calender._id);
      const calenderAdded = await calender.save();

      const pin = new Pin({
        _id: pinId,
        category: 'screen',
        screen: screenId,
        screenPin: true,
        user: req.user._id,
        lat: 25.26 || req.body.locationPin.lat,
        lng: 82.98 || req.body.locationPin.lng,
      });
      console.log("pin", pin._id);
      const pinAdded = await pin.save();

      const video = new Video({
        _id: videoId,
        uploader: req.user._id,
        uploaderName: req.user.name,
        description: "Demo screen video",
        reviews: [],
        numReviews: 0,
        views: 0,
        rating: 0,
        likedBy: [],
        flaggedBy: [],
        screen: screenId,
        video: "https://nnv6aulakgabuixgo4uez2vofiydprpyav3sucsyozx4ppxivkqa.arweave.net/a2vgUWBRgBoi5ncoTOquKjA3xfgFdyoKWHZvx77oqqA",

        title: "Demo_video.mp4",
        thumbnail: "https://rvvb2ge2m7vhxm4yhlfhno4sabrw4l3g2avqptflurgdwgltpa6q.arweave.net/jWodGJpn6nuzmDrKdruSAGNuL2bQKwfMq6RMOxlzeD0",
        viewedBy: [],
        reviews: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log("video", video._id);
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

        category: 'DOOH_SCREEN' || req.body.screenCategory,
        screenType: 'TOP_HORIZONTAL' || req.body.screenType,

        rating: 0,
        numReviews: 0,
        description: 'sample description' || req.body.description,
        locationPin: pinId,
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
      const createdScreen = await screen.save();

      await user.videos.push(video);
      await user.screens.push(screen);
      await user.save();

      return res.status(200).send({ 
        message: 'Screen & Video Created', 
        screen: createdScreen, 
        video: createdScreenVideo, 
        pin: pinAdded,
        calender: calenderAdded,
      });

    } catch (error) {
      console.error(error);
      return res.status(401).send('screen router error', error);
    }
  })
);


screenRouter.put(
  '/:id',
  isAuth,
  isItanimulliOrMaster,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    const screen = await Screen.findById(screenId);
    const user = await User.findById(screen.master);
    const calender = await Calender.findOne({ screen: screenId });

    try {
    
      const masterScreen = user.screens.filter(screen => screen._id.toString() === screenId);

      if (calender && masterScreen) {
        console.log("hejhaej")
        screen.name = req.body.name || screen.name;
        screen.rentPerSlot = req.body.rentPerSlot || screen.rentPerSlot;
        screen.image = req.body.image || screen.image;
        screen.category = req.body.screenCategory || screen.category;
        screen.screenType = req.body.screenType || screen.screenType;

        screen.scWorth = req.body.screenWorth || screen.scWorth;
        screen.slotsTimePeriod = req.body.slotsTimePeriod || screen.slotsTimePeriod;
        screen.description = req.body.description || screen.description;
        screen.size.length = req.body.screenLength || screen.size.length;
        screen.size.width = req.body.screenWidth || screen.size.width;
        screen.size.measurementUnit = req.body.measurementUnit || screen.size.measurementUnit;
        screen.screenAddress = req.body.screenAddress || screen.screenAddress;
        screen.districtCity = req.body.districtCity || screen.districtCity;
        screen.stateUT = req.body.stateUT || screen.stateUT;
        screen.country = req.body.country || screen.country;
        screen.calender = calender._id || screen.calender;
        screen.screenTags = req.body.screenTags || screen.screenTags;

        calender.slotTP = req.body.slotsTimePeriod || screen.slotsTimePeriod; 
        calender.screenName = req.body.name || screen.name;
        const updatedCalender = await calender.save();
        const updatedScreen = await screen.save();
        console.log("hej dsaf sdfsda haej")
  
        return res.status(200).send({ 
          message: 'Screen Updated', 
          screen: updatedScreen, 
          calender: updatedCalender
        });
      } else {
        return res.status(404).send({ message: 'user is not the master or no pin or calender found' })
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
);


screenRouter.delete(
  '/:id',
  isAuth,
  isItanimulliOrMaster,
  expressAsyncHandler(async (req, res) => {
    const screen = await Screen.findById(req.params.id);

    if (screen) {

      const screenPin = screen.locationPin;
      console.log("screenPin");
      const screenCalender = screen.calender;
      console.log("screenCalender");

      const deleteScreen = screen.remove();
      const pin = await Pin.findByIdAndRemove(screenPin);
      const calender = await Calender.findByIdAndRemove(screenCalender);
      console.log('yes');

      return res.status(200).send({
        message: 'Screen Deleted',
        screen: deleteScreen,
        pin: pin,
        calender: calender
      });

    } else {
      return res.status(404).send({ message: 'Screeen Not Found' });
    };

  })
);


screenRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    const screen = await Screen.findById(screenId);
    if (screen) {
      if (screen.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      screen.reviews.push(review);
      screen.numReviews = screen.reviews.length;
      screen.rating =
        screen.reviews.reduce((a, c) => c.rating + a, 0) /
        screen.reviews.length;

      const updatedScreen = await screen.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedScreen.reviews[updatedScreen.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: 'Screen Not Found' });
    }
  })
);


// my screen Videos
screenRouter.get(`/:id/myvideos`, 
expressAsyncHandler( async (req, res) => {
  const screenId = req.params.id;
  console.log("for screen Videos", screenId);
  try {
    const myScreenVideos = await Video.find({ screen: screenId });
    if (myScreenVideos)
      return res.send(myScreenVideos);
    else
      return res.status(401).send({ message: "Videos not found" });
  } catch (error) {
    return res.send(error.message);
  }
}))


// screen Videos
screenRouter.get(
  `/:id/screenVideos`, 
  expressAsyncHandler( async (req, res) => {
    const screenId = req.params.id;
    console.log("for screen Videos", screenId);
    try {
      const myScreenVideos = await Video.find({ screen: screenId });
      if (myScreenVideos)
        return res.send(myScreenVideos);
      else
        return res.status(401).send({ message: "Videos not found" });
    } catch (error) {
      return res.send(error.message);
    }
  })
)


// upload screen videos
screenRouter.post(
  '/:id/uploadVideo',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    console.log("from backend", req.params.id);
    const screenVideo = await Screen.findById(screenId);

    if (screenId) {
      console.log("after from backend", screenId);
      // res.send(screen);

      try {
        const userVideo = await User.findById(req.user._id);

        if (userVideo) {
          // console.log(userVideo);
 
          const video = new Video({
            title: req.body.title,
            description: req.body.description,
            video: req.body.video,
            // duration: duration,
            thumbnail: req.body.thumbnail,
            uploader: req.user._id,
            screen: req.params.id,
            uploaderName: req.user.name,

            adWorth: req.body.adWorth,
            adBudget: req.body.adBudget,
            expectedViews: req.body.expectedViews,

            hrsToComplete: req.body.hrsToComplete,

          })
          console.log(video);
          const newVideo = await video.save();
          userVideo.videos.push(newVideo._id);
          screenVideo.videos.push(newVideo._id);

          await userVideo.save();
          await screenVideo.save();
          return res.status(200).send(newVideo);
        }
        return res.status(401).send({ message: "user does not exist" });

      } catch (error) {
        return res.status(401).send(error);
      }
    }
    return res.status(401).send({ message: "please choose a screen first" });
  })
);


// delete screen videos
screenRouter.delete(
  '/:id/deleteVideo',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);
      console.log(video._id);

      if (video) {

        const screenId = video.screen._id;
        const uploaderId = video.uploader._id;

        const videoScreen = await Screen.findById(screenId)
        const videoUploader = await User.findById(uploaderId);

        console.log('yes', video._id);

        videoScreen.videos.remove(video._id);
        const deletedVideoScreen = await videoScreen.save();
        console.log('1', deletedVideoScreen.videos);


        videoUploader.videos.remove(video._id);
        const deletedVideoUploader = await videoUploader.save();
        console.log('2', deletedVideoUploader.videos);



        const deletedVideo = await video.remove();

        return res.status(200).send({
          message: 'Video deleted',
          video: deletedVideo,
          deletedVideoScreen,
          deletedVideoUploader
        })

      } else {
        res.status(404).send({ message: "Video not found" });
      }
    } catch (error) {
      return res.status(404).send({ error });
    }
  })
);


// screen like

screenRouter.post(
  '/:id/likeScreen/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    const interaction = req.params.interaction;
    const screen = await Screen.findById(screenId);
    const user = await User.findById(req.user._id)
    const calender = await Calender.findOne({ screen: screenId });
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    console.log("found it all")
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = calender.activeGameContract;
      console.log(gameContract)
      const gameState = await readContract(gameContract)
      if(!(gameState.stakes.likeEP) || !(gameState.stakes.likeEP[walletAddress])) {
        console.log("liking in gameState")
        const reqScreenGamePlayData = {
          req,
          screen,
          calender,
          interaction
        }
        const result = await screenGameCtrl.screenGamePlay(reqScreenGamePlayData);
        console.log("liked in game state", result);
      }
      if(!screen.likedBy.includes(req.user._id) && !user.screensLiked.includes(screen._id)) {
        user.screensLiked.push(screen._id);
        await user.save();
        console.log('liked in user db')
        screen.likedBy.push(req.user._id);
        await screen.save();
        console.log('liked in screen db')
      }
      return res.status(200).send({ 
        message: 'like game played',
        screen: screen, 
      });
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// screen unlike

screenRouter.delete(
  '/:id/unlikeScreen',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    const screen = await Screen.findById(screenId);
    const user = await User.findById(req.user._id)
    try {
      console.log("Unliking now")
      if (screen.likedBy.includes(user._id) && user.screensLiked.includes(screen._id)) {
        user.screensLiked.remove(screen._id);
        await user.save();
        console.log('unliked from user db')
        screen.likedBy.remove(req.user._id);
        const unlikedScreen = await screen.save();
        console.log('unliked from screen db')
        return res.status(200).send(unlikedScreen);
      } else {
        return res.status(401).send('You already do not like this screen');
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// screen flag 
screenRouter.post(
  '/:id/flagScreen/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    const interaction = req.params.interaction;
    const screen = await Screen.findById(screenId);
    const user = await User.findById(req.user._id)
    const calender = await Calender.findOne({ screen: screenId });
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = calender.activeGameContract;
      const gameState = await readContract(gameContract)
      const walletInGameState = gameState.stakes.flagEP[walletAddress]
      if(!walletInGameState) {
        console.log("flagging in gameState")
        const reqScreenGamePlayData = {
          req,
          screen,
          calender,
          interaction
        }
        const result = await screenGameCtrl.screenGamePlay(reqScreenGamePlayData);
        console.log("flagged in game state", result);
      }
      if (!screen.flaggedBy.includes(req.user._id) && !user.screensFlagged.includes(screen._id)) {

        user.screensFlagged.push(screen._id);
        await user.save();
        console.log('flagged in user db')

        screen.flaggedBy.push(req.user._id);
        await screen.save();
        console.log('flagged in screen db')

        return res.status(200).send({
          message: 'flag game played',
          screen: screen, 
        });
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// screen subscribe

screenRouter.post(
  '/:id/subscribeScreen/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    const interaction = req.params.interaction;
    const screen = await Screen.findById(screenId);
    const user = await User.findById(req.user._id)
    const calender = await Calender.findOne({ screen: screenId });
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = calender.activeGameContract;
      const gameState = await readContract(gameContract)
      const walletInGameState = gameState.stakes.flagEP[walletAddress]
      if(!walletInGameState) {
        console.log("subscribing state in gameState")
        const reqScreenGamePlayData = {
          req,
          screen,
          calender,
          interaction
        }
        const result = await screenGameCtrl.screenGamePlay(reqScreenGamePlayData);
        console.log("subscribed in gameState", result);
      }
      if (!screen.subscribers.includes(req.user._id) && !user.screensSubscribed.includes(screen._id)) {

        user.screensSubscribed.push(screen._id);
        await user.save();
        console.log('subscribed in user db')

        screen.subscribers.push(req.user._id);
        await screen.save();
        console.log('subscribed in screen db')
        return res.status(200).send({
          message: 'subscribe game played',
          screen: screen, 
        });
      } else {
        return res.status(401).send('You already subscribed this screen');
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// screen unsubscribe
screenRouter.delete(
  '/:id/unsubscribeScreen',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screenId = req.params.id;
    const screen = await Screen.findById(screenId);
    const user = await User.findById(req.user._id)
    try {
      console.log("Unsubscribing now")
      if (screen.subscribers.includes(user._id) && user.screensSubscribed.includes(screen._id)) {
        user.screensSubscribed.remove(screen._id);
        await user.save();
        console.log('unliked from user db')
        screen.subscribers.remove(req.user._id);
        const unsubscribedScreen = await screen.save();
        console.log('unliked from screen db')
        return res.status(200).send(unsubscribedScreen);
      } else {
        return res.status(401).send('You already do not like this screen');
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
)



// apply ally plea
screenRouter.post(
  '/:id/allyPlea/ally',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const screen = await Screen.findById(req.params.id);
    const user = await User.findById(req.user._id);
    const plea = await Plea.findOne({screen: screen._id, from: user._id, reject: false})

    try {
      if(!plea) {
        const plea = new Plea({
          _id: new mongoose.Types.ObjectId(),
          from: user,
          to: screen.master,
          screen: screen,
          pleaType: "SCREEN_ALLY_PLEA",
          content: `I would like to request an Ally plea for this ${screen._id} screen`,
          status: false,
          reject: false,
          blackList: false,
          remarks: `${user._id} has requested an Ally plea for ${screen._id} screen`,
        })
        await plea.save();
        screen.pleas[plea] ? screen.pleas.push(plea) : screen.pleas = plea;
        user.pleasMade[plea] ? user.pleasMade.push(plea) : user.pleasMade = plea;
        await screen.save();
        await user.save();
        return res.status(200).send({ message: 'Ally access plead for screen', plea });
      } else {
        return res.status(400).send({ message: 'Plea already made' });
      }
    } catch (error) {
      console.log(error)
      return res.status(404).send(error)
    }
  })
);


// give ally plea
screenRouter.put(
  '/:id/allyPlea/master',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const plea = await Plea.findById(req.params.id);
    const screen = await Screen.findById(plea.screen);
    const master = await User.findById(plea.to);
    const user = await User.findById(plea.from)
    
    try {
      const remark = `${user._id} user has been given an Ally access for ${screen._id} screen from ${master._id} user`
      console.log(screen.allies.filter((ally) => ally === user._id))
      console.log(user.alliedScreens)
      if(screen.allies.filter((ally) => ally === user._id).length === 0 && user.alliedScreens.filter((screen) => screen === screen._id).length === 0) {
        console.log("granting ally access")
        plea.status = true,
        plea.remarks.push(remark);
        screen.allies[user] ? screen.allies.push(user) : screen.allies = user;
        user.alliedScreens[user] ? user.alliedScreens.push(screen) : user.alliedScreens = screen;

        await screen.save();
        await user.save();
        await plea.save();

        return res.status(200).send(plea);
      } else {
        return res.status(400).send({ message: 'ally exist' });
      }
    } catch (error) {
      console.log(error)
      return res.status(404).send(error)
    }
  })
);

// reject ally Plea request
screenRouter.put(
  '/:id/allyPlea/reject',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const plea = await Plea.findById(req.params.id);
    const screen = await Screen.findById(plea.screen);
    const master = await User.findById(plea.to);
    const user = await User.findById(plea.from);
    try {
      const remark = `${user._id} user has been rejected an Ally access for ${screen._id} screen from ${master._id} user`
      if(screen.allies.filter((ally) => ally === user._id).length !== 0) {
        console.log("1")
        screen.allies[(user._id)].remove();
        user.alliedScreens[(screen._id)].remove();
        await screen.save();
        await user.save();
      }

      plea.status = false,
      plea.reject = true,
      plea.remarks.push(remark);
      await plea.save();
      console.log("plea rejected in screen router")

      return res.status(200).send(plea);
    } catch (error) {
      console.log(error)
      return res.status(404).send(error)
    }
  })
)

// screen worth and rent
screenRouter.get(
  '/:id/screenParams',
  expressAsyncHandler(async (req, res) => {
    const screen = await Screen.findById(req.params.id);
    const calender = await Calender.findById(screen.calender);
    req = { timeHere: new Date().toLocaleTimeString([], { hour12: false }) }
    console.log("req", req)
    try {
      const reqGetScreenParams = {
        req, screen, calender
      }
      const result = await screenGameCtrl.getScreenParams(reqGetScreenParams);
      return res.status(200).send(result);
    } catch (error) {
			console.error(error);
      return res.status(404).send(error);
    }
  })
)

export default screenRouter;