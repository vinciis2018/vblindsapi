import mongoose from 'mongoose';


const slotDetailsSchema = new mongoose.Schema({
  slotTimeStart: {type: String},
  played: {type: Boolean, default: false},
  downloaded: {type: Boolean, default: false},
  createdOn: {type: String, default: Date.now()},
}, {
  timestamps: true
})


const bookedSlotsSchema = new mongoose.Schema({
  calender: {type: mongoose.Schema.Types.ObjectId, ref: 'Calender'},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  video: {type: mongoose.Schema.Types.ObjectId, ref: 'Video'},
  slotsBooked = [slotDetailsSchema],
  paymentStatus: {type: Boolean, default: false},
  paymentDetails: {}
}, {
  timestamps: true
})

const BookedSlots = mongoose.model('BookedSlots', bookedSlotsSchema);

export default BookedSlots;