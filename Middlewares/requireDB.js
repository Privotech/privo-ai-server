const mongoose = require('mongoose');

/** Use before handlers that need MongoDB. Sends 503 if DB is not connected. */
module.exports = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      ok: false,
      error: 'Database not connected. Set MONGO_URI in server/.env and ensure MongoDB is reachable.',
    });
  }
  next();
};
