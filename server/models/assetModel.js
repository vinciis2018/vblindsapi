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


const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    link: { type: String, required: true },

    address: { type: String, },
    country: { type: String, required: true },
    category: { type: String, required: true },
 
    rating: { type: Number,},
    numReviews: { type: Number, },
    description: { type: String, required: true },
    reviews: [reviewSchema],

    assetWorth: { type: Number, default: 0 }, //in RAT
    activeGameContract: {type: String},
    allGameContracts: [
      {type: String}
    ],
    master: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    screens: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' }
    ],

    likedBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],

    flaggedBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],

    assetTags: [
      {type: String}
    ]

  }, {
    timestamps: true
});

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;