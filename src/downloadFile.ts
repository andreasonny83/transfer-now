import { getFileUrl } from './bucket';
import { getUniqueNameFromHash } from './database';
import { log } from './log';

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: any): Promise<any> => {
  const { queryStringParameters } = event;
  const { hash } = queryStringParameters || {};

  if (!hash) {
    return {
      statusCode: 400,
      body: `Please provide a valid URL`,
    };
  }

  let uniqueName;
  try {
    uniqueName = await getUniqueNameFromHash(TABLE_NAME, hash);
  } catch (err: any) {
    log(`Cannot read information from the database\n'${err.message || err}`);
    return {
      statusCode: 404,
      body: `No file found.\nPlease, check the information then try again`,
    };
  }

  let downloadUrl;
  try {
    downloadUrl = await getFileUrl(BUCKET_NAME, uniqueName);
  } catch (err) {
    log(err);
  }

  return {
    statusCode: 302,
    headers: {
      Location: downloadUrl,
    },
  };
};
