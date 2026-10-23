const assert = require('node:assert/strict');
const test = require('node:test');

test('sends SMTP mail through the Nodemailer transport contract', async () => {
  delete process.env.RESEND_API_KEY;

  const emailService = require('../src/utils/emailService');
  const originalSendMail = emailService.transporter.sendMail;
  let receivedOptions;

  emailService.transporter.sendMail = async (options) => {
    receivedOptions = options;
    return { messageId: 'test-message' };
  };

  try {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Dependency upgrade smoke test',
      html: '<p>OK</p>'
    });

    assert.deepEqual(result, { messageId: 'test-message' });
    assert.deepEqual(receivedOptions, {
      from: 'MAKDEVS <service@makdev.online>',
      to: 'test@example.com',
      subject: 'Dependency upgrade smoke test',
      html: '<p>OK</p>'
    });
  } finally {
    emailService.transporter.sendMail = originalSendMail;
  }
});
