const userModel = require("../models/user");

/* ─────────────────────────────────────────────────────────────
   Helper: which balance key maps to which leaveType string
───────────────────────────────────────────────────────────── */
const BALANCE_KEY_MAP = {
  Annual:      "annual",
  Sick:        "sick",
  Casual:      "casual",
  Replacement: "replacement",
  "Without Pay": null,   // no balance to deduct
};


/* ─────────────────────────────────────────────────────────────
   POST /api/leaves/apply/:uid
   Employee submits a leave application
───────────────────────────────────────────────────────────── */
const applyForLeave = async (req, res) => {
  const uid = req.params.uid;
  const {
    leaveType, startDate, endDate, leaveDays,
    halfDay, reason, station, contact, personInCharge, reportingTo,
  } = req.body;

  // Basic validation
  if (!leaveType || !startDate || !endDate || !leaveDays) {
    return res.status(400).json({ message: "Missing required leave fields.", success: false });
  }

  try {
    const user = await userModel.findById(uid);
    if (!user) return res.status(404).json({ message: "User not found.", success: false });

    // Check sufficient balance (skip for "Without Pay")
    const balKey = BALANCE_KEY_MAP[leaveType];
    if (balKey !== undefined && balKey !== null) {
      const available = user.leaveBalance?.[balKey] ?? 0;
      if (Number(leaveDays) > available) {
        return res.status(400).json({
          message: `Insufficient ${leaveType} leave balance. Available: ${available} day(s).`,
          success: false,
        });
      }
    }

    user.leaveApplications.push({
      leaveType,
      startDate,
      endDate,
      leaveDays: Number(leaveDays),
      halfDay:   halfDay || "Not Required",
      reason:    reason  || "",
      station:   station || "",
      contact:   contact || "",
      personInCharge: personInCharge || "",
      reportingTo:    reportingTo    || "",
      status:    "pending",
      appliedAt: new Date(),
    });

    await user.save();

    return res.status(201).json({
      message: "Leave application submitted successfully.",
      success: true,
    });
  } catch (err) {
    console.error("applyForLeave error:", err);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};


/* ─────────────────────────────────────────────────────────────
   GET /api/leaves/all
   HR: get every pending (or all) leave application across all users
   Query param: ?status=pending|approved|declined|all  (default: all)
───────────────────────────────────────────────────────────── */
const getAllLeaveApplications = async (req, res) => {
  const { status } = req.query; // optional filter

  try {
    const users = await userModel
      .find({ "leaveApplications.0": { $exists: true } })
      .select("name employeeId department position leaveApplications leaveBalance");

    // Flatten into a list of { ...application, employeeName, employeeId, dept, userId }
    let applications = [];
    users.forEach((u) => {
      u.leaveApplications.forEach((app) => {
        if (!status || status === "all" || app.status === status) {
          applications.push({
            _id:          app._id,
            userId:       u._id,
            employeeName: u.name,
            employeeId:   u.employeeId,
            department:   u.department,
            position:     u.position,
            leaveType:    app.leaveType,
            startDate:    app.startDate,
            endDate:      app.endDate,
            leaveDays:    app.leaveDays,
            halfDay:      app.halfDay,
            reason:       app.reason,
            station:      app.station,
            contact:      app.contact,
            personInCharge: app.personInCharge,
            reportingTo:    app.reportingTo,
            status:       app.status,
            appliedAt:    app.appliedAt,
            decidedAt:    app.decidedAt,
            decidedBy:    app.decidedBy,
          });
        }
      });
    });

    // Sort newest first
    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    return res.status(200).json({ success: true, applications });
  } catch (err) {
    console.error("getAllLeaveApplications error:", err);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};


/* ─────────────────────────────────────────────────────────────
   GET /api/leaves/my-applications/:uid
   Employee: fetch their own leave history + balance
───────────────────────────────────────────────────────────── */
const getMyLeaveData = async (req, res) => {
  const uid = req.params.uid;
  try {
    const user = await userModel
      .findById(uid)
      .select("leaveApplications leaveBalance name employeeId department");

    if (!user) return res.status(404).json({ message: "User not found.", success: false });

    return res.status(200).json({
      success: true,
      leaveBalance:    user.leaveBalance,
      leaveApplications: user.leaveApplications.sort(
        (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)
      ),
    });
  } catch (err) {
    console.error("getMyLeaveData error:", err);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};


/* ─────────────────────────────────────────────────────────────
   PATCH /api/leaves/decide/:userId/:leaveId
   HR: approve or decline a specific application
   Body: { action: "approved" | "declined", decidedBy: "HR Name" }
───────────────────────────────────────────────────────────── */
const decideLeave = async (req, res) => {
  const { userId, leaveId } = req.params;
  const { action, decidedBy } = req.body;

  if (!["approved", "declined"].includes(action)) {
    return res.status(400).json({ message: "action must be 'approved' or 'declined'.", success: false });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found.", success: false });

    const app = user.leaveApplications.id(leaveId);
    if (!app) return res.status(404).json({ message: "Leave application not found.", success: false });
    if (app.status !== "pending") {
      return res.status(409).json({ message: `Leave is already ${app.status}.`, success: false });
    }

    // If approving → deduct balance
    if (action === "approved") {
      const balKey = BALANCE_KEY_MAP[app.leaveType];
      if (balKey) {
        const available = user.leaveBalance?.[balKey] ?? 0;
        if (app.leaveDays > available) {
          return res.status(400).json({
            message: `Cannot approve: insufficient ${app.leaveType} balance (${available} day(s) left).`,
            success: false,
          });
        }
        user.leaveBalance[balKey] = parseFloat((available - app.leaveDays).toFixed(2));
      }
    }

    app.status    = action;
    app.decidedAt = new Date();
    app.decidedBy = decidedBy || "HR";

    await user.save();

    return res.status(200).json({
      message:      `Leave ${action} successfully.`,
      success:      true,
      leaveBalance: user.leaveBalance,
    });
  } catch (err) {
    console.error("decideLeave error:", err);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};


/* ─────────────────────────────────────────────────────────────
   PATCH /api/leaves/balance/:userId
   HR: manually set leave balance for a user
   Body: { annual, sick, casual, replacement }  (all optional)
───────────────────────────────────────────────────────────── */
const updateLeaveBalance = async (req, res) => {
  const { userId } = req.params;
  const { annual, sick, casual, replacement } = req.body;

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found.", success: false });

    if (annual      !== undefined) user.leaveBalance.annual      = Number(annual);
    if (sick        !== undefined) user.leaveBalance.sick        = Number(sick);
    if (casual      !== undefined) user.leaveBalance.casual      = Number(casual);
    if (replacement !== undefined) user.leaveBalance.replacement = Number(replacement);

    await user.save();

    return res.status(200).json({
      message:      "Leave balance updated.",
      success:      true,
      leaveBalance: user.leaveBalance,
    });
  } catch (err) {
    console.error("updateLeaveBalance error:", err);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/leaves/:userId/:leaveId
   Employee: delete a pending leave application
───────────────────────────────────────────────────────────── */
const deleteLeaveApplication = async (req, res) => {
  const { userId, leaveId } = req.params;
  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found.", success: false });

    const app = user.leaveApplications.id(leaveId);
    if (!app) return res.status(404).json({ message: "Leave application not found.", success: false });
    if (app.status !== "pending") {
      return res.status(409).json({ message: `Only pending leaves can be deleted. This leave is ${app.status}.`, success: false });
    }

    app.deleteOne();
    await user.save();

    return res.status(200).json({ message: "Leave application deleted.", success: true });
  } catch (err) {
    console.error("deleteLeaveApplication error:", err);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};


/* ─────────────────────────────────────────────────────────────
   PUT /api/leaves/:userId/:leaveId
   Employee: edit a pending leave application
───────────────────────────────────────────────────────────── */
const updateLeaveApplication = async (req, res) => {
  const { userId, leaveId } = req.params;
  const {
    leaveType, startDate, endDate, leaveDays,
    halfDay, reason, station, contact, personInCharge, reportingTo,
  } = req.body;

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found.", success: false });

    const app = user.leaveApplications.id(leaveId);
    if (!app) return res.status(404).json({ message: "Leave application not found.", success: false });
    if (app.status !== "pending") {
      return res.status(409).json({ message: `Only pending leaves can be edited. This leave is ${app.status}.`, success: false });
    }

    // Update fields
    if (leaveType)      app.leaveType      = leaveType;
    if (startDate)      app.startDate      = startDate;
    if (endDate)        app.endDate        = endDate;
    if (leaveDays)      app.leaveDays      = Number(leaveDays);
    if (halfDay)        app.halfDay        = halfDay;
    if (reason)         app.reason         = reason;
    if (station)        app.station        = station;
    if (contact)        app.contact        = contact;
    if (personInCharge) app.personInCharge = personInCharge;
    if (reportingTo)    app.reportingTo    = reportingTo;

    await user.save();

    return res.status(200).json({ message: "Leave application updated.", success: true });
  } catch (err) {
    console.error("updateLeaveApplication error:", err);
    return res.status(500).json({ message: "Internal server error.", success: false });
  }
};


module.exports = {
  applyForLeave,
  getAllLeaveApplications,
  getMyLeaveData,
  decideLeave,
  updateLeaveBalance,
  deleteLeaveApplication,
  updateLeaveApplication,
};