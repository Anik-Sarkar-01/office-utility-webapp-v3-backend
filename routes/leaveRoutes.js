const express = require("express");
const {
  applyForLeave,
  approveLeave,
  leaveEmployee,
  pastLeaves,
} = require("../controllers/leaveContoller");

const generateLeaveForm = require("../services/leaveFormGenerator");

const leaveRoutes = express.Router();

// Existing routes
leaveRoutes.get("/applied-leave", leaveEmployee);

leaveRoutes.patch("/applyForleave/:uid", applyForLeave);
leaveRoutes.patch("/approve-leave/:leaveId", approveLeave);

leaveRoutes.post("/generate-form", async (req, res, next) => {
  console.log("I am in the leave routes");

  try {
    // This is already a Buffer
    const pdfBuffer = await generateLeaveForm(req.body);

    console.log("PDF size:", pdfBuffer.length); // DEBUG (remove later)

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=LeaveApplicationForm.pdf"
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    next(error);
  }
});


module.exports = leaveRoutes;
