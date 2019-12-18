import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { getType } from 'mime';
import { API_URL, GENERIC_ERROR } from './constants';
import { log } from './log';

export const put = async (targetFileName: string, silent = false): Promise<string> => {
  const filePath = path.resolve(targetFileName);
  const extName = path.extname(filePath);
  const fileName = path.basename(filePath).replace(extName, '');
  const mimeType = getType(extName);

  if (!mimeType || !extName || !fileName || !filePath) {
    throw Error(
      'The provided file is not supported. A file must have a name and a valid extension'
    );
  }

  let getUrlRes;
  try {
    getUrlRes = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      timeout: 5000,
      body: JSON.stringify({
        fileName,
        extName,
        mimeType
      })
    });
  } catch (err) {
    throw Error('Connection refused by the server. Please, try again later');
  }

  let payload;
  try {
    payload = await getUrlRes.json();
  } catch (err) {
    throw Error('Cannot reach the service. Please try again later');
  }

  if (!payload || !payload.fields) {
    throw Error(GENERIC_ERROR);
  }

  const maxFileSize = Number(payload.fields['Max-File-Size']);
  const fileEndpoint = payload.fields.key;
  const form = new FormData();

  if (!maxFileSize || !fileEndpoint) {
    throw Error(GENERIC_ERROR);
  }

  for (const field in payload.fields) {
    form.append(field, payload.fields[field]);
  }

  form.append('file', fs.createReadStream(filePath));

  let length: number;
  try {
    length = await new Promise((res, rej) => {
      form.getLength((err: any, data: number) => {
        if (err) {
          rej(GENERIC_ERROR);
        }
        res(data);
      });
    });
  } catch (err) {
    throw Error(err.message || GENERIC_ERROR);
  }

  if (length >= maxFileSize) {
    throw Error(
      `File too big!\nThe maximum allowed file size is ${maxFileSize /
        1000 /
        1000} Mb\nYour file is ${Math.floor(length / 1000 / 1000)} Mb`
    );
  }

  log(silent, 'Uploading...');

  let response;
  try {
    response = await fetch(payload.url, {
      method: 'POST',
      body: form,
      headers: {
        'Content-Length': String(length)
      }
    });
  } catch (err) {
    throw Error(err.message || GENERIC_ERROR);
  }

  if (!response || !response.ok || response.status >= 300) {
    throw Error('Cannot upload the file. Please, try again later.');
  }

  return fileEndpoint;
};
