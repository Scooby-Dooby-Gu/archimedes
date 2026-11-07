// Outgoing email through Resend (https://resend.com), replacing SendGrid.
//
//   sendEmail('verification', { url }, 'person@example.com')
//   sendEmails('limboReminder', [{ email, name, data }, ...])
//
// Settings: RESEND_API_KEY, EMAIL_FROM (an address on a domain verified in
// Resend), EMAIL_FROM_NAME, and optionally EMAIL_REPLY_TO (a real inbox for
// replies). Without RESEND_API_KEY nothing is sent: each email
// is printed to the server log instead (handy for local sign-up testing).
//
// These functions never throw or reject: callers often don't await them, and
// a failed email must not take a request (or the server) down with it.
import { emailFrom, emailReplyTo } from './urls.js';
import { renderEmail } from './email-templates.js';

const API = () => (process.env.RESEND_API_URL || 'https://api.resend.com').replace(/\/+$/, '');
const BATCH_LIMIT = 100; // Resend's maximum per batch request

const fromHeader = () => {
  const { email, name } = emailFrom();
  return name ? `${name.replace(/["\r\n]/g, '')} <${email}>` : email;
};

function buildMessage(template, data, email) {
  const { subject, html, text } = renderEmail(template, data || {});
  return { from: fromHeader(), to: [email], reply_to: emailReplyTo(), subject, html, text };
}

function logInsteadOfSending(message) {
  console.log(`[email not sent: no RESEND_API_KEY] to=${message.to.join(',')} subject="${message.subject}"\n${message.text}\n`);
}

async function post(path, body) {
  const response = await fetch(API() + path, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${result.message || result.name || 'request failed'}`);
  }
  return result;
}

export async function sendEmail(template, data, email) {
  if (!email) return { ok: false, error: 'No recipient' };
  let message;
  try {
    message = buildMessage(template, data, email);
  } catch (e) {
    console.log(`Email "${template}" could not be built:`, e.message);
    return { ok: false, error: e.message };
  }
  if (!process.env.RESEND_API_KEY) {
    logInsteadOfSending(message);
    return { ok: true, logged: true };
  }
  try {
    const result = await post('/emails', message);
    console.log(`Email "${template}" sent (${result.id || 'no id'})`);
    return { ok: true, id: result.id };
  } catch (e) {
    console.log(`Email "${template}" failed:`, e.message);
    return { ok: false, error: e.message };
  }
}

// recipients: [{ email, name, data }]
export async function sendEmails(template, recipients) {
  const messages = [];
  for (const r of recipients || []) {
    if (!r || !r.email) continue;
    try {
      messages.push(buildMessage(template, r.data, r.email));
    } catch (e) {
      console.log(`Email "${template}" could not be built:`, e.message);
    }
  }
  if (!process.env.RESEND_API_KEY) {
    messages.forEach(logInsteadOfSending);
    return { ok: true, logged: messages.length };
  }
  let sent = 0;
  const errors = [];
  for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
    try {
      await post('/emails/batch', messages.slice(i, i + BATCH_LIMIT));
      sent += Math.min(BATCH_LIMIT, messages.length - i);
    } catch (e) {
      errors.push(e.message);
      console.log(`Email batch "${template}" failed:`, e.message);
    }
  }
  console.log(`Email "${template}": sent ${sent} of ${messages.length}`);
  return { ok: errors.length === 0, sent, errors };
}
