module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Unexpected error';
  // Always log in dev; in production log without stack
  console.error('[%s] %s %s → %d %s', new Date().toISOString(), req.method, req.originalUrl, status, message);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }
  res.status(status).json({ ok: false, error: message });
};