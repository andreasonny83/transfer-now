import { getFileUrl } from './bucket';
import { getMeta, getUniqueNameFromHash } from './database';
import { log } from './log';
import fetch from 'node-fetch';

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
      statusCode: 400,
      body: `No hash found matching the name "${hash}"\nPlease, check the information then try again`,
    };
  }

  let fileMeta;
  try {
    fileMeta = await getMeta(TABLE_NAME, uniqueName);
  } catch (err: any) {
    log(`Cannot read information from the database\n'${err.message || err}`);
    return {
      statusCode: 400,
      body: `No file found matching the name "${uniqueName}"\nPlease, check the unique name then try again`,
    };
  }

  const fileName = `${fileMeta.data.originalFileName}.${fileMeta.data.fileExtension}`;

  let fileUrl;
  try {
    fileUrl = await getFileUrl(BUCKET_NAME, uniqueName);
  } catch (err) {
    log(err);
  }

  log('File download url:', fileUrl);

  const res = await fetch(`${fileUrl}`);
  const file = await res.buffer();

  return {
    statusCode: 200,
    body: file,
    isBase64Encoded: true,
    headers: {
      'Content-Type': fileMeta.data.mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  };
};
