// Where this deployment lives. Configure per environment instead of
// hardcoding a domain:
//   SITE_URL     public marketing site (e.g. https://archimedes.gufamily.org)
//   APP_URL      the web app (e.g. https://app.archimedes.gufamily.org)
//   EMAIL_FROM   verified sender address for outgoing email
//   EMAIL_FROM_NAME, CONTACT_EMAIL
//   EMAIL_REPLY_TO  where replies go, if EMAIL_FROM's domain has no inbox
const trim = (u) => (u || '').replace(/\/+$/, '');
export const appUrl = () => trim(process.env.APP_URL);
export const siteUrl = () => trim(process.env.SITE_URL) || appUrl();
export const emailFrom = () => ({
  email: process.env.EMAIL_FROM || process.env.CONTACT_EMAIL || 'no-reply@example.com',
  name: process.env.EMAIL_FROM_NAME || 'Archimedes',
});
export const contactEmail = () => process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || '';
// Replies: the first valid address of EMAIL_REPLY_TO, CONTACT_EMAIL (a real
// inbox), then the sender itself.
const isAddress = (value) => /^[^\s@<>",]+@[^\s@<>",]+\.[^\s@<>",]+$/.test(value);
export const emailReplyTo = () => {
  for (const candidate of [process.env.EMAIL_REPLY_TO, process.env.CONTACT_EMAIL]) {
    const value = (candidate || '').trim();
    if (isAddress(value)) return value;
  }
  return emailFrom().email;
};
