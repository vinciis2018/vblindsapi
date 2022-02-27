import express from 'express';
import mongoose from 'mongoose';
import expressAsyncHandler from 'express-async-handler';

import Channel from '../models/channelModel.js';
import data from '../data.js';
import User from '../models/userModel.js';
import { isItanimulliOrAlly, isAuth} from '../utils.js';
import Film from '../models/filmModel.js';
import Wallet from '../models/walletModel.js';
import channelGameCtrl from '../controllers/channelGameCtrl.js';
import { readContract } from '../helpers/smartContractIntreract.js';

const channelRouter = express.Router();

// top channels film

channelRouter.get(
  '/top-films',
  expressAsyncHandler(async (req, res) => {
    const topFilms = await Film.find({
      isAlly: true
    })
      .sort({ 'ally.rating': -1 })
      .limit(3);
    res.send(topAllies);
  })
);


channelRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const pageSize = 6;
    const page = Number(req.query.pageNumber) || 1;
    const name = req.query.name || '';
    const category = req.query.category || '';
    const ally = req.query.ally || '';
    const min =
      req.query.min && Number(req.query.min) !== 0 ? Number(req.query.min) : 0;
    const max =
      req.query.max && Number(req.query.max) !== 0 ? Number(req.query.max) : 0;
    const rating =
      req.query.rating && Number(req.query.rating) !== 0
        ? Number(req.query.rating)
        : 0;

    const nameFilter = name ? { name: { $regex: name, $options: 'i' } } : {};
    const allyFilter = ally ? { ally } : {};
    const categoryFilter = category ? { category } : {};
    const costPerHourFilter = min && max ? { costPerHour: { $gte: min, $lte: max } } : {};
    const ratingFilter = rating ? { rating: { $gte: rating } } : {};


    const countDocuments = await Channel.countDocuments({  //counting replaced in place of count from amazona tutorial [different from item=count]
      ...allyFilter,
      ...nameFilter,
      ...categoryFilter,
      ...costPerHourFilter,
      ...ratingFilter,
    });

    const channels = await Channel.find({
      ...allyFilter,
      ...nameFilter,
      ...categoryFilter,
      ...costPerHourFilter,
      ...ratingFilter,
    })
      .populate('ally', 'ally.name ally.logo')
      .sort()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.send({ channels, page, pages: Math.ceil(countDocuments / pageSize) });
  })
);


channelRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const channelCategories = await Channel.find().distinct('channelCategory');
    res.send(channelCategories);
  })
);

channelRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    const ally = await User.findOne({ isAlly: true });
    if (ally) {
      const channels = data.channels.map((channel) => ({
        ...channel,
        ally: ally._id,
      }));
      const createdChannels = await Channel.insertMany(channels);
      res.send({ createdChannels });
    } else {
      res.status(500).send({
        message: 'No ally found. first run /api/users/seed'
      });
    }
  })
);


channelRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const channel = await Channel.findById(req.params.id).populate(
      'ally',
      'ally.name ally.logo ally.rating ally.numReviews ally.description'
    );
    if (channel) {
      res.send(channel);
    } else {
      res.status(404).send({ message: 'Channel Not Found in Database' });
    }
  })
);


channelRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    const channelId = new mongoose.Types.ObjectId();
    try {

      const film = new Film({
        _id: new mongoose.Types.ObjectId(),
        uploader: req.user._id,
        uploaderName: req.user.name,
        description: "Steve Jobs Speech Motivation",
        reviews: [],
        numReviews: 0,
        views: 0,
        rating: 0,
        likedBy: [],
        channel: channelId,
        video: "https://nnv6aulakgabuixgo4uez2vofiydprpyav3sucsyozx4ppxivkqa.arweave.net/a2vgUWBRgBoi5ncoTOquKjA3xfgFdyoKWHZvx77oqqA",
        title: "Best Motivational Video.mp4",
        thumbnail: "https://rvvb2ge2m7vhxm4yhlfhno4sabrw4l3g2avqptflurgdwgltpa6q.arweave.net/jWodGJpn6nuzmDrKdruSAGNuL2bQKwfMq6RMOxlzeD0",
        viewedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const createdChannelFilm = await film.save();

      const channel = new Channel({
        _id: channelId,
        name: 'sample name' + Date.now(),
        ally: req.user._id,
        image: 'https://t4.ftcdn.net/jpg/04/21/03/43/360_F_421034341_K4rQMuveqTwinJmrOPDDa4UAhurbZazk.jpg',

        location: 'location',
        country: 'country',

        category: 'sample Category',
        rating: 0,
        numReviews: 0,
        description: 'sample description',
        chWorth: 0,
        films: [film],
        fans: [],
        likedBy: [],
        reviews: [],
        channelTags: ['blinds', 'vinciis']
      });

      const createdChannel = await channel.save();

      await user.films.push(film);
      await user.channels.push(channel);
      await user.save();

      return res.status(200).send({ 
        message: 'Channel & Film Created', 
        channel: createdChannel, 
        film: createdChannelFilm, 
      });
    } catch (error) {
      console.error(error);
      return res.status(401).send('channel router error', error);
        
    }
  })
);


