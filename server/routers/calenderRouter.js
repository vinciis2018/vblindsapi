import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import kohaku from '@_koi/kohaku';


import { isItanimulli, isAuth, isItanimulliOrMaster } from '../utils.js';
import screenGameCtrl from '../controllers/screenGameCtrl.js';
import Calender from '../models/calenderModel.js';
import Screen from '../models/screenModel.js';
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import Video from '../models/videoModel.js';

// import { arweave, stateRatContract } from '../index.js';


const calenderRouter = express.Router();

// get all slots

calenderRouter.get(
  '/screen/:id/slots',
  expressAsyncHandler(async (req, res) => {

    try {
      let calender = await Calender.findOne({
        screen: req.params.id
      });

      calender.slotDetails.map((slot) => {
        if (slot.isSlotBooked === false || !slot.slotTimeStart || slot.dataAttached.video === null) {
          console.log(slot);
          slot.remove();
          console.log("done in slot details")
        }
      })
      calender.dayDetails.map((day) => {
        day.slotsBooked.map((slot) => {
          if (slot.isSlotBooked === false) {
            console.log(slot);
            day.remove();
            console.log("done in day details")
          }
        })
      })

      if(calender.dayDetails.map((day) => day.slotsBooked).length === 0){
        console.log("1",calender.dayDetails.map((day) => day.slotsBooked))
      }else {
        console.log("2",calender.dayDetails.map((day) => day.slotsBooked))
      }
      await calender.save();

      return res.status(200).send(calender)

    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: 'Internal server error'
      });
    }
  })
)


// add slot enquiry

calenderRouter.put(
  '/screen/:id',
  expressAsyncHandler(async (req, res) => {
    console.log("adding", req.body.dateHere); // recieve dateTime

    try {

      let calender = await Calender.findOne({
        screen: req.params.id
      });

      const slotAsked = calender.slotDetails.find((x) => x.slotTimeStart === req.body.dateHere)

      var givenDateIndex = calender.slotDetails.findIndex((x) => x.slotTimeStart === req.body.dateHere)
      console.log(givenDateIndex);
      console.log(givenDateIndex - 1);
      console.log(givenDateIndex + 1);


      if (slotAsked) {
        var preceedingSlotAsked = calender.slotDetails[(givenDateIndex - 1)]
        console.log(`${givenDateIndex-1}`, preceedingSlotAsked);
        var succeedingSlotAsked = calender.slotDetails[(givenDateIndex + 1)]
        console.log(`${givenDateIndex+1}`, succeedingSlotAsked);

        const viewSlots = {
          preceedingSlotAsked,
          succeedingSlotAsked,
          slotAsked
        }
        console.log("yup", viewSlots)

        return res.status(202).send({
          message: "slot is already booked",
          calender: calender,
          viewSlots: viewSlots,
        });

      } else {

        const slot = {
          slotTimeStart: req.body.dateHere,
          // isSlotBooked: true,
          dataAttached: {}
        }

        calender.slotDetails.push(slot);
        await calender.save();
        console.log("calender saved", calender.slotDetails);

        return res.status(200).send({
          message: "slot booked",
          slotBooked: calender.slotDetails[calender.slotDetails.length - 1],
          calender: calender
        });
      }

    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: 'Internal server error',
        error
      });
    }
  })
)


// asked day details
calenderRouter.post(
  '/screen/:id/day',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log(req.body)
    const screen = await Screen.findOne({
      _id: req.params.id
    })
    const calender = await Calender.findOne({
      screen: screen._id
    })
    const video = await Video.findById(req.body.daySlotToBook.video._id);
    try {
      const numberOfSlots = Number(req.body.daySlotToBook.slotsPerDay)
      const campaignDetails = video._id
      const startDate = new Date(req.body.daySlotToBook.startDateHere)
      let slotsAvailable;

      console.log(calender.dayDetails.filter((day) => (
        day.date.toString() === startDate.toString()
      )).length)
      if(calender.dayDetails.filter((day) => (
        day.date.toString() === startDate.toString()
      )).length === 0){
        const daySlot = {
          date: req.body.daySlotToBook.startDateHere,
          slotsBooked: [],
          slotsPlayed: [],
          isSlotBooked: false
        }
        daySlot.slotsBooked?.push({
          numberOfSlots: numberOfSlots,
          campaignDetails: campaignDetails
        })
        console.log(daySlot)
        calender.dayDetails.push(daySlot)
        await calender.save();
        slotsAvailable = ((24*60*60/screen.slotsTimePeriod) - (daySlot.slotsBooked.map(slots => slots.numberOfSlots).reduce(((numberOfSlots, index) => numberOfSlots + index))))

        console.log(calender.dayDetails);
        return res.status(200).send({
          message: "booked day slot",
          calender: calender,
          daySlot: daySlot,
          slotsAvailable: slotsAvailable
        })
      } else {
        const daySlot = calender.dayDetails.filter((day) => (
          day.date.toString() === startDate.toString()
        ))[0]
        console.log("done here", daySlot)
        if(daySlot.slotsBooked.length === 0){
          slotsAvailable = (24*60*60)/screen.slotsTimePeriod;
        } else {
          slotsAvailable = (((24*60*60)/screen.slotsTimePeriod) - (daySlot.slotsBooked.map(slots => slots.numberOfSlots).reduce(((numberOfSlots, index) => numberOfSlots + index))))
        }
        return res.status(202).send({
          message: "day slot already booked",
          calender: calender,
          daySlot: daySlot,
          slotsAvailable: slotsAvailable
        })
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: 'Internal server error'
      });
    }
  })
)

