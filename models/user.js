const mongoose = require("mongoose");
const mongoValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      type: String,
      required: true,
      trim: true,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    isSuperUser: {
      type: Boolean,
      default: false,
    },

    // New fields added
    personInCharge: {
      type: String,
      required: true,
      trim: true,
    },

    personInChargePosition: {
      type: String,
      required: true,
      trim: true,
    },

    reportingTo: {
      type: String,
      required: true,
      trim: true,
    },

    reportingToPosition: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    leaveDate: [
      {
        startDate: { type: String, default: "" },
        endDate: { type: String, default: "" },
        leave_status: { type: String, default: "pending" },
        leaveDays: { type: Number, default: 0 },
      },
    ],

    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

userSchema.plugin(mongoValidator);

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;