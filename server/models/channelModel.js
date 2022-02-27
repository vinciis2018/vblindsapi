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

const channelSchema = new mongoose.Schema(
  {
  name: { type: String, required: true, unique: true},
  image: { type: String, required: true}, //playlist thumbnail folder

  location: { type: String, required: true },
  country: { type: String, required: true },

  category: { type: String, required: true },

  rating: { type: Number, required: true},
  numReviews: { type: Number, required: true},
  description: { type: String, required: true},
  reviews: [reviewSchema],

  chWorth: { type: Number, default: 0},

  ally: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  films: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Film'}
  ],
  activeGameContract: {type: String},
  allGameContracts: [
    {type: String}
  ],
  subscribers: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  likedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  flaggedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  employers: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  channelTags: [
    {type: String}
  ]
  
}, {
  timestamps: true,
});

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;