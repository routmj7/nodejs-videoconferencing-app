const { ObjectID } = require("mongodb");
const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");
mongoose.pluralize(null);
const validator = require("validator");

const attendanceSchema = new mongoose.Schema({

  _id: {
    type: ObjectID,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new error("Email is invalid");
      }
    },
  },
  arrivalTime: {
    type: String,
  },
  leaveTime: {
    type: String,
    default: "have not left yet"
  },
}, {_id: false});

// const Room = mongoose.model('room', rollSchema);
const Room = (roomId) => {
  console.log("attendance saved");
  return mongoose.model(roomId, attendanceSchema);
};

module.exports = Room;
