// routes/leaveRoutes.js

const express = require("express");
const {
  applyForLeave,
  getAllLeaveApplications,
  getMyLeaveData,
  decideLeave,
  updateLeaveBalance,
  deleteLeaveApplication,
  updateLeaveApplication,
} = require("../controllers/leaveController"); 

const generateLeaveForm = require("../services/leaveFormGenerator");

const leaveRoutes = express.Router();

// ── PDF form generator ───────────────────────────────────────────────────────
leaveRoutes.post("/generate-form", async (req, res, next) => {
  try {
    const pdfBuffer = await generateLeaveForm(req.body);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=LeaveApplicationForm.pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// ── Employee routes ──────────────────────────────────────────────────────────

// Submit a leave application
leaveRoutes.post("/apply/:uid", applyForLeave);

// Get own leave history + balance (used in leave form page)
leaveRoutes.get("/my-applications/:uid", getMyLeaveData);

// ── HR / Admin routes ────────────────────────────────────────────────────────

// Get all applications (optional ?status=pending|approved|declined|all)
leaveRoutes.get("/all", getAllLeaveApplications);

// Approve or decline a specific application
leaveRoutes.patch("/decide/:userId/:leaveId", decideLeave);

// Manually update a user's leave balance
leaveRoutes.patch("/balance/:userId", updateLeaveBalance);

// Update leave application
leaveRoutes.put("/:userId/:leaveId", updateLeaveApplication);

// delete leave application
leaveRoutes.delete("/:userId/:leaveId", deleteLeaveApplication);

module.exports = leaveRoutes;