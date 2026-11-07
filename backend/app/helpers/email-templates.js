// The app's emails. Each template turns `data` into { subject, html, text }.
// These replace the SendGrid dynamic templates, which lived in the old
// company's SendGrid account.
//
// Anything that comes from users (names, company names) is escaped for HTML,
// and subjects are kept to a single line.

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const oneLine = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
const firstName = (name) => oneLine(name).split(' ')[0] || '';
const greeting = (name) => (firstName(name) ? `Hi ${firstName(name)},` : 'Hi,');

// Only http(s) links are ever put in a button.
const safeUrl = (url) => (/^https?:\/\//i.test(String(url || '')) ? String(url) : '');

function layout({ heading, paragraphs, button, footer }) {
  const url = button && safeUrl(button.url);
  const html = `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#f4f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a2132;">
<tr><td style="font-size:20px;font-weight:700;padding-bottom:20px;color:#1a2132;">&#9819; Archimedes</td></tr>
<tr><td style="font-size:22px;font-weight:700;line-height:1.3;padding-bottom:12px;">${escapeHtml(heading)}</td></tr>
${paragraphs.map((p) => `<tr><td style="font-size:16px;line-height:1.55;padding-bottom:14px;">${escapeHtml(p)}</td></tr>`).join('\n')}
${url ? `<tr><td style="padding:10px 0 22px;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#1a2132;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:999px;">${escapeHtml(button.label)}</a></td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#5b6475;padding-bottom:14px;">If the button doesn't work, copy this link into your browser:<br><a href="${escapeHtml(url)}" style="color:#3542BA;word-break:break-all;">${escapeHtml(url)}</a></td></tr>` : ''}
${footer ? `<tr><td style="font-size:13px;line-height:1.5;color:#5b6475;border-top:1px solid #e6e8ee;padding-top:16px;">${escapeHtml(footer)}</td></tr>` : ''}
</table>
</td></tr></table>
</body></html>`;
  const text = [
    heading,
    '',
    ...paragraphs.flatMap((p) => [p, '']),
    ...(url ? [`${button.label}: ${url}`, ''] : []),
    ...(footer ? ['--', footer] : []),
  ].join('\n').trim() + '\n';
  return { html, text };
}

const TEMPLATES = {
  // Sign-up: confirm the email address.
  verification: ({ url }) => ({
    subject: 'Confirm your email for Archimedes',
    heading: 'Confirm your email',
    paragraphs: [
      'Thanks for signing up for Archimedes. Confirm your email address to finish creating your account.',
    ],
    button: { label: 'Confirm email', url },
    footer: "If you didn't sign up for Archimedes, you can ignore this email.",
  }),

  // Sign-up while access is gated.
  waitlist: () => ({
    subject: "You're on the Archimedes waitlist",
    heading: "You're on the waitlist",
    paragraphs: [
      'Thanks for your interest in Archimedes. We\'ll email you as soon as your account is ready.',
    ],
    footer: "If you didn't sign up for Archimedes, you can ignore this email.",
  }),

  // A waitlisted account was approved.
  waitlistApproval: ({ url }) => ({
    subject: 'Welcome to Archimedes!',
    heading: 'Your account is ready',
    paragraphs: [
      'Good news: you now have access to Archimedes. Jump in to start your first lesson.',
    ],
    button: { label: 'Open Archimedes', url },
  }),

  passwordReset: ({ url, user }) => ({
    subject: 'Reset your Archimedes password',
    heading: 'Reset your password',
    paragraphs: [
      greeting(user && user.name),
      'We received a request to reset your Archimedes password. The link below works once and expires in 24 hours.',
    ],
    button: { label: 'Choose a new password', url },
    footer: "If you didn't ask to reset your password, you can ignore this email. Your password won't change.",
  }),

  // Company workspace invite, for someone who already has an account.
  companyInviteExisting: ({ url, user, inviter, company }) => ({
    subject: `${oneLine(inviter && inviter.name)} invited you to join the ${oneLine(company && company.name)} workspace on Archimedes`,
    heading: `Join ${oneLine(company && company.name)} on Archimedes`,
    paragraphs: [
      greeting(user && user.name),
      `${oneLine(inviter && inviter.name)} invited you to join the ${oneLine(company && company.name)} workspace on Archimedes.`,
    ],
    button: { label: 'Accept invite', url },
  }),

  // Company workspace invite, for someone new to Archimedes.
  companyInviteNew: ({ url, inviter, company }) => ({
    subject: `${oneLine(inviter && inviter.name)} invited you to the ${oneLine(company && company.name)} workspace on Archimedes`,
    heading: `Join ${oneLine(company && company.name)} on Archimedes`,
    paragraphs: [
      `${oneLine(inviter && inviter.name)} invited you to the ${oneLine(company && company.name)} workspace on Archimedes, where you can learn about investing through short lessons, games and expert videos.`,
    ],
    button: { label: 'Accept invite', url },
  }),

  // A user invited a friend.
  friendInvite: ({ url, inviter }) => ({
    subject: `${oneLine(inviter && inviter.name)} invited you to join Archimedes`,
    heading: `${firstName(inviter && inviter.name) || 'A friend'} invited you to Archimedes`,
    paragraphs: [
      `${oneLine(inviter && inviter.name)} thinks you'd like Archimedes, a free way to learn about investing through short lessons, games and expert videos.`,
    ],
    button: { label: 'Accept invite', url },
  }),

  // Reminder for an invite that hasn't been accepted after a week.
  inviteReminder: ({ url, inviter }) => ({
    subject: `Reminder: ${oneLine(inviter && inviter.name)} invited you to Archimedes`,
    heading: 'Your invite is still waiting',
    paragraphs: [
      `${oneLine(inviter && inviter.name)} invited you to Archimedes last week. Your invite is still open.`,
    ],
    button: { label: 'Accept invite', url },
  }),

  // Internal notice to the site owner (waitlist and demo-request forms).
  internalNotice: ({ title, lines }) => ({
    subject: `[Archimedes] ${oneLine(title)}`,
    heading: oneLine(title),
    paragraphs: (lines || []).map(oneLine).filter(Boolean),
  }),

  // Reminder for people who signed up but never got going.
  limboReminder: ({ url, user }) => ({
    subject: 'Pick up where you left off on Archimedes',
    heading: 'Ready for your first lesson?',
    paragraphs: [
      greeting(user && (user.name || user.firstName)),
      'You signed up for Archimedes but haven\'t started yet. Lessons take about 10 minutes, and the first one is waiting for you.',
    ],
    button: { label: 'Start learning', url },
  }),
};

export const EMAIL_TEMPLATES = Object.keys(TEMPLATES);

export function renderEmail(template, data) {
  const build = TEMPLATES[template];
  if (!build) throw new Error(`Unknown email template "${template}"`);
  const spec = build(data || {});
  const { html, text } = layout(spec);
  return { subject: oneLine(spec.subject), html, text };
}