channelRouter.put(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);
    console.log(req.body)
    try {
       
      if (channel) {
        channel.name = req.body.name || channel.name;
        channel.location = req.body.location || channel.location;
        channel.country = req.body.country || channel.country;
        channel.image = req.body.image || channel.image;
        channel.category = req.body.channelCategory || channel.category;
        channel.chWorth = req.body.channelWorth || channel.chWorth;
        channel.description = req.body.description || channel.description;
        channel.channelTags = req.body.channelTags || channel.channelTags;

        const updatedChannel = await channel.save();
        console.log(updatedChannel)
        return res.status(200).send({ message: 'Channel Updated', channel: updatedChannel });
      } else {
        return res.status(404).send({ message: 'Channel Not Found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(401).send('channel router error', error);
    }
  })
);


channelRouter.delete(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channel = await Channel.findById(req.params.id);
    const films = await Film.find({ uploader: req.user._id });
    if (channel) {
      console.log({ films });
      const deleteChannel = await channel.remove();
      res.send({
        message: 'Channel Deleted',
        channel: deleteChannel
      });
    } else {
      res.status(404).send({ message: 'Channel Not Found' });
    }
  })
);


channelRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);
    if (channel) {
      if (channel.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      channel.reviews.push(review);
      channel.numReviews = channel.reviews.length;
      channel.rating =
        channel.reviews.reduce((a, c) => c.rating + a, 0) /
        channel.reviews.length;

      const updatedChannel = await channel.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedChannel.reviews[updatedChannel.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: 'Channel Not Found' });
    }
  })
);


// Film related

channelRouter.get(
  `/:id/myfilms`, 
  isAuth, 
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    console.log("for channel Films", channelId);
    try {
      const myChannelFilms = await Film.find({ channel: channelId });
      if (myChannelFilms)
        return res.send(myChannelFilms);
      else
        return res.status(401).send({ message: "Films not found" });
    } catch (error) {
      return res.send(error.message);
    }
  })
)

// upload Channel films

channelRouter.post(
  '/:id/uploadFilm',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    console.log("from backend", req.params.id);
    const channelFilm = await Channel.findById(channelId);

    if (channelId) {
      console.log("after from backend", channelId);

      try {
        const userFilm = await User.findById(req.user._id);

        if (userFilm) {

          const film = new Film({
            title: req.body.title,
            description: req.body.description,
            video: req.body.video,
            thumbnail: req.body.thumbnail,
            uploader: req.user._id,
            channel: req.params.id,
            uploaderName: req.user.name,

          })
          console.log(film);
          const newFilm = await film.save();
          userFilm.films.push(newFilm._id);
          channelFilm.films.push(newFilm._id);

          await userFilm.save();
          await channelFilm.save();
          return res.send(newFilm);
        }
        return res.status(401).send({ message: "user does not exist" });

      } catch (error) {
        return res.send(error);
      }
    }
    return res.status(401).send({ message: "please choose a channel first" });
  })
);


// delete channel films

channelRouter.delete(
  '/:id/deleteFilm',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      const film = await Film.findById(req.params.id);
      console.log(film._id);

      if (film) {

        const channelId = film.channel._id;
        const uploaderId = film.uploader._id;

        const filmChannel = await Channel.findById(channelId)
        const filmUploader = await User.findById(uploaderId);

        console.log('yes', film._id);

        filmChannel.films.remove(film._id);
        const deletedFilmChannel = await filmChannel.save();
        console.log('1', deletedFilmChannel.films);


        filmUploader.films.remove(film._id);
        const deletedFilmUploader = await filmUploader.save();
        console.log('2', deletedFilmUploader.films);



        const deletedFilm = await film.remove();

        return res.status(200).send({
          message: 'Film deleted',
          film: deletedFilm,
          deletedFilmChannel,
          deletedFilmUploader
        })

      } else {
        res.status(404).send({ message: "Film not found" });
      }
    } catch (error) {
      return res.status(405).send({ error });
    }
  })
);


