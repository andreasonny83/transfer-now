import fetch from 'node-fetch';
import { machineIdSync } from 'node-machine-id';
import { API_URL, GENERIC_ERROR } from './constants';
import ora from 'ora';

export const link = async (shortName: string, silent = false): Promise<string> => {
  const spinner = ora('Looking for your files...');
  const machineId = machineIdSync();

  if (!silent) {
    spinner.start();
  }

  let getListRes;
  try {
    getListRes = await fetch(`${API_URL}/link`, {
      method: 'POST',
      body: JSON.stringify({ shortName, machineId }),
    });
  } catch (err) {
    spinner.clear();
    throw Error('Connection refused by the server. Please, try again later');
  }

  if (getListRes.status == 400) {
    const text = await getListRes.text();
    spinner.clear();
    throw Error(text);
  }

  if (!getListRes.ok) {
    const text = await getListRes.text();
    spinner.clear();
    throw Error(text);
  }

  let payload: any;
  try {
    payload = await getListRes.json();
  } catch (err) {
    spinner.clear();
    throw Error('Cannot reach the service. Please try again later.');
  }

  if (!payload || !payload?.fileUrl) {
    spinner.clear();
    throw Error(GENERIC_ERROR);
  }

  spinner.text = 'File found. Generating unique link...';

  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.clear();

  return `${API_URL}/downloadFile?hash=${payload.fileUrl}`;
};
