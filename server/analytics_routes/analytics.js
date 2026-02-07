const express = require("express");
const router = express.Router();
const Transaction = require("../Transaction_Models/transaction");
const User = require("../Models/auth");
const Retailer = require("../Retailer_Models/auth");
const verify_firebase = require("../Middleware/verify-firebase");


// ==============================
// 🧍 USER ANALYTICS
// ==============================

/**
 * 1️⃣ User Spending Summary
 * GET /analytics/user/summary
 */
router.get("/user/summary", verify_firebase, async (req, res) => {
    // router.get("/user/summary", async (req, res) => {
  try {
    const { email } = req.user;
    // const email="c.rajat1006@gmail.com"
    const user = await User.findOne({ email });

    const result = await Transaction.aggregate([
      { $match: { from_user: user._id, status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          total_spent: { $sum: "$amount" },
          total_transactions: { $sum: 1 },
          average_transaction: { $avg: "$amount" },
        },
      },
    ]);

    res.json({
      success: true,
      total_spent: result[0]?.total_spent || 0,
      total_transactions: result[0]?.total_transactions || 0,
      average_transaction: Math.round(result[0]?.average_transaction || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


/**
 * 2️⃣ User Monthly Spend
 * GET /analytics/user/monthly
 */
router.get("/user/monthly", verify_firebase, async (req, res) => {
    // router.get("/user/monthly", async (req, res) => {
  try {
    const { email } = req.user;
    // const email="c.rajat1006@gmail.com"
    const user = await User.findOne({ email });

    const data = await Transaction.aggregate([
      { $match: { from_user: user._id, status: "SUCCESS" } },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            month: { $month: "$created_at" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      data: data.map((d) => ({
        month: `${d._id.year}-${String(d._id.month).padStart(2, "0")}`,
        total: d.total,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


/**
 * 3️⃣ User Recent Payments
 * GET /analytics/user/recent
 */
router.get("/user/recent", verify_firebase, async (req, res) => {
    // router.get("/user/recent", async (req, res) => {
  try {
    const { email } = req.user;
    // const email="c.rajat1006@gmail.com"
    const user = await User.findOne({ email });

    const txns = await Transaction.find({ from_user: user._id })
      .sort({ created_at: -1 })
      .limit(10)
      .populate("to_retailer", "shop_name");

    res.json({
      success: true,
      transactions: txns.map((t) => ({
        amount: t.amount,
        retailer: t.to_retailer.shop_name,
        date: t.created_at,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


// ==============================
// 🏪 RETAILER ANALYTICS
// ==============================

/**
 * 4️⃣ Retailer Revenue Summary
 * GET /analytics/retailer/summary
 */
router.get("/retailer/summary", verify_firebase, async (req, res) => {
// router.get("/retailer/summary", async (req, res) => {
  try {
    const { email } = req.user;
    // const email="sharma@gmail.com"
    const retailer = await Retailer.findOne({ email });

    const result = await Transaction.aggregate([
      { $match: { to_retailer: retailer._id, status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: "$amount" },
          total_transactions: { $sum: 1 },
          average_bill: { $avg: "$amount" },
        },
      },
    ]);

    res.json({
      success: true,
      total_revenue: result[0]?.total_revenue || 0,
      total_transactions: result[0]?.total_transactions || 0,
      average_bill: Math.round(result[0]?.average_bill || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


/**
 * 5️⃣ Retailer Daily Revenue (Last 7 days)
 * GET /analytics/retailer/daily
 */
router.get("/retailer/daily", verify_firebase, async (req, res) => {
    // router.get("/retailer/daily", async (req, res) => {
  try {
    const { email } = req.user;
    // const email="sharma@gmail.com"
    const retailer = await Retailer.findOne({ email });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await Transaction.aggregate([
      {
        $match: {
          to_retailer: retailer._id,
          created_at: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            month: { $month: "$created_at" },
            day: { $dayOfMonth: "$created_at" },
          },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({
      success: true,
      data: data.map((d) => ({
        date: `${d._id.year}-${d._id.month}-${d._id.day}`,
        revenue: d.revenue,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


/**
 * 6️⃣ Retailer Peak Hours
 * GET /analytics/retailer/peak-hours
 */
router.get("/retailer/peak-hours", verify_firebase, async (req, res) => {
    // router.get("/retailer/peak-hours", async (req, res) => {
  try {
    const { email } = req.user;
    // const email="sharma@gmail.com"
    const retailer = await Retailer.findOne({ email });

    const data = await Transaction.aggregate([
      { $match: { to_retailer: retailer._id } },
      {
        $group: {
          _id: { $hour: "$created_at" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: data.map((d) => ({
        hour: d._id,
        transactions: d.count,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
