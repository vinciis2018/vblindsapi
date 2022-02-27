import expressAsyncHandler from 'express-async-handler';
import Users from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendMail from './sendMail.js';
import { generateToken } from '../utils.js';

const userCtrl = {
  register: async (req, res) => {
      try {
          const {name, email, password} = req.body
          
          if(!name || !email || !password)
              return res.status(400).json({msg: "Please fill in all fields."})
            console.log("1")
          if(!validateEmail(email))
              return res.status(400).json({msg: "Invalid emails."})
              console.log("2")

          const user = await Users.findOne({email})
          if(user) return res.status(400).json({msg: "This email already exists."})
          console.log("3")

          if(password.length < 6)
              return res.status(400).json({msg: "Password must be at least 6 characters."})

          const passwordHash = await bcrypt.hashSync(password, 8)

          const newUser = {
              name, email, password: passwordHash
          };

          console.log('4')
          const activation_token = createActivationToken(newUser)
          console.log(activation_token)

          const url = `${process.env.CLIENT_URL}/user/activate/${activation_token}`
          sendMail(email, url, "Verify your email address")
          console.log('6')

          return res.json({msg: "Register Success! Please activate your email to start."})
      } catch (err) {
        console.log('7')

          return res.status(500).json({msg: err.message})

      }
  },
  activateEmail: async (req, res) => {
      try {
          const {activation_token} = req.body
          const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)

          const {name, email, password} = user

          const check = await Users.findOne({email})
          if(check) return res.status(400).json({msg:"This email already exists."})

          const newUser = new Users({
              name, email, password
          })

          const createdUser = await newUser.save();
          res.send({ createdUser });

          return res.status(401).json({
              msg: "Account has been activated!"
            })

      } catch (err) {
          return res.status(500).json({msg: err.message})
      }
  },
  login: expressAsyncHandler (async (req, res) => {
      try {
        const user = await Users.findOne({email: req.body.email})
        if(!user) return res.status(400).json({msg: "This email does not exist."})

        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if(!isMatch) return res.status(400).json({msg: "Password is incorrect."})

        if (bcrypt.compareSync(req.body.password, user.password)) {
            return res.send({
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
                adverts: user.adverts,
                advertsLiked: user.advertsLiked,
                advertsFlagged: user.advertsFlagged,
                advertsViewed: user.advertsViewed,

                pleasMade: user.pleasMade,
                pleasRecieved: user.pleasRecieved,

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
        const refresh_token = createRefreshToken({id: user._id})
        res.cookie('refreshtoken', refresh_token, {
            httpOnly: true,
            path: '/user/refresh_token',
            maxAge: 7*24*60*60*1000 // 7 days
        })

        res.status(401).json({msg: "Login success!"})
      } catch (err) {
          return res.status(500).json({msg: err.message})
      }
  }),
  getAccessToken: (req, res) => {
      try {
          const rf_token = req.cookies.refreshtoken
          if(!rf_token) return res.status(400).json({msg: "Please login now!"})

          jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
              if(err) return res.status(400).json({msg: "Please login now!"})

              const access_token = createAccessToken({id: user.id})
              res.json({access_token})
          })
      } catch (err) {
          return res.status(500).json({msg: err.message})
      }
  },
  forgotPassword: async (req, res) => {
      try {
          const {email} = req.body
          const user = await Users.findOne({email})
          if(!user) return res.status(400).json({msg: "This email does not exist."})

          const access_token = createAccessToken({id: user._id})
          const url = `${process.env.CLIENT_URL}/user/reset/${access_token}`

          sendMail(email, url, "Reset your password")
          res.json({msg: "Re-send the password, please check your email."})
      } catch (err) {
          return res.status(500).json({msg: err.message})
      }
  },
  resetPassword: async (req, res) => {
      try {
          const passwordHash = await bcrypt.hashSync(req.body.password, 8)

          await Users.findOneAndUpdate({_id: req.user.id}, {
              password: passwordHash
          })

          return res.status(401).json({msg: "Password successfully changed!"})
      } catch (err) {
          return res.status(500).json({msg: err.message})
      }
  },


  googleLogin: async (req, res) => {
      try {
          const {tokenId} = req.body

          const verify = await client.verifyIdToken({idToken: tokenId, audience: process.env.MAILING_SERVICE_CLIENT_ID})
          
          const {email_verified, email, name, picture} = verify.payload

          const password = email + process.env.GOOGLE_SECRET

          const passwordHash = await bcrypt.hash(password, 12)

          if(!email_verified) return res.status(400).json({msg: "Email verification failed."})

          const user = await Users.findOne({email})

          if(user){
            const isMatch = await bcrypt.compareSync(password, user.password)
            if(!isMatch) return res.status(400).json({msg: "Password is incorrect."})
            if(isMatch) return res.send({
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
                adverts: user.adverts,
                advertsLiked: user.advertsLiked,
                advertsFlagged: user.advertsFlagged,
                advertsViewed: user.advertsViewed,

                pleasMade: user.pleasMade,
                pleasRecieved: user.pleasRecieved,

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
              const refresh_token = createRefreshToken({id: user._id})
              res.cookie('refreshtoken', refresh_token, {
                  httpOnly: true,
                  path: '/user/refresh_token',
                  maxAge: 7*24*60*60*1000 // 7 days
              })

              res.json({msg: "Login success!"})
          }else{
              const newUser = new Users({
                  name, email, password: passwordHash, avatar: picture
              })

              const createdUser = await newUser.save()
            res.send({ createdUser });
              
              const refresh_token = createRefreshToken({id: newUser._id})
              res.cookie('refreshtoken', refresh_token, {
                  httpOnly: true,
                  path: '/user/refresh_token',
                  maxAge: 7*24*60*60*1000 // 7 days
              });

              return res.status(401).json({msg: "Login success!"})
          }


      } catch (err) {
          return res.status(500).json({msg: err.message})
      }
  },
}



function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

const createActivationToken = (payload) => {
  return jwt.sign(payload, 'thisismyactivationtokensecret', {expiresIn: '5m'})
}

const createAccessToken = (payload) => {
  return jwt.sign(payload, 'thisismyaccesstokensecret', {expiresIn: '15m'})
}

const createRefreshToken = (payload) => {
  return jwt.sign(payload, 'thisismyrefreshtokensecret', {expiresIn: '7d'})
}

export default userCtrl;