// Channel like

channelRouter.post(
  '/:id/likeChannel/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    const interaction = req.params.interaction;
    const channel = await Channel.findById(channelId);
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    console.log("found it all")
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = channel.activeGameContract;
      console.log(gameContract)
      const gameState = await readContract(gameContract)

    if(!(gameState.stakes.likeEP) || !(gameState.stakes.likeEP[walletAddress])) {
      console.log("liking in gameState")
      const reqChannelGamePlayData = {
        req,
        channel,
        interaction
      }
      const result = await channelGameCtrl.channelGamePlay(reqChannelGamePlayData);
      console.log("liked in game state", result);
    }
    if(!channel.likedBy.includes(req.user._id) && !user.channelsLiked.includes(channel._id)) {
      user.channelsLiked.push(channel._id);
      await user.save();
      console.log('liked in user db')
      channel.likedBy.push(req.user._id);
      await channel.save();
      console.log('liked in channel db')
    }
    return res.status(200).send({ 
      message: 'like game played',
      channel: channel, 
    });
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// channel unlike

channelRouter.delete(
  '/:id/unlikeChannel',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);
    const user = await User.findById(req.user._id)
    try {
      console.log("Unliking now")
      if (channel.likedBy.includes(user._id) && user.channelsLiked.includes(channel._id)) {
        user.channelsLiked.remove(channel._id);
        await user.save();
        console.log('unliked from user db')
        channel.likedBy.remove(req.user._id);
        const unlikedChannel = await channel.save();
        console.log('unliked from channel db')
        return res.status(200).send(unlikedChannel);
      } else {
        return res.status(401).send('You already do not like this channel');
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)



// channel flag 
channelRouter.post(
  '/:id/flagChannel/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    const interaction = req.params.interaction;
    const channel = await Channel.findById(channelId);
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = channel.activeGameContract;
      const gameState = await readContract(gameContract)
      const walletInGameState = gameState.stakes.flagEP[walletAddress]
      if(!walletInGameState) {
        console.log("flagging in gameState")
        const reqChannelGamePlayData = {
          req,
          channel,
          interaction
        }
        const result = await channelGameCtrl.channelGamePlay(reqChannelGamePlayData);
        console.log("flagged in game state", result);
      }
      if (!channel.flaggedBy.includes(req.user._id) && !user.channelsFlagged.includes(channel._id)) {

        user.channelsFlagged.push(channel._id);
        await user.save();
        console.log('flagged in user db')

        channel.flaggedBy.push(req.user._id);
        await channel.save();
        console.log('flagged in channel db')

        return res.status(200).send({
          message: 'flag game played',
          channel: channel, 
        });
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)


// channel subscribe
channelRouter.post(
  '/:id/subscribeChannel/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);
    const user = await User.findById(req.user._id)
    try {
      
      if (!channel.subscribers.includes(req.user._id) && !user.channelsSubscribed.includes(channel._id)) {

        user.channelsSubscribed.push(channel._id);
        await user.save();
        console.log('subscribed in user db')

        channel.subscribers.push(req.user._id);
        await channel.save();
        console.log('subscribed in channel db')
        return res.status(200).send({
          message: 'fan game played',
          channel: channel, 
        });
      } else {
        return res.status(401).send('You already subscribed this channel');
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// channel unsubscribe
channelRouter.delete(
  '/:id/unsubscribeChannel',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);
    const user = await User.findById(req.user._id)
    try {
      console.log("Unsubscribing now")
      if (channel.subscribers.includes(user._id) && user.channelsSubscribed.includes(channel._id)) {
        user.channelsSubscribed.remove(channel._id);
        await user.save();
        console.log('unliked from user db')
        channel.subscribers.remove(req.user._id);
        const unsubscribedChannel = await channel.save();
        console.log('unliked from channel db')
        return res.status(200).send(unsubscribedChannel);
      } else {
        return res.status(401).send('You already do not like this channel');
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
)

// channel worth and rent
channelRouter.get(
  '/:id/channelParams',
  expressAsyncHandler(async (req, res) => {
    const channel = await Channel.findById(req.params.id);
    req = { timeHere: new Date().toLocaleTimeString([], { hour12: false }) }
    console.log("req", req)
    try {
      const reqGetChannelParams = {
        req, channel
      }
      const result = await channelGameCtrl.getChannelParams(reqGetChannelParams);
      return res.status(200).send(result);
    } catch (error) {
			console.error(error);
      return res.status(404).send(error);
    }
  })
)

export default channelRouter;