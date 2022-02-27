import mongoose from 'mongoose';

const pleaSchema = new mongoose.Schema(
  {

  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  //from
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', 
    // default: "60e7f209c2964350550c5ff6", 
    required: true },  // to
  pleaType: { type: String, required: true },
  screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' } || null,
  content: { type: String },
  status: { type: Boolean, default: false },
  reject: {type: Boolean, default: false},
  blackList: { type: Boolean, default: false},
  remarks: []
}, {
  timestamps: true,
});

const Plea = mongoose.model('Plea', pleaSchema);

export default Plea;