// backend/fcm.js
const admin = require('../firebase/firebase')
/**
 * Send a simple notification to a single token
 * @param {string} token FCM device token
 * @param {string} title notification title
 * @param {string} body notification body
 * @param {Object} data optional key-value data payload
 */
async function sendFCM(token, title, body, data = {}) {
  if (!token) return null;
  const message = {
    token,
    notification: { title, body },
    data: Object.keys(data || {}).reduce((acc, k) => {
      acc[k] = String(data[k]);
      return acc;
    }, {}),
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } },
  };

  try {
    const resp = await admin.messaging().send(message);
    return resp; // messageId
  } catch (err) {
    // Typical errors: invalid-registration-token, message-rate-exceeded
    console.error("sendFCM error:", err);
    throw err;
  }
}

module.exports = { sendFCM };
