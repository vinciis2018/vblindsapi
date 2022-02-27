import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    comment: { type: String, required: true },
    rating: { type: Number, required: true },
  }, {
    timestamps: true,
  }
);

const shopSchema = new mongoose.Schema(
  {
  name: { type: String, required: true, unique: true},
  image: { type: String, required: true}, //playlist thumbnail folder
  link: { type: String, default: 'http://'},
  shopAddress: { type: String },
  districtCity: { type: String, required: true },
  stateUT: { type: String, required: true },
  country: { type: String, required: true },
  category: { type: String, required: true },

  rating: { type: Number },
  numReviews: { type: Number, required: true},
  description: { type: String, required: true},
  reviews: [reviewSchema],
  locationPin: { type: mongoose.Schema.Types.ObjectId, ref: 'Pin' },

  shWorth: { type: Number, default: 0 },
  activeGameContract: { type: String,},
  allGameContracts: [
    {type: String}
  ],

  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  items: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Video'}
  ],

  buyers: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  likedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  flaggedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  shopTags: [
    {type: String}
  ]
}, {
  timestamps: true,
});

const Shop = mongoose.model('Shop', shopSchema);

export default Shop;