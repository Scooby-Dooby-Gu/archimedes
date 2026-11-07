
import request from 'request';
import { emailFrom } from './urls.js';

export const sendEmailFromTemplate = (templateId, subject, data, email, name = email) => {
  if (!templateId) {
    throw new Error('Please provide SendGrid template id to send email');
  }
  if (!email) {
    throw new Error('Please provide email address to send email');
  }
  if (!subject) {
    throw new Error('Please provide subject to send email');
  }
  return sendEmailsFromTemplate(templateId, [{subject, data, email, name}])
}


export const sendEmailsFromTemplate = (templateId, recipients, from = emailFrom()) => {
  if (!templateId) {
    throw new Error('Please provide SendGrid template id to send email');
  }

  var options = {
    method: 'POST',
    url: 'https://api.sendgrid.com/v3/mail/send',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.SENDGRID_API_KEY}`
    },
    body: {
      personalizations: recipients.map(({subject, data, email, name}) => (
        { 
          to: [
            { email, name }
          ],
          dynamic_template_data: {
            subject,
            ...data
          },
        }
      )),
      from: from,
      reply_to: from,
      template_id: templateId
    },
    json: true
  };
  options.body.personalizations.map((p) => {
    console.log("Email:", p.to)
  })
  return new Promise((success, failure) => {
    request(options, function (error, response, body) {
      if (error) throw new Error;
      success(body)
    });
  })
}

