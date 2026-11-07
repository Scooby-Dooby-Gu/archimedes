import request from 'request';

// Marketing-site forms. These used to add people to a SendGrid contacts list;
// now the details are emailed to CONTACT_EMAIL (and posted to Slack if
// SLACK_WEBHOOK_URL is set).
const looksLikeEmail = (value) => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default (app, req) => {
  function notify(title, lines) {
    const to = app.locals.contactEmail();
    if (to) app.locals.sendEmail('internalNotice', { title, lines }, to);
    process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: { text: `${title}\n${lines.join('\n')}` },
      json: true,
    }, () => {});
  }

  app.postAsync('/waitlist/users', async (req, res) => {
    const { email } = req.body;
    if (looksLikeEmail(email)) {
      notify('New waitlist sign up', [`Email: ${email}`]);
    }
    res.redirect(app.locals.siteUrl() + '/success');
  })

  app.postAsync('/sales/demo-request', async (req, res) => {
    const { firstName, lastName, company, phoneNumber, email } = req.body;
    if (looksLikeEmail(email)) {
      notify('New demo request', [
        `Name: ${firstName || ''} ${lastName || ''}`.trim(),
        `Company: ${company || ''}`,
        `Phone: ${phoneNumber || ''}`,
        `Email: ${email}`,
      ]);
    }
    res.redirect(app.locals.siteUrl() + '/salessuccess');
  })
}
