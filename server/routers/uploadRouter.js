import express from 'express';
import multer from 'multer';
import {isAuth} from '../utils.js';
import * as fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

const PUB_DIR = path.join(__dirname, "public");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, PUB_DIR)
  },
  filename(req, file, cb) {
    cb(null, file.originalname.replace(/ /g, '_'));
  },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname)
    if (ext !== '.jpg' && ext !== '.png' && ext !== '.mp4') {
      return cb(res.status(400).end('Only jpg, png and mp4 is allowed'), false);
    }
    cb(null, true)
  }
});

const upload = multer({ storage });

const uploadRouter = express.Router();

uploadRouter.post(
  '/local',
  isAuth,
  upload.single('file'), async(req, res) => {
    try {
      const file = req.file;
      console.log(file)
      if (!file) {
        console.log(error)
        return res.status(400).send({ error: 'Please upload a file' });
      } else {
        console.log("file uploaded")
        return res.status(200).send({
          status: true, 
          file,
        });
      }
    } catch (error) {
      console.log(error)
      return res.status(404).send(error);
    }

  }
)

export default uploadRouter;