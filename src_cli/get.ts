import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import ora from 'ora';
import { API_URL, GENERIC_ERROR } from './constants';

export const get = async (
  name: string,
  targetDir = '',
  silent = false
): Promise<string> => {
  if (!name) {
    throw Error('A unique file name must be provided');
  }

  if (name.split('_').length !== 3) {
    throw Error(`${name} is not a valid transfer-now name`);
  }

  const filePath = path.resolve(targetDir);
  const spinner = ora('Looking for your file...');

  if (!silent) {
    spinner.start();
  }

  let getFileRes;
  try {
    getFileRes = await fetch(`${API_URL}/get`, {
      method: 'POST',
      timeout: 5000,
      body: JSON.stringify({ name })
    });
  } catch (err) {
    spinner.clear();
    throw Error('Connection refused by the server. Please, try again later');
  }

  if (!getFileRes.ok) {
    const text = await getFileRes.text();
    spinner.clear();
    throw Error(text);
  }

  let payload;
  try {
    payload = await getFileRes.json();
  } catch (err) {
    spinner.clear();
    throw Error('Cannot reach the service. Please try again later');
  }

  if (!payload || !payload.data || !payload.fileUrl) {
    spinner.clear();
    throw Error(GENERIC_ERROR);
  }

  spinner.text = 'File found. Starting the download...';

  const destPath = `${filePath}/${payload.data.originalFileName}${payload.data.fileExtension}`;
  const dest = fs.createWriteStream(destPath);

  let bucketFile;
  try {
    bucketFile = await fetch(payload.fileUrl);
  } catch (err) {
    spinner.clear();
    throw Error('Connection refused by the server. Please, try again later');
  }

  bucketFile.body.pipe(dest);

  return await new Promise((res, rej) => {
    dest.on('finish', () => {
      spinner.clear();
      res(destPath);
    });

    dest.on('error', () => {
      spinner.clear();
      rej('Connection refused by the server. Please, try again later');
    });
  });
};
