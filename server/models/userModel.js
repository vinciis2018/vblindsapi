import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },

  avatar: {type: String, default: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%3Fid%3DOIP.c6ASmT7d2qYobP4OPwAxVgAAAA%26pid%3DApi&f=1"},

  phone: { type: Number, default: '99999999', required: true },
  address: { type: String, default: 'address', required: true },
  districtCity: { type: String, default: 'district/city', required: true },
  municipality: { type: String, default: 'municipality', required: true },
  pincode: { type: Number, default: '111111', required: true },
  stateUt: { type: String, default: 'state/UT', required: true },
  country: { type: String, default: 'country', required: true },

  isItanimulli: { type: Boolean, default: false, required: true },
  isViewer: { type: Boolean, default: true, required: true },

  isMaster: { type: Boolean, default: false, required: true },
  master: {
    name: String,
    logo: String,
    description: String,
    rating: { type: Number, default: 0, required: true },
    numReviews: { type: Number, default: 0, required: true },
  },

  isAlly: { type: Boolean, default: false, required: true },
  ally: {
    name: String,
    logo: String,
    description: String,
    perHrHiring: { type: Number },
    rating: { type: Number, default: 0, required: true },
    numReviews: { type: Number, default: 0, required: true },
  },

  isBrand: { type: Boolean, default: false, required: true },
  brand: {
    name: String,
    logo: String,
    description: String,
    rating: { type: Number, default: 0, required: true },
    numReviews: { type: Number, default: 0, required: true },
  },

  isCommissioner: { type: Boolean, default: false, required: true },
  commissioner: {
    name: String,
    logo: String,
    description: String,
    rating: { type: Number, default: 0, required: true },
    numReviews: { type: Number, default: 0, required: true },
  },

  defaultWallet: {type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', default: null},

  wallets: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet'}
  ],

  assets: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Asset'}
  ],

  assetsSubscribed: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', }
  ],

  assetsLiked: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Asset'}
  ],

  assetsFlagged: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Asset'}
  ],

  screens: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', }
  ],
  
  screensSubscribed: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', }
  ],

  screensLiked: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Screen',}
  ],

  screensFlagged: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Screen'}
  ],

  videos: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }
  ],

  videosLiked: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Video'}
  ],

  videosFlagged: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Video'}
  ],

  videoViewed: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Video'}
  ],

  adverts: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Advert' }
  ],

  advertsLiked: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Advert'}
  ],

  advertsFlagged: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Advert'}
  ],

  advertsViewed: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Advert'}
  ],

  channels: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Channel'}
  ],

  channelsSubscribed: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Channel'}
  ],

  channelsLiked: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Channel'}
  ],

  channelsFlagged: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Channel'}
  ],

  films: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Film' }
  ],

  filmsLiked: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Film'}
  ],

  filmsFlagged: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Film'}
  ],

  filmsViewed: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Film'}
  ],

  shops: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }
  ],

  shopsSubscribed: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }
  ],

  shopsLiked: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Shop'}
  ],

  shopsFlagged: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Shop'}
  ],

  items: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Item'}
  ],

  itemsLiked: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Item'}
  ],

  itemsFlagged: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Item'}
  ],

  itemsBought: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Item'}
  ],

  itemsViewed: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Item'}
  ],

  pleasMade: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Plea' }
  ],

  alliedScreens: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' }
  ]

}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;