const bcrypt = require('bcrypt');
const User = require('../Models/User');
const { signToken } = require('../Utils/jwt');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ ok: false, error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, provider: 'local', emailVerified: false });
    const token = signToken({ sub: user._id.toString(), email: user.email, name: user.name });
    // Fire-and-forget welcome email
    try {
      const { sendWelcomeEmail } = require('../Services/emailService');
      sendWelcomeEmail(user).catch(() => {});
    } catch {}
    res.json({ ok: true, token, user: { id: user._id, name: user.name, email: user.email, provider: user.provider } });
  } catch (err) {
    next(err);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    const token = signToken({ sub: user._id.toString(), email: user.email, name: user.name });
    res.json({ ok: true, token, user: { id: user._id, name: user.name, email: user.email, provider: user.provider } });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user.sub).lean();
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, provider: user.provider, emailVerified: !!user.emailVerified } });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to load user' });
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { name } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    user.name = name;
    await user.save();
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, provider: user.provider } });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
    if (user.provider !== 'local' || !user.passwordHash) {
      return res.status(400).json({ ok: false, error: 'Password change not available for social login accounts' });
    }
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(401).json({ ok: false, error: 'Current password is incorrect' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};