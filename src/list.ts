import { getUserData } from './database';
import { log } from './log';

const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: any): Promise<any> => {
  const { body } = event || {};
  const { machineId } = JSON.parse(body) || {};

  log('body', body);

  if (!machineId) {
    log('A machineId must be provided');
    return {
      statusCode: 400,
      body: 'A machineId must be provided',
    };
  }

  let userData;
  try {
    userData = await getUserData(TABLE_NAME, machineId);
  } catch (err: any) {
    log(`Cannot find user matching ${machineId}.\n'${err.message || err}`);
    return {
      statusCode: 400,
      body: `No files found on the server.`,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ...userData }),
  };
};
