require("dotenv").config();
const { validationResult } = require("express-validator");
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("./hashingController");

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.uid).select("-password");
    if (!user) return res.status(404).json({ message: "User not found", success: false });
    res.status(200).json({ message: "User Found!", success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Signup
const newUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });

  const {
    email,
    password,
    name,
    position,
    department,
    employeeId,
    isSuperUser,
    address,
    dateOfBirth,
    phone,
    joiningDate,
    personInCharge,
    personInChargePosition,
    reportingTo,
    reportingToPosition,
  } = req.body;

  try {
    // Check email OR employeeId already exists
    const existingUser = await userModel.findOne({
      $or: [{ email }, { employeeId }],
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.email === email
            ? "Email already exists"
            : "Employee ID already exists",
        success: false,
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = new userModel({
      email,
      password: hashedPassword,
      name,
      employeeId,
      department,
      position,
      isSuperUser: !!isSuperUser,
      address,
      phone,
      joiningDate,
      dateOfBirth,
      personInCharge,
      personInChargePosition,
      reportingTo,
      reportingToPosition,
      image: "uploads/images/user-default.jpg",
    });

    await user.save();

    res.status(201).json({
      message: "Employee registered successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};


// Login
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid password", success: false });

    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Login Successful",
      success: true,
      user: { ...user.toObject(), password: undefined },
      token
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

// Display all users
const displayUser = async (req, res) => {
  try {
    const users = await userModel.find({}).select("-password");
    res.status(200).json({ success: true, user: users });
  } catch {
    res.status(404).json({ message: "No users found", success: false });
  }
};

// Edit user
const editEmployee = async (req, res) => {
  const uid = req.params.uid;
  try {
    const user = await userModel.findById(uid);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    Object.assign(user, req.body);
    user.image = req?.file?.path || user.image || "uploads/images/user-default.jpg";

    await user.save();
    res.status(200).json({ message: "User updated successfully!", success: true });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

module.exports = {
  newUser,
  loginUser,
  displayUser,
  editEmployee,
  getUserById
};
