import { generateUniqueName, storeMeta } from './database';
import { generatePresignedUrl } from './bucket';
import { log } from './log';

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

export const upload = async (event: any, _context: any, _callback: any): Promise<any> => {
  const { body } = event;
  const { fileName, extName, mimeType } = JSON.parse(body);

  log('body', body);

  if (!fileName) {
    log('A filename must be provided');
    return {
      statusCode: 400,
      body: 'A filename must be provided'
    };
  }

  let rndName: string;
  try {
    rndName = await generateUniqueName(TABLE_NAME);
  } catch (err) {
    log(err.message || err);
    return {
      statusCode: 400,
      body: 'No files were uploaded. Please, try again later'
    };
  }

  log('random name:', rndName);
  log('Storing information to database...');

  try {
    await storeMeta(TABLE_NAME, rndName, fileName, extName, mimeType);
  } catch (err) {
    log('Cannot store information to the database.\n', err.message || err);
    return {
      statusCode: 400,
      body: 'No files were uploaded. Please, try again later'
    };
  }

  log('ok');
  const info = generatePresignedUrl(BUCKET_NAME, rndName, mimeType);

  return {
    statusCode: 201,
    body: JSON.stringify(info)
  };
};

module.exports.get = (event: any, context: any, callback: any): any => {
  callback(null, {
    status: 'ok'
  });
};
