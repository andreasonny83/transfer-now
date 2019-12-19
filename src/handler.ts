import { generateUniqueName, storeMeta, getMeta } from './database';
import { generatePresignedUrl, getFileUrl } from './bucket';
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

  log('random name for the item:', rndName);
  log('Generating a Presigned Url...');

  let info;
  try {
    info = generatePresignedUrl(BUCKET_NAME, rndName, mimeType);
  } catch (err) {
    log(err.message || err);
    return {
      statusCode: 400,
      body: 'No files were uploaded. Please, try again later'
    };
  }

  log('Presigned Url generated');
  log('Storing information to database...');

  try {
    await storeMeta(TABLE_NAME, rndName, fileName, extName, mimeType);
  } catch (err) {
    log(`Cannot store information to the database\n${err.message || err}`);
    return {
      statusCode: 400,
      body: 'No files were uploaded. Please, try again later'
    };
  }

  log('done');

  return {
    statusCode: 201,
    body: JSON.stringify(info)
  };
};

export const get = async (event: any): Promise<any> => {
  const { body } = event;
  const { name } = JSON.parse(body);

  log('body', body);

  let fileMeta;
  try {
    fileMeta = await getMeta(TABLE_NAME, name);
  } catch (err) {
    log(`Cannot read information from the database\n'${err.message || err}`);
    return {
      statusCode: 400,
      body: `No file found matching the name "${name}"\nPlease, check the unique name then try again`
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
      body: `File not found`
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ...fileMeta, fileUrl })
  };
};
