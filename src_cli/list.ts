import { machineIdSync } from 'node-machine-id';
import fetch from 'node-fetch';
import { API_URL, GENERIC_ERROR } from './constants';
import ora from 'ora';
import Table from 'cli-table';
import { log } from './log';

export const list = async (silent = false): Promise<void> => {
  const machineId = machineIdSync();
  const spinner = ora('Looking for your files...');

  if (!silent) {
    spinner.start();
  }

  let getListRes;
  try {
    getListRes = await fetch(`${API_URL}/list`, {
      method: 'POST',
      body: JSON.stringify({ machineId }),
    });
  } catch (err) {
    spinner.clear();
    throw Error('Connection refused by the server. Please, try again later');
  }

  if (getListRes.status == 400) {
    const text = await getListRes.text();
    spinner.clear();
    log(false, text);
    return;
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
    throw Error('Cannot reach the service. Please try again later');
  }

  if (!payload || !payload.data) {
    spinner.clear();
    throw Error(GENERIC_ERROR);
  }

  spinner.text = 'User found. Retrieving transfers data...';

  const table = new Table({
    head: ['id', 'fileName', 'expiration date'],
    colWidths: [35, 25, 40],
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.clear();

  if (payload.data.length === 0) {
    log(false, 'No files found on the server.');
    return;
  }

  payload.data.forEach((item: any) => {
    table.push([item.id, item.fileName, new Date(item.expiration * 1000).toUTCString()]);
  });

  log(false, table.toString());
};
