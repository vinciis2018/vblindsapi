import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const verifyCtrl = {
  getCode : async (req, res) => {
    const client = new twilio(accountSid, authToken);
    console.log(req.query.phonenumber)
    if (req.query.phonenumber) {
      client
      .verify
      .services(process.env.TWILIO_SERVICE_ID)
      .verifications
      .create({
        to: `+${req.query.phonenumber}`,
        channel: req.query.channel
      })
      .then(data => {
        res.status(200).send({
          message: "Verification is sent!!",
          phonenumber: req.query.phonenumber,
          data
        }) && console.log(data)
      })
    } else {
      res.status(400).send({
        message: "Wrong phone number :(",
        phonenumber: req.query.phonenumber,
        data
      })
    }
  },
  
  verifyCode : async (req, res) => {
    const client = new twilio(accountSid, authToken);
    if (req.query.phonenumber && (req.query.code).length === 6) {
      client
        .verify
        .services(process.env.TWILIO_SERVICE_ID)
        .verificationChecks
        .create({
            to: `+${req.query.phonenumber}`,
            code: req.query.code
        })
        .then(data => {
          if (data.status === "approved") {
            res.status(200).send({
              message: "User is Verified!!",
              data
            })
          } else {
            res.status(202).send({
              message: "Enter correct OTP",
              data
            })
          }
        });
    } else {
      res.status(400).send({
        message: "Wrong phone number or code :(",
        phonenumber: req.query.phonenumber,
        data
      })
    }
   
  }
}

export default verifyCtrl;