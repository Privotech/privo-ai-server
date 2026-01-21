module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Unexpected error';
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }
  res.status(status).json({ ok: false, error: message });
};