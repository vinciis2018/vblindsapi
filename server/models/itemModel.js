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

const itemSchema = new mongoose.Schema(
  {
  title: { type: String, required: true },
  description: { type: String, required: true },
  video: { type: String, required: true },
  thumbnail: { type: String, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  rating: { type: Number, default: 0, required: true },
  numReviews: { type: Number, default: 0, required: true },
  views: {type: Number, default: 0, required: true },
  likedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  hrsToComplete: {type: Number, default: 1, required: true},

  itWorth: { type: Number, default: 0},
  itBudget: { type: Number, default: 0},
  expectedViews: { type: Number, default: 0},
  activeGameContract: { type: String,},
  allGameContracts: [
    {type: String}
  ],
  sharedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],


  viewedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  boughtBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],

  reviews: [reviewSchema]
}, {
  timestamps: true
});

const Item = mongoose.model('Item', itemSchema);

export default Item;