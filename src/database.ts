import AWS from 'aws-sdk';
import { Config, uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { log } from './log';

const REGION = process.env.REGION || 'us-east-1';
const EXPIRATION_DAYS = Number(process.env.EXPIRATION_DAYS) || 1;

interface ItemData {
  timestamp: number;
  expiration: number;
  data: {
    originalFileName: string;
    fileExtension: string;
    mimeType: string;
  };
}

AWS.config.update({
  region: REGION
});

const docClient = new AWS.DynamoDB.DocumentClient();

const randomNameConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  length: 3,
  separator: '_',
  style: 'lowerCase'
};

const findItem = async (tableName: string, itemId: string) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeNames: {
      '#id': 'id'
    },
    ExpressionAttributeValues: {
      ':id': itemId
    }
  };

  return docClient.query(params).promise();
};

const getDataItem = (data?: AWS.DynamoDB.DocumentClient.QueryOutput) => {
  if (data && data.Items && data.Count && data.Count > 0 && data.Items.length && data.Items[0]) {
    return data.Items[0] as ItemData;
  }

  return undefined;
};

const isDataFresh = (dataItem?: AWS.DynamoDB.DocumentClient.QueryOutput): boolean => {
  const data = getDataItem(dataItem);

  if (!data) {
    return false;
  }

  const now = Date.now();
  const dataExpiration = data.expiration;

  return now < dataExpiration;
};

export const generateUniqueName = async (tableName: string) => {
  const randomName = async (fileName: string, iteration = 1): Promise<string> => {
    if (iteration > 3) {
      throw Error('Cannot find an available name');
    }

    let itemData;
    try {
      itemData = await findItem(tableName, fileName);
      log(`Looking for unique name ${fileName}. Response`, itemData);
    } catch (err) {
      log(err);
    }

    if (isDataFresh(itemData)) {
      log(`Unique name: "${fileName}: already exists. Generating a new one...`);
      const newFileName = uniqueNamesGenerator(randomNameConfig);
      return randomName(newFileName, iteration + 1);
    }

    return fileName;
  };

  return randomName(uniqueNamesGenerator(randomNameConfig));
};

export const storeMeta = async (
  tableName: string,
  name: string,
  originalFileName: string,
  fileExtension: string,
  mimeType: string
): Promise<any> => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const requestTime = Date.now();
  const expirationTime = Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
  const params = {
    TableName: tableName,
    Item: {
      id: name,
      timestamp: requestTime,
      expiration: expirationTime,
      data: {
        originalFileName,
        fileExtension,
        mimeType
      }
    }
  };

  return docClient.put(params).promise();
};

export const getMeta = async (tableName: string, name: string) => {
  log(`Looking for unique name ${name}`);

  let dataItem;
  try {
    dataItem = await findItem(tableName, name);
    log(dataItem);
  } catch (err) {
    log(err);
  }

  const data = getDataItem(dataItem);

  if (data && isDataFresh(dataItem)) {
    log('Item found');
    log(data);
    return data;
  }

  throw Error('No file found');
};
