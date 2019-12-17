import { generateUniqueName } from './database';
import { generatePresignedUrl } from './bucket';

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

export const upload = async (event: any, context: any, callback: any) => {
  const { body } = event;
  const { fileName, extName, mimeType } = JSON.parse(body);

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
    console.warn(err.message || err);
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

module.exports.get = (event: any, context: any, callback: any) => {
  callback(null, {
    status: 'ok'
  });
};
