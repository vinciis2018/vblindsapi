import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    comment: { type: String, required: true },
    rating: { type: Number, required: true },
  }, {
  timestamps: true,
});


const screenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    locationPin: { type: mongoose.Schema.Types.ObjectId, ref: 'Pin' } || {type: String},

    screenAddress: { type: String },
    districtCity: { type: String, required: true },
    stateUT: { type: String, required: true },
    country: { type: String, required: true },

    category: { type: String, required: true },
    screenType: { type: String, required: true},
    rating: { type: Number,},
    numReviews: { type: Number, },
    description: { type: String, required: true },
    reviews: [reviewSchema],

    size: { 
      length: { type: Number},
      width: { type: Number},
      measurementUnit: { type: String, default: "PX" },
    },

    calender: {type: mongoose.Schema.Types.ObjectId, ref: 'Calender' },

    scWorth: { type: Number, default: 0 }, //in RAT
    slotsTimePeriod: { type: Number, default: 20}, //in seconds
    rentPerSlot: { type: Number, default: 0}, //in RAT

    master: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },


    videos: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }
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

    allies: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    pleas: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Plea' },
    ],

    screenTags: [
      {type: String}
    ]

  }, {
  timestamps: true,
});

const Screen = mongoose.model('Screen', screenSchema);

export default Screen;