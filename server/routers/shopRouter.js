import express from 'express';
import mongoose from 'mongoose';
import expressAsyncHandler from 'express-async-handler';

import Shop from '../models/shopModel.js';
import data from '../data.js';
import User from '../models/userModel.js';
import { isItanimulliOrBrand, isAuth} from '../utils.js';
import Item from '../models/itemModel.js';
import Pin from '../models/pinModel.js';
import shopGameCtrl from '../controllers/shopGameCtrl.js';
import { readContract } from '../helpers/smartContractIntreract.js';


const shopRouter = express.Router();

// top shops items

shopRouter.get(
  '/top-items',
  expressAsyncHandler(async (req, res) => {
    const topItems = await Item.find({
      isBrand: true
    })
      .sort({ 'brand.rating': -1 })
      .limit(3);
    res.send(topAllies);
  })
);


shopRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const pageSize = 6;
    const page = Number(req.query.pageNumber) || 1;
    const name = req.query.name || '';
    const category = req.query.category || '';
    const brand = req.query.brand || '';
    const min =
      req.query.min && Number(req.query.min) !== 0 ? Number(req.query.min) : 0;
    const max =
      req.query.max && Number(req.query.max) !== 0 ? Number(req.query.max) : 0;
    const rating =
      req.query.rating && Number(req.query.rating) !== 0
        ? Number(req.query.rating)
        : 0;

    const nameFilter = name ? { name: { $regex: name, $options: 'i' } } : {};
    const brandFilter = brand ? { brand } : {};
    const categoryFilter = category ? { category } : {};
    const costPerDeliveryFilter = min && max ? { costPerDelivery: { $gte: min, $lte: max } } : {};
    const ratingFilter = rating ? { rating: { $gte: rating } } : {};


    const countDocuments = await Shop.countDocuments({  //counting replaced in place of count from amazona tutorial [different from item=count]
      ...brandFilter,
      ...nameFilter,
      ...categoryFilter,
      ...costPerDeliveryFilter,
      ...ratingFilter,
    });

    const shops = await Shop.find({
      ...brandFilter,
      ...nameFilter,
      ...categoryFilter,
      ...costPerDeliveryFilter,
      ...ratingFilter,
    })
      .populate('brand', 'brand.name brand.logo')
      .sort()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.send({ shops, page, pages: Math.ceil(countDocuments / pageSize) });
  })
);


shopRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const shopCategories = await Shop.find().distinct('shopCategory');
    res.send(shopCategories);
  })
);

shopRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    const brand = await User.findOne({ isBrand: true });
    if (brand) {
      const shops = data.shops.map((shop) => ({
        ...shop,
        brand: brand._id,
      }));
      const createdShops = await Shop.insertMany(shops);
      res.send({ createdShops });
    } else {
      res.status(500).send({
        message: 'No brand found. first run /api/users/seed'
      });
    }
  })
);


shopRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const shop = await Shop.findById(req.params.id).populate(
      'brand',
      'brand.name brand.logo brand.rating brand.numReviews brand.description'
    );
    if (shop) {
      res.send(shop);
    } else {
      res.status(404).send({ message: 'shop Not Found in Database' });
    }
  })
);


