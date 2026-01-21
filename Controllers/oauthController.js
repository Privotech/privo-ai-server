function getAxios() {
  try { return require('axios'); }
  catch (e) { throw new Error('axios is required for OAuth providers. Run: npm install axios'); }
}
const User = require('../Models/User');
const { signToken, verifyToken } = require('../Utils/jwt');
const { sendWelcomeEmail } = require('../Services/emailService');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function makeState(provider, redirect) {
  return signToken({ p: provider, r: redirect || `${CLIENT_URL}/oauth/callback` }, { expiresIn: '10m' });
}

function parseState(state) {
  try {
    return verifyToken(state);
  } catch (e) {
    return null;
  }
}

async function finalizeLogin(res, user, isNew, redirect) {
  const token = signToken({ sub: user._id.toString(), email: user.email, name: user.name });
  if (isNew) {
    // non-blocking welcome email
    sendWelcomeEmail(user).catch(() => {});
  }
  const to = redirect || `${CLIENT_URL}/oauth/callback`;
  const url = new URL(to);
  url.searchParams.set('token', token);
  res.redirect(url.toString());
}

// GOOGLE
exports.googleStart = async (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;
  const state = makeState('google', req.query.redirect);
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'consent');
  res.redirect(authUrl.toString());
};

exports.googleCallback = async (req, res, next) => {
  try {
    const axios = getAxios();
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
    const { code, state } = req.query;
    const s = parseState(state);
    if (!s || s.p !== 'google') return res.status(400).send('Invalid state');

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = tokenRes.data.access_token;

    const userinfo = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { sub, email, name } = userinfo.data;
    if (!email) return res.status(400).send('Google account has no email');

    let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });
    // Enforce signup-first: do not auto-create
    if (!user) {
      const q = new URL(`${CLIENT_URL}/signup`);
      if (name) q.searchParams.set('name', name);
      q.searchParams.set('email', email);
      return res.redirect(q.toString());
    }

    user.googleId = user.googleId || sub;
    user.provider = 'google';
    user.emailVerified = true;
    await user.save();

    await finalizeLogin(res, user, false, s.r);
  } catch (err) {
    next(err);
  }
};



// GITHUB
exports.githubStart = async (req, res) => {
  const { GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } = process.env;
  const state = makeState('github', req.query.redirect);
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI);
  authUrl.searchParams.set('scope', 'read:user user:email');
  authUrl.searchParams.set('state', state);
  res.redirect(authUrl.toString());
};

exports.githubCallback = async (req, res, next) => {
  try {
    const axios = getAxios();
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } = process.env;
    const { code, state } = req.query;
    const s = parseState(state);
    if (!s || s.p !== 'github') return res.status(400).send('Invalid state');

    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: 'application/json' } }
    );
    const accessToken = tokenRes.data.access_token;

    const profileRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
    });
    const emailsRes = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
    });

    const primaryEmailObj = (emailsRes.data || []).find(e => e.primary && e.verified) || (emailsRes.data || [])[0];
    const email = primaryEmailObj?.email;
    const name = profileRes.data?.name || profileRes.data?.login;
    const id = String(profileRes.data?.id || '');
    if (!email) return res.status(400).send('GitHub account has no accessible email');

    let user = await User.findOne({ $or: [{ githubId: id }, { email }] });
    // Enforce signup-first: do not auto-create
    if (!user) {
      const q = new URL(`${CLIENT_URL}/signup`);
      if (name) q.searchParams.set('name', name);
      q.searchParams.set('email', email);
      return res.redirect(q.toString());
    }

    user.githubId = user.githubId || id;
    user.provider = 'github';
    user.emailVerified = true;
    await user.save();

    await finalizeLogin(res, user, false, s.r);
  } catch (err) {
    next(err);
  }
};