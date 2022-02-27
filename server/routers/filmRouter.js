import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Channel from '../models/channelModel.js';
import Film from '../models/filmModel.js';
import Wallet from '../models/walletModel.js';

import { isAuth } from '../utils.js';
import data from '../data.js';
import filmGameCtrl from '../controllers/filmGameCtrl.js';


const filmRouter = express.Router();




// seed data

filmRouter.get(
	'/seed',
	expressAsyncHandler(async (req, res) => {
		const uploader = await User.findOne();
		if (uploader) {
			const films = data.films.map((film) => ({
				...film,
				uploader: uploader._id,
			}));
			const uploadedFilms = await Film.insertMany(films);
			return res.send({ uploadedFilms });
		} else {
			return res.status(500).send({
				message: 'No uploader found. first run /api/users/seed'
			});
		}
	})
)


//checked
filmRouter.get('/', async (req, res) => {
	try {
		const allFilms = await Film.find();
		if (allFilms) {
			return res.send(allFilms);
		} else {
			return res.status(401).send({ message: "No film found" });
		}
	} catch (error) {
		return res.send(error);
	}
})

//checked
filmRouter.get(
	'/:id', 
	expressAsyncHandler(async (req, res) => {
		const requestedFilm = await Film.findById(req.params.id);
		console.log(requestedFilm);
		try {
			return res.send(requestedFilm);
		} catch (error) {
			return res.send(error);
		}
}));


// upload film 
filmRouter.post(
	'/channel/:id',
	isAuth,
	expressAsyncHandler(async (req, res) => {
		console.log(req.body);
		try{
			const channelId = req.params.id;
			const filmChannel = await Channel.findById(channelId);
			const filmUser = await User.findById(req.user._id);

			if(filmChannel && filmUser) {
				const film = new Film({
					title: req.body.title || 'Title here',
					description: req.body.description || 'It is film description',
					film: req.body.film || 'https://arweave.net/9ufUDWoGOSz6Rbp2IFBlD4Qgf50simrCnZV6pfdDByI',
					// duration: duration,
					thumbnail: req.body.thumbnail || 'https://arweave.net/14eHOjTQCFkrKTbyVyzj9c_i7e_cmprLKq7rcJIlBVs',
					uploader: filmUser._id,
					channel: filmChannel._id,
					uploaderName: filmUser.name,

					flWorth: req.body.flWorth || 0,
					flBudget: req.body.flBudget || 0,
					expectedViews: req.body.expectedViews || 0,
					flRent: req.body.flRent || 0,

					hrsToComplete: req.body.hrsToComplete || 0,
					filmTags: req.body.filmTags || ['blinds', 'vinciis', 'koii']
				})

				console.log(film);
				await film.save();

				filmUser.films.push(film._id);
				await filmUser.save();

				filmChannel.films.push(film._id);
				await filmChannel.save();
				const newFilm = await film.save();

				return res.status(200).send(newFilm);
	
			} else {
				return res.status(401).send({ message: "No channel found" });
			}
		} catch (error) {
			return res.status(404).send({
				message: 'Something went wrong in server side',
				error
			});
		}
	})
)


//update film

filmRouter.put(
	'/:id',
	isAuth,
	async (req, res) => {
		try {
			const film = await Film.findById(req.params.id);
			console.log(req.body)
			if (film) {
				film.description = req.body.description || film.description,
				film.title = req.body.title || film.title,
				film.thumbnail = req.body.thumbnail || film.thumbnail,
				film.film = req.body.film || film.film
				film.adWorth = req.body.adWorth || film.adWorth,
				film.adBudget = req.body.adBudget || film.adBudget,
				film.expectedViews = req.body.expectedViews || film.expectedViews,
				film.hrsToComplete = req.body.hrsToComplete || film.hrsToComplete
				film.filmTags = req.body.filmTags || film.filmTags
				const updatedFilm = await film.save();
				if (updatedFilm)
					return res.send({ message: 'film updated', film: updatedFilm });
			}
			return res.status(401).send({ message: "Film not found" });
		} catch (error) {
			return res.status(404).send(error);
		}
	}
);



//delete film 

filmRouter.delete(
	'/:id',
	isAuth,
	expressAsyncHandler(async (req, res) => {
		try {
			const film = await Film.findById(req.params.id);
			console.log('yes', film._id);
			if (film) {
				const channelId = film.channel;
				console.log('asjd', channelId);

				const uploaderId = film.uploader;
				console.log('assjd', uploaderId);

				const filmChannel = await Channel.findById(channelId)
				console.log('channel', filmChannel._id);
				
				const filmUploader = await User.findById(uploaderId);
				console.log('film', filmUploader._id);
						
				const deleteFilm = await film.remove();
				console.log("deleted Film");

				if(filmChannel !== undefined || null) {
					filmChannel.films.remove(film._id);
					await filmChannel.save();
					console.log('1', filmChannel);
				};
					

				if(filmUploader !== undefined || null) {
					filmUploader.films.remove(film._id);
					await filmUploader.save();
					console.log('2', filmUploader);
				};
					
				console.log("delete done")
				return res.status(200).send({
						message: 'Film deleted',
						film: deleteFilm,
						channel: filmChannel,
						user: filmUploader,
				});
			}
			return res.status(404).send({ message: "Film not found" });
		} catch (error) {
			return res.status(400).send(error);
		}
	})
);



