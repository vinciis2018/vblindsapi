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

const videoSchema = new mongoose.Schema(
  {
  title: { type: String, required: true },
  description: { type: String, required: true },
  video: { type: String, required: true },
  duration: { type: Number, default: 20 }, //in seconds
  thumbnail: { type: String, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaderName: { type: String, required: true },

  screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
  rating: { type: Number, default: 0, required: true },
  numReviews: { type: Number, default: 0, required: true },
  views: {type: Number, default: 0, required: true },

  hrsToComplete: {type: Number, default: 1, required: true}, //in hours

  adWorth: { type: Number, default: 0},
  adBudget: { type: Number, default: 0},
  expectedViews: { type: Number, default: 0},
  activeGameContract: { type: String,},
  adSharedBy: [
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
  videoTags: [],
  runningData: [],
  startedOn: {type: Date },
  endedOn: {type: Date}
}, {
  timestamps: true
});

const Video = mongoose.model('Video', videoSchema);

export default Video;