shopRouter.get(
  '/:id/pin',
  expressAsyncHandler(async (req, res) => {
    const shop = await Shop.findById(req.params.id).populate();
    const pinId = shop.locationPin;
    const pin = await Pin.findById(pinId);
    try {
      return res.status(200).send(pin);
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)


shopRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const pinId = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();
    const shopId = new mongoose.Types.ObjectId();

    try {
      const pin = new Pin({
        _id: pinId,
        category: 'shop',
        shop: shopId,
        shopPin: true,
        user: req.user._id,
        lat: 25.26 || req.body.locationPin.lat,
        lng: 82.98 || req.body.locationPin.lng,
      });
      console.log(pin);
      const pinAdded = await pin.save();

      const item = new Item({
        _id: itemId,
        uploader: req.user._id,
        uploaderName: req.user.name,
        description: "Demo shop item",
        reviews: [],
        numReviews: 0,
        views: 0,
        rating: 0,
        likedBy: [],
        shop: shopId,
        video: "https://nnv6aulakgabuixgo4uez2vofiydprpyav3sucsyozx4ppxivkqa.arweave.net/a2vgUWBRgBoi5ncoTOquKjA3xfgFdyoKWHZvx77oqqA",
        thumbnail: "https://rvvb2ge2m7vhxm4yhlfhno4sabrw4l3g2avqptflurgdwgltpa6q.arweave.net/jWodGJpn6nuzmDrKdruSAGNuL2bQKwfMq6RMOxlzeD0",
  
        title: "Demo_item.mp4",
        viewedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(item);
      const createdShopItem = await item.save();
  
      const shop = new Shop({
        _id: shopId,
        name: 'sample name' + Date.now(),
        brand: req.user._id,
        image: 'https://t4.ftcdn.net/jpg/04/21/03/43/360_F_421034341_K4rQMuveqTwinJmrOPDDa4UAhurbZazk.jpg',
        link: '',

        shopAddress: 'address' || req.body.address,
        districtCity: 'district' || req.body.districtCity,
        stateUT: 'state/UT' || req.body.stateUT,
        country: 'country' || req.body.country,
  
        category: 'CATEGORY',
        rating: 0,
        numReviews: 0,
        description: 'sample description' || req.body.description,
        locationPin: pinId,
        items: [item],
        flaggedBy: [],
        likedBy: [],
        reviews: [],
        shopTags: ['blinds', 'vinciis']
      });
      console.log(shop);
  
      const createdShop = await shop.save();
  
      await user.items.push(item);
      await user.shops.push(shop);
      await user.save();
      console.log("shop created");

      return res.status(200).send({ 
        message: 'Shop & Item Created', 
        shop: createdShop, 
        item: createdShopItem, 
        pin: pinAdded,
      });
    } catch (error) {
      return res.status(400).send(error)
    }
  })
);


shopRouter.put(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);
    const user = await User.findById(shop.brand);
    try {
      const brandShop = user.shops.filter(shop => shop._id.toString() === shopId);
      if (brandShop) {

        shop.name = req.body.name || shop.name;
        shop.link = req.body.link || shop.link;
        shop.image = req.body.image || shop.image;
        shop.category = req.body.category || shop.category;
        shop.shopAddress = req.body.shopAddress || shop.shopAddress;
        shop.description = req.body.description || shop.description;
        shop.districtCity = req.body.districtCity || shop.districtCity;
        shop.stateUT = req.body.stateUT || shop.stateUT;
        shop.country = req.body.country || shop.country;
        shop.shWorth = req.body.shWorth || shop.shWorth;
        shop.locationPin = req.body.locationPin || shop.locationPin;
  
        const updatedShop = await shop.save();
  
        return res.status(200).send({ 
          message: 'Shop Updated', 
          shop: updatedShop, 
        });
      } else {
        return res.status(404).send({ message: 'shop Not Found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(404).send(error);
    }
  })
);


shopRouter.delete(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shop = await Shop.findById(req.params.id);
    if (shop) {
      const shopItems = shop.items;
      console.log(shopItems);
      const shopPin = shop.locationPin.pinId;
      console.log(shopPin);

      const item = await Item.findByIdAndRemove(shopItems);
      const pin = await Pin.findByIdAndRemove(shopPin);

      console.log('yessa')
      const deleteShop = await shop.remove();
      return res.status(200).send({
        message: 'shop Deleted',
        shop: deleteShop,
        item: item,
        pin: pin
      });
    } else {
      return res.status(404).send({ message: 'shop Not Found' });
    }
  })
);


shopRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);
    if (shop) {
      if (shop.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      shop.reviews.push(review);
      shop.numReviews = shop.reviews.length;
      shop.rating =
        shop.reviews.reduce((a, c) => c.rating + a, 0) /
        shop.reviews.length;

      const updatedShop = await shop.save();
      return res.status(200).send({
        message: 'Review Created',
        review: updatedShop.reviews[updatedShop.reviews.length - 1],
      });
    } else {
      return res.status(404).send({ message: 'shop Not Found' });
    }
  })
);


// item related

shopRouter.get(
  `/:id/myitems`, 
  isAuth, 
  expressAsyncHandler( async (req, res) => {
    const shopId = req.params.id;
    console.log("for shop items", shopId);
    try {
      const myShopItems = await Item.find({ shop: shopId });
      if (myShopItems)
        return res.status(200).send(myShopItems);
      else
        return res.status(401).send({ message: "items not found" });
    } catch (error) {
      return res.status(404).send(error.message);
    }
  })
)

// upload shop items

