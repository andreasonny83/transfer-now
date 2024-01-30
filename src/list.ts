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
    log(`Cannot read information from the database\n'${err.message || err}`);
    return {
      statusCode: 400,
      body: `No data found matching the machineId "${machineId}"\nPlease, check the unique name then try again`,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ...userData }),
  };
};
