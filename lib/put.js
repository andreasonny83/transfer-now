const fs = require('fs');
const path = require('path');
const mime = require('mime');
const fetch = require('node-fetch');
const FormData = require('form-data');

// const API_URL = 'http://localhost:3000';
const API_URL = 'https://6usc6gazeb.execute-api.us-east-1.amazonaws.com/prod';

module.exports = async (name, flags) => {
  const filePath = path.resolve(name);
  const extName = path.extname(filePath);
  const fileName = path.basename(filePath).replace(extName, '');
  const mimeType = mime.getType(extName);

  let getUrlRes;
  try {
    getUrlRes = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        extName,
        mimeType
      })
    });
  } catch (err) {
    console.log(err);
    return process.exit(1);
  }

  let payload;
  try {
    payload = await getUrlRes.json();
  } catch (err) {
    console.log('Cannot reach the service. Please try again later');
    return process.exit(1);
  }

  if (!payload || !payload.fields) {
    console.log('Ops! Something went wrong. Please try again later');
    return process.exit(1);
  }

  const maxFileSize = Number(payload.fields['Max-File-Size']);
  const fileEndpoint = payload.fields.key;
  const form = new FormData();

  if (!maxFileSize || !fileEndpoint) {
    console.log('Ops! Something went wrong\nPlease try again later');
    process.exit(1);
  }

  for (const field in payload.fields) {
    form.append(field, payload.fields[field]);
  }

  form.append('file', fs.createReadStream(filePath));

  let length;
  try {
    length = await new Promise((res, rej) => {
      form.getLength((err, data) => {
        if (err) {
          rej('Ops! Something went wrong. Please try again later');
        }
        res(data);
      });
    });
  } catch (err) {
    console.log(err.message || err);
    return process.exit(1);
  }

  if (length >= maxFileSize) {
    console.log(
      `File too big!\nThe maximum allowed file size is ${maxFileSize /
        1000 /
        1000} Mb\nYour file is ${Math.floor(length / 1000 / 1000)} Mb`
    );
    return process.exit(1);
  }

  console.log('Uploading...');

  let response;
  try {
    response = await fetch(payload.url, {
      method: 'POST',
      body: form,
      headers: {
        'Content-Length': length
      }
    });
  } catch (err) {
    console.log(err.message || err);
    return process.exit(1);
  }

  if (!response || !response.ok || response.status >= 300) {
    console.log(response);
    console.log('Cannot upload the file. Please, try again later.');
    return process.exit(1);
  }

  return fileEndpoint;
};