shopRouter.post(
  '/:id/uploadItem',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    console.log("from backend", req.params.id);
    const shopItem = await Shop.findById(shopId);

    if (shopId) {
      console.log("after from backend", shopId);

      try {
        const userItem = await User.findById(req.user._id);

        if (userItem) {

          const item = new Item({
            title: req.body.title,
            description: req.body.description,
            item: req.body.item,
            thumbnail: req.body.thumbnail,
            uploader: req.user._id,
            shop: req.params.id,
            uploaderName: req.user.name,

          })
          console.log(item);
          const newItem = await item.save();
          userItem.items.push(newItem._id);
          shopItem.items.push(newItem._id);

          await userItem.save();
          await shopItem.save();
          return res.send(newItem);
        }
        return res.status(200).send({ message: "user does not exist" });

      } catch (error) {
        return res.status(401).send(error);
      }
    }
    return res.status(404).send({ message: "please choose a shop first" });
  })
);


// delete shop items

shopRouter.delete(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      console.log(item._id);

      if (item) {

        const shopId = item.shop._id;
        const uploaderId = item.uploader._id;

        const itemShop = await Shop.findById(shopId)
        const itemUploader = await User.findById(uploaderId);

        console.log('yes', item._id);

        itemShop.items.remove(item._id);
        const deletedItemShop = await itemShop.save();
        console.log('1', deletedItemShop.items);


        itemUploader.items.remove(item._id);
        const deletedItemUploader = await itemUploader.save();
        console.log('2', deletedItemUploader.items);



        const deletedItem = await item.remove();

        return res.status(200).send({
          message: 'item deleted',
          item: deletedItem,
          deletedItemShop,
          deletedItemUploader
        })

      } else {
        res.status(404).send({ message: "item not found" });
      }
    } catch (error) {
      return res.status(405).send({ error });
    }
  })
);



shopRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);
    if (shop) {
      if (shop.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      shop.reviews.push(review);
      shop.numReviews = shop.reviews.length;
      shop.rating =
        shop.reviews.reduce((a, c) => c.rating + a, 0) /
        shop.reviews.length;

      const updatedShop = await shop.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedShop.reviews[updatedShop.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: 'Shop Not Found' });
    }
  })
);


// my shop Items
shopRouter.get(`/:id/myitems`, isAuth, 
expressAsyncHandler( async (req, res) => {
  const shopId = req.params.id;
  console.log("for shop Items", shopId);
  try {
    const myShopItems = await Item.find({ shop: shopId });
    if (myShopItems)
      return res.send(myShopItems);
    else
      return res.status(401).send({ message: "Items not found" });
  } catch (error) {
    return res.send(error.message);
  }
}))


// shop Items
shopRouter.get(
  `/:id/shopItems`, 
  expressAsyncHandler( async (req, res) => {
    const shopId = req.params.id;
    console.log("for shop Items", shopId);
    try {
      const myShopItems = await Item.find({ shop: shopId });
      if (myShopItems)
        return res.send(myShopItems);
      else
        return res.status(401).send({ message: "Items not found" });
    } catch (error) {
      return res.send(error.message);
    }
  })
)


// upload shop items
shopRouter.post(
  '/:id/uploadItem',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    console.log("from backend", req.params.id);
    const shopItem = await Shop.findById(shopId);

    if (shopId) {
      console.log("after from backend", shopId);
      // res.send(shop);

      try {
        const userItem = await User.findById(req.user._id);

        if (userItem) {
          // console.log(userItem);
 
          const item = new Item({
            title: req.body.title,
            description: req.body.description,
            item: req.body.item,
            // duration: duration,
            thumbnail: req.body.thumbnail,
            uploader: req.user._id,
            shop: req.params.id,
            uploaderName: req.user.name,

            adWorth: req.body.adWorth,
            adBudget: req.body.adBudget,
            expectedViews: req.body.expectedViews,

            hrsToComplete: req.body.hrsToComplete,

          })
          console.log(item);
          const newItem = await item.save();
          userItem.items.push(newItem._id);
          shopItem.items.push(newItem._id);

          await userItem.save();
          await shopItem.save();
          return res.status(200).send(newItem);
        }
        return res.status(401).send({ message: "user does not exist" });

      } catch (error) {
        return res.status(401).send(error);
      }
    }
    return res.status(401).send({ message: "please choose a shop first" });
  })
);


