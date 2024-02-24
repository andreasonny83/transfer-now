import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { getType } from 'mime';
import ora from 'ora';
import { machineIdSync } from 'node-machine-id';
import { API_URL, GENERIC_ERROR } from './constants';

export const put = async (targetFile: string, silent = false): Promise<string> => {
  const filePath = path.resolve(targetFile);
  const extName = path.extname(filePath);
  const fileName = path.basename(filePath).replace(extName, '');
  const mimeType = getType(extName);
  const machineId = machineIdSync();
  const fileSize = fs.statSync(filePath).size;

  if (!mimeType || !extName || !fileName || !filePath) {
    throw Error('The provided file is not supported. A file must have a name and a valid extension');
  }

  const spinner = ora('Contacting the server...');
  if (!silent) {
    spinner.start();
  }

  let getUrlRes;
  try {
    getUrlRes = await fetch(`${API_URL}/put`, {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        extName,
        mimeType,
        machineId,
        fileSize,
      }),
    });
  } catch (err) {
    spinner.stop();
    throw Error('Connection refused by the server. Please, try again later');
  }

  if (!getUrlRes.ok) {
    const text = await getUrlRes.text();
    spinner.stop();
    throw Error(text);
  }

  let payload: any;
  try {
    payload = await getUrlRes.json();
  } catch (err) {
    spinner.stop();
    throw Error('Cannot reach the service. Please try again later');
  }

  if (!payload || !payload.fields) {
    spinner.stop();
    throw Error(GENERIC_ERROR);
  }

  const maxFileSize = Number(payload.fields['Max-File-Size']);
  const fileEndpoint = payload.fields.key;
  const form = new FormData();

  if (!maxFileSize || !fileEndpoint) {
    spinner.stop();
    throw Error(GENERIC_ERROR);
  }

  for (const field in payload.fields) {
    form.append(field, payload.fields[field]);
  }

  const stream = fs.createReadStream(filePath);
  form.append('file', stream);

  spinner.text = 'Server ready. Preparing for the upload...';

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
  } catch (err: any) {
    spinner.stop();
    throw Error(err.message || GENERIC_ERROR);
  }

  if (length >= maxFileSize) {
    spinner.stop();
    throw Error(
      `File too big!\nThe maximum allowed file size is ${maxFileSize / 1000 / 1000} Mb\nYour file is ${Math.floor(
        length / 1000 / 1000
      )} Mb`
    );
  }

  const fileUploadLoop = setInterval(() => {
    const fileUploadingStatus = ((stream.bytesRead * 100) / length).toFixed(2);
    spinner.text = `Uploading file... ${fileUploadingStatus}%`;
  }, 500);

  let response;
  try {
    response = await fetch(payload.url, {
      method: 'POST',
      body: form,

      headers: {
        'Content-Length': String(length),
      },
    });
  } catch (err: any) {
    clearInterval(fileUploadLoop);
    spinner.stop();
    throw Error(err.message || GENERIC_ERROR);
  }

  clearInterval(fileUploadLoop);
  spinner.stop();

  if (!response || !response.ok || response.status >= 300) {
    throw Error('Cannot upload the file. Please, try again later.');
  }

  return fileEndpoint;
};
