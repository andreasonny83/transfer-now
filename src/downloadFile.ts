import { getFileUrl } from './bucket';
import { getMeta, getUniqueNameFromHash } from './database';
import { log } from './log';

const BUCKET_NAME = process.env.BUCKET_NAME || '';
const TABLE_NAME = process.env.TABLE_NAME || '';

const createHtml = (title: string, body: string) => `
<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
  </head>
  <body>
    ${body}
  </body>
</html>
`;

export const handler = async (event: any): Promise<any> => {
  const { queryStringParameters } = event;
  const { hash } = queryStringParameters || {};

  if (!hash) {
    return {
      statusCode: 400,
      body: createHtml('Invalid URL', '<h1>Invalid Request</h1><p>Please provide a valid URL.</p>'),
      headers: {
        'Content-Type': 'text/html',
      },
    };
  }

  let uniqueName;
  try {
    uniqueName = await getUniqueNameFromHash(TABLE_NAME, hash);
  } catch (err: any) {
    log(`Cannot read information from the database\n'${err.message || err}`);
    return {
      statusCode: 404,
      body: createHtml('File not found', '<h1>No file found.</h1><p>Please, check the information then try again.</p>'),
      headers: {
        'Content-Type': 'text/html',
      },
    };
  }

  let fileMeta;
  try {
    fileMeta = await getMeta(TABLE_NAME, uniqueName);
  } catch (err: any) {
    log(`Cannot read information from the database\n'${err.message || err}`);
    return {
      statusCode: 404,
      body: createHtml('File not found', '<h1>No file found.</h1><p>Please, check the information then try again.</p>'),
      headers: {
        'Content-Type': 'text/html',
      },
    };
  }

  let downloadUrl;
  try {
    const fileName = fileMeta.data.originalFileName + '.' + fileMeta.data.fileExtension;
    downloadUrl = await getFileUrl(BUCKET_NAME, uniqueName, 3, fileName);
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