// delete shop items
shopRouter.delete(
  '/:id/deleteItem',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      console.log(item._id);

      if (item) {

        const shopId = item.shop._id;
        const uploaderId = item.uploader._id;

        const itemShop = await Shop.findById(shopId)
        const itemUploader = await User.findById(uploaderId);

        console.log('yes', item._id);

        itemShop.items.remove(item._id);
        const deletedItemShop = await itemShop.save();
        console.log('1', deletedItemShop.items);


        itemUploader.items.remove(item._id);
        const deletedItemUploader = await itemUploader.save();
        console.log('2', deletedItemUploader.items);



        const deletedItem = await item.remove();

        return res.status(200).send({
          message: 'Item deleted',
          item: deletedItem,
          deletedItemShop,
          deletedItemUploader
        })

      } else {
        res.status(404).send({ message: "Item not found" });
      }
    } catch (error) {
      return res.status(404).send({ error });
    }
  })
);


// shop like

shopRouter.post(
  '/:id/likeShop/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    const interaction = req.params.interaction;
    const shop = await Shop.findById(shopId);
    const user = await User.findById(req.user._id)
    const calender = await Calender.findOne({ shop: shopId });
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    console.log("found it all")
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = calender.activeGameContract;
      console.log(gameContract)
      const gameState = await readContract(gameContract)
      if(!(gameState.stakes.likeEP) || !(gameState.stakes.likeEP[walletAddress])) {
        console.log("liking in gameState")
        const reqShopGamePlayData = {
          req,
          shop,
          calender,
          interaction
        }
        const result = await shopGameCtrl.shopGamePlay(reqShopGamePlayData);
        console.log("liked in game state", result);
      }
      if(!shop.likedBy.includes(req.user._id) && !user.shopsLiked.includes(shop._id)) {
        user.shopsLiked.push(shop._id);
        await user.save();
        console.log('liked in user db')
        shop.likedBy.push(req.user._id);
        await shop.save();
        console.log('liked in shop db')
      }
      return res.status(200).send({ 
        message: 'like game played',
        shop: shop, 
      });
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// shop unlike

shopRouter.delete(
  '/:id/unlikeShop',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);
    const user = await User.findById(req.user._id)
    try {
      console.log("Unliking now")
      if (shop.likedBy.includes(user._id) && user.shopsLiked.includes(shop._id)) {
        user.shopsLiked.remove(shop._id);
        await user.save();
        console.log('unliked from user db')
        shop.likedBy.remove(req.user._id);
        const unlikedShop = await shop.save();
        console.log('unliked from shop db')
        return res.status(200).send(unlikedShop);
      } else {
        return res.status(401).send('You already do not like this shop');
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// shop flag 
shopRouter.post(
  '/:id/flagShop/:interaction',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const shopId = req.params.id;
    const interaction = req.params.interaction;
    const shop = await Shop.findById(shopId);
    const user = await User.findById(req.user._id)
    const calender = await Calender.findOne({ shop: shopId });
    const wallet = await Wallet.findById({_id: user.defaultWallet});
    try {
      const walletAddress = wallet.walletAddAr;
      const gameContract = calender.activeGameContract;
      const gameState = await readContract(gameContract)
      const walletInGameState = gameState.stakes.flagEP[walletAddress]
      if(!walletInGameState) {
        console.log("flagging in gameState")
        const reqShopGamePlayData = {
          req,
          shop,
          calender,
          interaction
        }
        const result = await shopGameCtrl.shopGamePlay(reqShopGamePlayData);
        console.log("flagged in game state", result);
      }
      if (!shop.flaggedBy.includes(req.user._id) && !user.shopsFlagged.includes(shop._id)) {

        user.shopsFlagged.push(shop._id);
        await user.save();
        console.log('flagged in user db')

        shop.flaggedBy.push(req.user._id);
        await shop.save();
        console.log('flagged in shop db')

        return res.status(200).send({
          message: 'flag game played',
          shop: shop, 
        });
      }
    } catch (error) {
      return res.status(404).send(error);
    }
  })
)

// shop worth 
shopRouter.get(
  '/:id/shopParams',
  expressAsyncHandler(async (req, res) => {
    const shop = await Shop.findById(req.params.id);
    const calender = await Calender.findById(shop.calender);
    req = { timeHere: new Date().toLocaleTimeString([], { hour12: false }) }
    console.log("req", req)
    try {
      const reqGetShopParams = {
        req, shop, calender
      }
      const result = await shopGameCtrl.getShopParams(reqGetShopParams);
      return res.status(200).send(result);
    } catch (error) {
			console.error(error);
      return res.status(404).send(error);
    }
  })
)



export default shopRouter;