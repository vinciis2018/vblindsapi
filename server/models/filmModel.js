import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
  name: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true },
  }, { 
  timestamps: true 
  }
);

const filmSchema = new mongoose.Schema(
  {
  title: { type: String, required: true },
  description: { type: String, required: true },
  video: { type: String, required: true },
  thumbnail: { type: String, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  rating: { type: Number, default: 0, required: true },
  numReviews: { type: Number, default: 0, required: true },
  views: {type: Number, default: 0, required: true },

  hrsToComplete: {type: Number, default: 1, required: true},

  flWorth: { type: Number, default: 0},
  flBudget: { type: Number, default: 0},
  expectedViews: { type: Number, default: 0},
  flRent: { type: Number, default: 0},
  activeGameContract: { type: String,},
  allGameContracts: [
    {type: String}
  ],
  flSharedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  likedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  flaggedBy : [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
  ],

  viewedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  koiiViews: { type: Number },
  koiiRewards: { type: Number },
  reviews: [reviewSchema],
  filmTags: [],
  runningData: [],
}, {
  timestamps: true
});

const Film = mongoose.model('Film', filmSchema);

export default Film;