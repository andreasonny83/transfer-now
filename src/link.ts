import { generateSingleUseUrl, getMeta } from './database';
import { log } from './log';

const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: any): Promise<any> => {
  const { body } = event;
  const { shortName, machineId } = JSON.parse(body);

  if (!shortName || !machineId) {
    return {
      statusCode: 400,
      body: `Missing required information. Please, try again later.`,
    };
  }

  let itemData;
  try {
    itemData = await getMeta(TABLE_NAME, shortName);
  } catch (err: any) {
    log(`Cannot read information from the database\n'${err.message || err}`);
    return {
      statusCode: 400,
      body: `No data found matching the name "${shortName}"\nPlease, check the information then try again`,
    };
  }

  if (itemData.machineId !== machineId) {
    return {
      statusCode: 404,
      body: `File not found. Please, check the information then try again.`,
    };
  }

  let fileUrl;
  try {
    fileUrl = await generateSingleUseUrl(TABLE_NAME, shortName, itemData.expiration);
  } catch (err) {
    log(err);
  }

  log('File download url:', fileUrl);

  return {
    statusCode: 200,
    body: JSON.stringify({ fileUrl }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
};
