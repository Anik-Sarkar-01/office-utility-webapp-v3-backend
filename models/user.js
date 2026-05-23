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

    dateOfBirth: {
      type: Date,
      required: true,
    },

    isSuperUser: {
      type: Boolean,
      default: false,
    },

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

    // ── Leave balance (HR can edit anytime) ──────────────────────────────
    leaveBalance: {
      annual:      { type: Number, default: 15 },
      sick:        { type: Number, default: 10 },
      casual:      { type: Number, default: 8  },
      replacement: { type: Number, default: 0  },
    },

    // ── Leave applications ───────────────────────────────────────────────
    leaveApplications: [
      {
        // What the employee filled in
        leaveType:       { type: String, required: true },   // "Annual"|"Sick"|"Casual"|"Replacement"|"Without Pay"
        startDate:       { type: String, required: true },   // YYYY-MM-DD
        endDate:         { type: String, required: true },   // YYYY-MM-DD
        leaveDays:       { type: Number, required: true },
        halfDay:         { type: String, default: "Not Required" },
        reason:          { type: String, default: "" },

        // Contact & coverage (from the form)
        station:         { type: String, default: "" },
        contact:         { type: String, default: "" },
        personInCharge:  { type: String, default: "" },
        reportingTo:     { type: String, default: "" },

        // Status flow
        status:          { type: String, default: "pending" }, // "pending"|"approved"|"declined"
        appliedAt:       { type: Date,   default: Date.now },
        decidedAt:       { type: Date },
        decidedBy:       { type: String },  // HR user name who acted
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