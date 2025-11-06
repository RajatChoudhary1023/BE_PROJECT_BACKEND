const admin = require('../firebase/firebase')

const verifyFirebaseToken = async (req, res, next) => {
  const token = req.header("Authorization")?.split("Bearer ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // contains uid, email, etc.
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return res.status(401).json({ message: "Invalid Firebase token" });
  }
};

module.exports = verifyFirebaseToken;
