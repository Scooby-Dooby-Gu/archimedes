import request from 'request';
export default (app, req) => {
  app.postAsync('/waitlist/users', async (req, res) => {
    const { email } = req.body;
    const options = {
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.SENDGRID_API_KEY}`
      },
    };
    // Sendgrid add user to list
    request({
      ...options,
      url: 'https://api.sendgrid.com/v3/marketing/contacts',
      method: 'PUT',
      body: {
        "list_ids": [ "9f04174c-1b4b-40ab-87a0-cf85dd96aa72" ],
        "contacts": [{ "email": email }]
      },
      json: true,
    })
    process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `New waitlist sign up.\nEmail: ${email}`
      },
      json: true,
    })
    res.redirect(app.locals.siteUrl() + '/success');
  })
  app.postAsync('/sales/demo-request', async (req, res) => {
    const { firstName, lastName, company, phoneNumber, email } = req.body;
    const options = {
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.SENDGRID_API_KEY}`
      },
    };
    // Sendgrid add user to list
    request({
      ...options,
      url: 'https://api.sendgrid.com/v3/marketing/contacts',
      method: 'PUT',
      body: {
        "list_ids": [ "9f04174c-1b4b-40ab-87a0-cf85dd96aa72" ],
        "contacts": [{ "email": email }]
      },
      json: true,
    });
    process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `New demo request.\n*Name:* ${firstName} ${lastName}\n*Company:* ${company}\n*Phone:* ${phoneNumber}\n*Email:* ${email}`
      },
      json: true,
    });
    res.redirect(app.locals.siteUrl() + '/salessuccess');
  })
}