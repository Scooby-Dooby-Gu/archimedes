// Where this deployment lives. Configure per environment instead of
// hardcoding a domain:
//   SITE_URL     public marketing site (e.g. https://archimedes.gufamily.org)
//   APP_URL      the web app (e.g. https://app.archimedes.gufamily.org)
//   EMAIL_FROM   verified sender address for outgoing email
//   EMAIL_FROM_NAME, CONTACT_EMAIL
const trim = (u) => (u || '').replace(/\/+$/, '');
export const appUrl = () => trim(process.env.APP_URL);
export const siteUrl = () => trim(process.env.SITE_URL) || appUrl();
export const emailFrom = () => ({
  email: process.env.EMAIL_FROM || process.env.CONTACT_EMAIL || 'no-reply@example.com',
  name: process.env.EMAIL_FROM_NAME || 'Archimedes',
});
export const contactEmail = () => process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || '';
