import { getMeta } from './database';
import { getFileUrl } from './bucket';
import { log } from './log';

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: any): Promise<any> => {
  const { body } = event;
  const { name } = JSON.parse(body);

  log('body', body);

  let fileMeta;
  try {
    fileMeta = await getMeta(TABLE_NAME, name);
  } catch (err: any) {
    log(`Cannot read information from the database\n'${err.message || err}`);
    return {
      statusCode: 400,
      body: `No file found matching the name "${name}"\nPlease, check the unique name then try again`,
    };
  }

  let fileUrl;
  try {
    fileUrl = await getFileUrl(BUCKET_NAME, name);
  } catch (err) {
    log(err);
  }

  log('File download url:', fileUrl);

  if (!fileUrl) {
    return {
      statusCode: 400,
      body: `File not found`,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ...fileMeta, fileUrl }),
  };
};
