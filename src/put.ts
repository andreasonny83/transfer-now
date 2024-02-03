import { generateUniqueName, storeMeta } from './database';
import { generatePresignedUrl } from './bucket';
import { log } from './log';

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: any): Promise<any> => {
  const { body } = event;
  const { fileName, extName, mimeType, machineId, fileSize } = JSON.parse(body);

  log('body', body);

  if (!fileName) {
    log('A filename must be provided');
    return {
      statusCode: 400,
      body: 'A filename must be provided',
    };
  }

  let rndName: string;
  try {
    rndName = await generateUniqueName(TABLE_NAME);
  } catch (err: any) {
    log(err.message || err);
    return {
      statusCode: 400,
      body: 'No files were uploaded. Please, try again later',
    };
  }

  log('random name for the item:', rndName);
  log('Generating a Presigned Url...');

  let info;
  try {
    info = await generatePresignedUrl(BUCKET_NAME, rndName, mimeType, fileSize);
  } catch (err: any) {
    log(err.message || err);
    return {
      statusCode: 400,
      body: err.message || 'No files were uploaded. Please, try again later',
    };
  }

  log('Presigned Url generated', info);
  log('Storing information to database...');

  try {
    await storeMeta(TABLE_NAME, rndName, fileName, extName, mimeType, machineId);
  } catch (err: any) {
    log(`Cannot store information to the database\n${err.message || err}`);
    return {
      statusCode: 400,
      body: 'No files were uploaded. Please, try again later',
    };
  }

  log('done');

  return {
    statusCode: 201,
    body: JSON.stringify(info),
  };
};
