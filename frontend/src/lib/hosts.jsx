// Which links point at this deployment rather than another site.
// The site and app hosts come from the SITE_URL / APP_URL build settings;
// old getmedes.com links (still present in imported lessons) count as ours.
const hostOf = (url) => {
  try { return new URL(url).hostname.toLowerCase(); } catch (e) { return ''; }
};
const SITE_HOST = hostOf(import.meta.env.SITE_URL);
const APP_HOST = hostOf(import.meta.env.APP_URL);
const LEGACY = /(^|\.)getmedes\.com$/;
const LOCAL = /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/;

export function isOwnHost(hostname) {
  const h = (hostname || '').toLowerCase();
  if (!h) return false;
  return h === location.hostname || h === SITE_HOST || h === APP_HOST || LEGACY.test(h) || LOCAL.test(h);
}

// Links into the web app itself (as opposed to the marketing site).
export function isAppHost(hostname) {
  const h = (hostname || '').toLowerCase();
  return h === location.hostname || h === APP_HOST || h === 'app.getmedes.com';
}

// "https://<one of our hosts>/…/lessons/<slug-or-id>" -> "<slug-or-id>"
export function ownLessonSlug(url) {
  try {
    const u = new URL(url, location.href);
    if (!isOwnHost(u.hostname)) return null;
    const m = u.pathname.match(/\/lessons\/([^\/#?]+)/);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}
