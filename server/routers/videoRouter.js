import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Screen from '../models/screenModel.js';
import Video from '../models/videoModel.js';
import Wallet from '../models/walletModel.js';

import { isAuth } from '../utils.js';
import data from '../data.js';
import advertGameCtrl from '../controllers/advertGameCtrl.js';


const videoRouter = express.Router();




// seed data

videoRouter.get(
	'/seed',
	expressAsyncHandler(async (req, res) => {
		const uploader = await User.findOne();
		if (uploader) {
			const videos = data.videos.map((video) => ({
				...video,
				uploader: uploader._id,
			}));
			const uploadedVideos = await Video.insertMany(videos);
			return res.send({ uploadedVideos });
		} else {
			return res.status(500).send({
				message: 'No uploader found. first run /api/users/seed'
			});
		}
	})
)


//checked
videoRouter.get('/', async (req, res) => {
	try {
		const allVideos = await Video.find();
		if (allVideos) {
			return res.send(allVideos);
		} else {
			return res.status(401).send({ message: "No video found" });
		}
	} catch (error) {
		return res.send(error);
	}
})

//checked
videoRouter.get(
	'/:id', 
	expressAsyncHandler(async (req, res) => {
		const requestedVideo = await Video.findById(req.params.id);
		console.log(requestedVideo);
		try {
			return res.send(requestedVideo);
		} catch (error) {
			return res.send(error);
		}
}));


// upload video 
videoRouter.post(
	'/screen/:id',
	isAuth,
	expressAsyncHandler(async (req, res) => {
		console.log(req.body);
		try{
			const screenId = req.params.id;
			const videoScreen = await Screen.findById(screenId);
			const videoUser = await User.findById(req.user._id);

			if(videoScreen && videoUser) {
				const video = new Video({
					title: req.body.title || 'Title here',
					description: req.body.description || 'It is video description',
					video: req.body.video || 'https://arweave.net/9ufUDWoGOSz6Rbp2IFBlD4Qgf50simrCnZV6pfdDByI',
					// duration: duration,
					thumbnail: req.body.thumbnail || 'https://arweave.net/14eHOjTQCFkrKTbyVyzj9c_i7e_cmprLKq7rcJIlBVs',
					uploader: videoUser._id,
					screen: videoScreen._id,
					uploaderName: videoUser.name,

					adWorth: req.body.adWorth || 0,
					adBudget: req.body.adBudget || 0,
					expectedViews: req.body.expectedViews || 0,

					hrsToComplete: req.body.hrsToComplete || 0,
					videoTags: req.body.advertTags || ['blinds', 'vinciis', 'koii']
				})

				console.log(video);
				await video.save();

				videoUser.videos.push(video._id);
				await videoUser.save();

				videoScreen.videos.push(video._id);
				await videoScreen.save();
				const newVideo = await video.save();

				return res.status(200).send(newVideo);
	
			} else {
				return res.status(401).send({ message: "No screen found" });
			}
		} catch (error) {
			return res.status(404).send({
				message: 'Something went wrong in server side',
				error
			});
		}
	})
)


//update video

videoRouter.put(
	'/:id',
	isAuth,
	async (req, res) => {
		try {
			const video = await Video.findById(req.params.id);
			console.log(req.body)
			if (video) {
				video.description = req.body.description || video.description,
				video.title = req.body.title || video.title,
				video.thumbnail = req.body.thumbnail || video.thumbnail,
				video.video = req.body.advert || video.video
				video.adWorth = req.body.adWorth || video.adWorth,
				video.adBudget = req.body.adBudget || video.adBudget,
				video.expectedViews = req.body.expectedViews || video.expectedViews,
				video.hrsToComplete = req.body.hrsToComplete || video.hrsToComplete
				video.videoTags = req.body.advertTags || video.videoTags
				const updatedVideo = await video.save();
				if (updatedVideo)
					return res.send({ message: 'video updated', video: updatedVideo });
			}
			return res.status(401).send({ message: "Video not found" });
		} catch (error) {
			return res.status(404).send(error);
		}
	}
);



//delete video 

videoRouter.delete(
    '/:id',
    isAuth,
    expressAsyncHandler(async (req, res) => {
			try {
				const video = await Video.findById(req.params.id);
				console.log('yes', video._id);

				if (video) {

					const screenId = video.screen;
					console.log('asjd', screenId);

					const uploaderId = video.uploader;
					console.log('assjd', uploaderId);

					const videoScreen = await Screen.findById(screenId)
					console.log('screen', videoScreen._id);
					
					const videoUploader = await User.findById(uploaderId);
					console.log('video', videoUploader._id);
							
					const deleteVideo = await video.remove();
					console.log("deleted Video");

					if(videoScreen !== undefined || null) {
						videoScreen.videos.remove(video._id);
						await videoScreen.save();
						console.log('1', videoScreen);
					};
						

					if(videoUploader !== undefined || null) {
						videoUploader.videos.remove(video._id);
						await videoUploader.save();
						console.log('2', videoUploader);
					};
						
					console.log("delete done")
					return res.status(200).send({
							message: 'Video deleted',
							video: deleteVideo,
							screen: videoScreen,
							user: videoUploader,
					});
				}
				return res.status(404).send({ message: "Video not found" });
			} catch (error) {
				return res.status(400).send(error);
			}
	})
);