// book calender slot

calenderRouter.put(
  '/screen/:id/slot/:slotId/booking',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const slotId = req.params.slotId;
    const screenId = req.params.id;

    const screen = await Screen.findOne({
      _id: screenId
    })

    console.log("screen");

    const masterUser = await User.findOne({ _id: screen.master });
    console.log("masterUser");
    const masterWallet = await Wallet.findOne({ _id: masterUser.defaultWallet });
    console.log("masterWallet");
    const userWallet = await Wallet.findOne({ _id: req.user.defaultWallet });
    console.log("userWallet");
    const calender = await Calender.findOne({ screen: screenId });
    console.log("calender slots");

    try {
      const slot = {
        slotTimeStart: req.body.dateHere,
        isSlotBooked: true,
        dataAttached: {
          video: req.body.video._id,
          transaction: {},
          // duration: 20,
          // played: {type: Boolean, default: false},
          // downloaded: {type: Boolean, default: false},
          createdOn: new Date(),
        }
      }
      console.log("slot", slot);

      const reqScreenGamePlayData = {
        req,
        screen,
        calender,
        interaction: "bookSlot"
      };

      const result = await screenGameCtrl.screenGamePlay(reqScreenGamePlayData);
      console.log(result);

      calender.slotDetails.push(slot);
      calender.slotDetails.sort((a, b) => {
        var a1 = new Date(a.slotTimeStart)
        var b1 = new Date(b.slotTimeStart)
        return a1 - b1
      });
      await calender.save();
      console.log(calender);

      return res.status(200).send({
        message: "slot booked",
        slotBooked: calender.slotDetails.filter((slot) => (new Date(slot.slotTimeStart) === new Date(req.body.dateHere))),
        calender: calender,
        result: result
      })

    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: 'Internal server error'
      });
    }
  })
);


// book calender slot

calenderRouter.put(
  '/screen/:id/day/:dayId/booking',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log(req.body)
    const dayId = req.params.dayId;
    const screenId = req.params.id;

    const screen = await Screen.findOne({
      _id: screenId
    })

    console.log("screen");
    const calender = await Calender.findOne({ screen: screenId });
    console.log("calender", calender);

    try {
      const day = calender.dayDetails.filter((day) => (new Date(day.date).toDateString() === new Date(req.body.startDateHere).toDateString()))[0];
      console.log("slot", day);

      day.slotsBooked.push({
        numberOfSlots: req.body.slotsPerDay,
        campaignDetails: req.body.video._id,
        isSlotBooked: req.body.dayBooked || true
      });
      const reqScreenGamePlayData = {
        req,
        screen,
        calender,
        interaction: "bookSlot"
      }

      const result = await screenGameCtrl.screenGamePlay(reqScreenGamePlayData);
      console.log(result);

      calender.dayDetails.sort((a, b) => {
        var a1 = new Date(a.date)
        var b1 = new Date(b.date)
        return a1 - b1
      });
      console.log(calender.dayDetails);

      await calender.save();


      return res.status(200).send({
        message: "slot booked",
        dayBooked: calender.dayDetails.filter((day) => (new Date(day.date).toString() === new Date(req.body.startDateHere).toDateString()))[0],
        calender: calender,
        result: result
      })

    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: 'Internal server error'
      });
    }
  })
);


export default calenderRouter;