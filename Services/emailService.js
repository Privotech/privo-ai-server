const { sendEmail } = require('../Configs/mailer');

async function sendWelcomeEmail(user) {
  if (!user?.email) return { ok: false };
  const subject = 'Welcome to Privo AI';
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome, ${user.name || 'there'}!</h2>
      <p>Thanks for joining Privo AI. You're all set to start chatting.</p>
      <p>If this wasn't you, you can safely ignore this email.</p>
    </div>
  `;
  try {
    await sendEmail({ to: user.email, subject, html });
    return { ok: true };
  } catch (e) {
    console.warn('Failed to send welcome email:', e?.message || e);
    return { ok: false };
  }
}

module.exports = { sendWelcomeEmail };