//like video

videoRouter.post(
	'/:id/likeVideo/:interaction',
	isAuth,
	expressAsyncHandler( async (req, res) => {
		const videoId = req.params.id;
    const interaction = req.params.interaction;
    const video = await Video.findById(videoId);
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    console.log("found it all")
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = video.activeGameContract;
      console.log(gameContract)
      const gameState = await readContract(gameContract)
      if(!(gameState.stakes.likeEP) || !(gameState.stakes.likeEP[walletAddress])) {
        console.log("liking in gameState")
        const reqAdvertGamePlayData = {
          req,
          video,
          interaction
        }
        const result = await advertGameCtrl.advertGamePlay(reqAdvertGamePlayData);
        console.log("liked in game state", result);
      }
      if(!video.likedBy.includes(req.user._id) && !user.videosLiked.includes(video._id)) {
        user.videosLiked.push(video._id);
        await user.save();
        console.log('liked in user db')
        video.likedBy.push(req.user._id);
        await video.save();
        console.log('liked in video/advert db')
      }
      return res.status(200).send({ 
        message: 'like game played',
        video: video, 
      });
    } catch (error) {
      return res.status(404).send(error);
    }
	})
)

//unlike video

videoRouter.delete(
	'/:id/unlikeVideo',
	isAuth,
	expressAsyncHandler(async (req, res) => {
    const videoId = req.params.id;
    const video = await Video.findById(videoId);
    const user = await User.findById(req.user._id)
    try {
      console.log("Unliking now")
      if (video.likedBy.includes(user._id) && user.videosLiked.includes(video._id)) {
        user.videosLiked.remove(video._id);
        await user.save();
        console.log('unliked from user db')
        video.likedBy.remove(req.user._id);
        const unlikedVideo = await video.save();
        console.log('unliked from video/advert db')
        return res.status(200).send(unlikedScreen);
      } else {
        return res.status(401).send('You already do not like this video/advert');
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// video flag 
videoRouter.post(
  '/:id/flagVideo/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const videoId = req.params.id;
    const interaction = req.params.interaction;
    const video = await Video.findById(videoId);
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = video.activeGameContract;
      const gameState = await readContract(gameContract)
      const walletInGameState = gameState.stakes.flagEP[walletAddress]
      if(!walletInGameState) {
        console.log("flagging in gameState")
        const reqAdvertGamePlayData = {
          req,
          video,
          interaction
        }
        const result = await advertGameCtrl.advertGamePlay(reqAdvertGamePlayData);
        console.log("flagged in game state", result);
      }
      if (!video.flaggedBy.includes(req.user._id) && !user.videosFlagged.includes(video._id)) {

        user.videosFlagged.push(video._id);
        await user.save();
        console.log('flagged in user db')

        video.flaggedBy.push(req.user._id);
        await video.save();
        console.log('flagged in video db')

        return res.status(200).send({
          message: 'flag game played',
          video: video, 
        });
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)



// views video

videoRouter.post('/view/:id', isAuth, async (req, res) => {
	try {
		const viewVideo = await Video.findById(req.params.id);
		const viewVideoUser = await User.findById(req.user._id);
		if (viewVideo) {
			viewVideo.views = viewVideo.views + 1;

			if(!viewVideo.viewedBy.includes(viewVideoUser._id)){
				viewVideo.viewedBy.push(viewVideoUser._id)
				viewVideoUser.viewedVideos.push(viewVideo._id);
				
				console.log('video viewed')
			}
			const viewedVideo = await viewVideo.save();
			const viewedVideoUser = await viewVideoUser.save();
			
			return res.send({viewedVideo, viewedVideoUser});
		}
		return res.status(401).send("Video not found")
	} catch (error) {
		return res.send(error);
	}
})


//comment video

videoRouter.post(
	'/:id/reviews', 
	isAuth, 
	expressAsyncHandler(async (req, res) => {
		const  video = await Video.findById(req.params.id);
		if (video) {
			if (video.reviews.find((x) => x.name === req.user.name)) {
				return res.status(400).send({ message: 'You already submitted a review' });
			}
			const review = {
				name: req.user.name,
				comment: req.body.comment,
				rating: Number(req.body.rating),
			};

			video.reviews.push(review);
			video.numReviews = video.reviews.length;
			video.rating = video.reviews.reduce((a, c) => c.rating + a, 0) / video.reviews.length;

			const updatedVideo = await video.save();
			return res.status(201).send({
				message: 'Review Created',
				review: updatedVideo.reviews[updatedVideo.reviews.length -1],
			});
		} else {
			return res.status(401).send({ message: "Video not found" });
		}
	})
)


// video worth and budget
videoRouter.get(
	'/:id/advertParams',
	expressAsyncHandler(async (req, res) => {
		const video = await Video.findById(req.params.id);
		try {
			const reqGetAdvertParams = {
				req, video
			}

			const result = await advertGameCtrl.getAdvertParams(reqGetAdvertParams);
			console.log(result);
			return res.status(200).send(result);
		} catch (error) {
			console.error(error);
			return res.status(404).send(error);
		}
	})
)

export default videoRouter;
