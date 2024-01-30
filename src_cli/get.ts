import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import ora from 'ora';
import { API_URL, GENERIC_ERROR } from './constants';

export const get = async (name: string, targetDir = '', targetFilename = '', silent = false): Promise<string> => {
  if (!name) {
    throw Error('A unique file name must be provided');
  }

  if (name.split('_').length !== 3) {
    throw Error(`${name} is not a valid transfer-now name`);
  }

  const filePath = path.resolve(targetDir);

  if (!fs.existsSync(filePath)) {
    throw Error(`${filePath} is not a valid path`);
  }

  const spinner = ora('Looking for your file...');

  if (!silent) {
    spinner.start();
  }

  let getFileRes;
  try {
    getFileRes = await fetch(`${API_URL}/get`, {
      method: 'POST',
      body: JSON.stringify({ name }),
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

  let payload: any;
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

  let bucketFile: any;
  try {
    bucketFile = await fetch(payload.fileUrl);
  } catch (err) {
    spinner.clear();
    throw Error('Connection refused by the server. Please, try again later');
  }

  if (!bucketFile.ok) {
    spinner.clear();
    throw Error('Cannot find a file to download.');
  }

  const filename = targetFilename || payload.data.originalFileName;
  const destPath = `${filePath}/${filename}${payload.data.fileExtension}`;

  if (fs.existsSync(destPath)) {
    throw Error(`File ${filename} already exists in directory ${filePath}`);
  }

  const dest = fs.createWriteStream(destPath);
  bucketFile.body.pipe(dest);

  return await new Promise((res, rej) => {
    dest.on('finish', () => {
      spinner.clear();
      res(destPath);
    });

    dest.on('error', () => {
      fs.unlinkSync(destPath);
      spinner.clear();
      rej('Something went wrong while downloading the file. Please, try again later');
    });
  });
};
