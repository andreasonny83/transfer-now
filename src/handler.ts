import { generateUniqueName } from './database';
import { generatePresignedUrl } from './bucket';

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

/* eslint-disable no-console */
export const upload = async (event: any, _context: any, _callback: any): Promise<any> => {
  const { body } = event;
  const { fileName, extName, mimeType } = JSON.parse(body);

  console.log('extName', extName);

  if (!fileName) {
    console.log('A filename must be provided');
    return {
      statusCode: 400,
      body: 'A filename must be provided'
    };
  }

  let rndName: string;
  try {
    rndName = await generateUniqueName(TABLE_NAME);
  } catch (err) {
    console.log(err.message || err);
    return {
      statusCode: 400,
      body: 'No files were uploaded. Please, try again later'
    };
  }

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
