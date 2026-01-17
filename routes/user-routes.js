const express = require("express");
const {
  displayUser,
  editEmployee,
  getUserById,
} = require("../controllers/userController");
const fileUpload = require("../middleware/file-upload");
// const checkAuth = require("../middleware/check-auth");

const userRoutes = express.Router();

// All routes below require authentication
// userRoutes.use(checkAuth);

// Get all users
userRoutes.get("/", displayUser);

// Get user by ID
userRoutes.get("/:uid", getUserById);

// Edit user (with file upload)
userRoutes.patch("/editEmployee/:uid", fileUpload.single("image"), editEmployee);

module.exports = userRoutes;
