const assert = require('node:assert/strict');
const { PassThrough } = require('node:stream');
const test = require('node:test');

const upload = require('../src/middleware/upload');

function multipartRequest({ filename, contentType, content, fieldName = 'file' }) {
  const boundary = '----makdevs-test-boundary';
  const body = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n` +
      content +
      `\r\n--${boundary}--\r\n`
  );

  const request = new PassThrough();
  request.method = 'POST';
  request.url = '/upload';
  request.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': body.length
  };

  return { request, body };
}

function parseSingleFile(options) {
  return new Promise((resolve) => {
    const { request, body } = multipartRequest(options);

    upload.single(options.fieldName || 'file')(request, {}, (error) => {
      resolve({ error, file: request.file });
    });

    request.end(body);
  });
}

test('accepts an allowed image and preserves its buffer metadata', async () => {
  const result = await parseSingleFile({
    filename: 'logo.png',
    contentType: 'image/png',
    content: 'image-content'
  });

  assert.ifError(result.error);
  assert.ok(result.file);
  assert.equal(result.file.originalname, 'logo.png');
  assert.equal(result.file.mimetype, 'image/png');
  assert.equal(result.file.buffer.toString(), 'image-content');
});

test('rejects a file whose extension and MIME type are not allowed', async () => {
  const result = await parseSingleFile({
    filename: 'payload.exe',
    contentType: 'application/octet-stream',
    content: 'not-an-image'
  });

  assert.ok(result.error);
  assert.equal(result.error.message, 'File type not allowed!');
  assert.equal(result.error.statusCode, 400);
});