//like film

filmRouter.post(
	'/:id/likeFilm/:interaction',
	isAuth,
	expressAsyncHandler( async (req, res) => {
		const filmId = req.params.id;
			const interaction = req.params.interaction;
			const film = await Film.findById(filmId);
			const user = await User.findById(req.user._id)
			const wallet = await Wallet.findById({_id: user.defaultWallet});
			console.log("found it all")
			try {
				const walletAddress = wallet.walletAddAr;
				const gameContract = film.activeGameContract;
				console.log(gameContract)
				const gameState = await readContract(gameContract)
				if(!(gameState.stakes.likeEP) || !(gameState.stakes.likeEP[walletAddress])) {
					console.log("liking in gameState")
					const reqFilmGamePlayData = {
					req,
					film,
					interaction
					}
					const result = await filmGameCtrl.filmGamePlay(reqFilmGamePlayData);
					console.log("liked in game state", result);
				}
				if(!film.likedBy.includes(req.user._id) && !user.filmsLiked.includes(film._id)) {
					user.filmsLiked.push(film._id);
					await user.save();
					console.log('liked in user db')
					film.likedBy.push(req.user._id);
					await film.save();
					console.log('liked in film/advert db')
				}
				return res.status(200).send({ 
					message: 'like game played',
					film: film, 
				});
			} catch (error) {
				return res.status(404).send(error);
			}
	})
)

//unlike film

filmRouter.delete(
	'/:id/unlikeFilm',
	isAuth,
	expressAsyncHandler(async (req, res) => {
    const filmId = req.params.id;
    const film = await Film.findById(filmId);
    const user = await User.findById(req.user._id)
    try {
      console.log("Unliking now")
      if (film.likedBy.includes(user._id) && user.filmsLiked.includes(film._id)) {
        user.filmsLiked.remove(film._id);
        await user.save();
        console.log('unliked from user db')
        film.likedBy.remove(req.user._id);
        const unlikedFilm = await film.save();
        console.log('unliked from film/advert db')
        return res.status(200).send(unlikedChannel);
      } else {
        return res.status(401).send('You already do not like this film/advert');
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// film flag 
filmRouter.post(
  '/:id/flagFilm/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const filmId = req.params.id;
    const interaction = req.params.interaction;
    const film = await Film.findById(filmId);
    const user = await User.findById(req.user._id)
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = film.activeGameContract;
      const gameState = await readContract(gameContract)
      const walletInGameState = gameState.stakes.flagEP[walletAddress]
      if(!walletInGameState) {
        console.log("flagging in gameState")
        const reqFilmGamePlayData = {
          req,
          film,
          interaction
        }
        const result = await filmGameCtrl.filmGamePlay(reqFilmGamePlayData);
        console.log("flagged in game state", result);
      }
      if (!film.flaggedBy.includes(req.user._id) && !user.filmsFlagged.includes(film._id)) {

        user.filmsFlagged.push(film._id);
        await user.save();
        console.log('flagged in user db')

        film.flaggedBy.push(req.user._id);
        await film.save();
        console.log('flagged in film db')

        return res.status(200).send({
          message: 'flag game played',
          film: film, 
        });
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)



// views film

filmRouter.post('/view/:id', isAuth, async (req, res) => {
	try {
		const viewFilm = await Film.findById(req.params.id);
		const viewFilmUser = await User.findById(req.user._id);
		if (viewFilm) {
			viewFilm.views = viewFilm.views + 1;

			if(!viewFilm.viewedBy.includes(viewFilmUser._id)){
				viewFilm.viewedBy.push(viewFilmUser._id)
				viewFilmUser.viewedFilms.push(viewFilm._id);
				
				console.log('film viewed')
			}
			const viewedFilm = await viewFilm.save();
			const viewedFilmUser = await viewFilmUser.save();
			
			return res.send({viewedFilm, viewedFilmUser});
		}
		return res.status(401).send("Film not found")
	} catch (error) {
		return res.send(error);
	}
})


//comment film

filmRouter.post(
	'/:id/reviews', 
	isAuth, 
	expressAsyncHandler(async (req, res) => {
		const  film = await Film.findById(req.params.id);
		if (film) {
			if (film.reviews.find((x) => x.name === req.user.name)) {
				return res.status(400).send({ message: 'You already submitted a review' });
			}
			const review = {
				name: req.user.name,
				comment: req.body.comment,
				rating: Number(req.body.rating),
			};

			film.reviews.push(review);
			film.numReviews = film.reviews.length;
			film.rating = film.reviews.reduce((a, c) => c.rating + a, 0) / film.reviews.length;

			const updatedFilm = await film.save();
			return res.status(201).send({
				message: 'Review Created',
				review: updatedFilm.reviews[updatedFilm.reviews.length -1],
			});
		} else {
			return res.status(401).send({ message: "Film not found" });
		}
	})
)


// film worth and budget
filmRouter.get(
	'/:id/filmParams',
	expressAsyncHandler(async (req, res) => {
		const film = await Film.findById(req.params.id);
		try {
			const reqGetFilmParams = {
				req, film
			}

			const result = await filmGameCtrl.getFilmParams(reqGetFilmParams);
			console.log(result);
			return res.status(200).send(result);
		} catch (error) {
			console.error(error);
			return res.status(404).send(error);
		}
	})
)

export default filmRouter;
