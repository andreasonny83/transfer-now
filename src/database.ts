import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  PutCommandInput,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  PutCommand,
  PutCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { Config, uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { log } from './log';

const REGION = process.env.REGION || 'us-east-1';
const EXPIRATION_DAYS = Number(process.env.EXPIRATION_DAYS) || 1;

interface ItemData {
  id: string;
  hashKey: string;
  machineId: string;
  timestamp: number;
  expiration: number;
  data: {
    originalFileName: string;
    fileExtension: string;
    mimeType: string;
  };
}

export type IQueryCommandOutput<T> = Omit<QueryCommandOutput, 'Items'> & {
  Items?: T[];
};

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const randomNameConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  length: 3,
  separator: '_',
  style: 'lowerCase',
};

const findItem = async (tableName: string, itemId: string, keyName: string, indexName?: string) => {
  const params: QueryCommandInput = {
    TableName: tableName,
    ...(indexName && { IndexName: indexName }),
    KeyConditionExpression: '#keyName = :keyName',
    ExpressionAttributeNames: {
      '#keyName': keyName,
    },
    ExpressionAttributeValues: {
      ':keyName': itemId,
    },
  };

  const command = new QueryCommand(params);
  return docClient.send(command) as Promise<IQueryCommandOutput<ItemData>>;
};

const removeItem = async (tableName: string, keyName: string, keyValue: string) => {
  const params: DeleteCommandInput = {
    TableName: tableName,

    Key: {
      [`${keyName}`]: keyValue,
    },
  };

  log('Removing item', params);

  const command = new DeleteCommand(params);
  return docClient.send<DeleteCommandInput, DeleteCommandOutput>(command);
};

const getDataItem = (data?: IQueryCommandOutput<ItemData>) => {
  if (data && data.Items && data.Count && data.Count > 0 && data.Items.length && data.Items[0]) {
    return data.Items[0];
  }

  return undefined;
};

const isDataFresh = (dataItem?: IQueryCommandOutput<ItemData>): boolean => {
  const data = getDataItem(dataItem);

  if (!data) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
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
      itemData = await findItem(tableName, fileName, 'id');
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
  mimeType: string,
  machineId: string
) => {
  const client = new DynamoDBClient({ region: REGION });
  const docClient = DynamoDBDocumentClient.from(client);

  const requestTime = Math.floor(Date.now() / 1000);
  const expirationTime = requestTime + EXPIRATION_DAYS * 24 * 60 * 60;

  const params: PutCommandInput = {
    TableName: tableName,
    Item: {
      id: name,
      timestamp: requestTime,
      expiration: expirationTime,
      machineId,
      data: {
        originalFileName,
        fileExtension,
        mimeType,
      },
    },
  };

  const command = new PutCommand(params);

  return docClient.send<PutCommandInput, PutCommandOutput>(command);
};

export const generateSingleUseUrl = async (tableName: string, name: string, expiration: number) => {
  const client = new DynamoDBClient({ region: REGION });
  const docClient = DynamoDBDocumentClient.from(client);
  const randomHash = crypto.randomBytes(16).toString('hex');

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      id: randomHash,
      hashKey: name,
      expiration,
    },
  });

  await docClient.send<PutCommandInput, PutCommandOutput>(command);

  return randomHash;
};

export const getMeta = async (tableName: string, name: string) => {
  log(`Looking for unique name ${name}`);

  let dataItem;
  try {
    dataItem = await findItem(tableName, name, 'id');

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

export const getUniqueNameFromHash = async (tableName: string, hashKey: string) => {
  log(`Looking for unique hash ${hashKey}`);

  let hashItem;
  try {
    hashItem = await findItem(tableName, hashKey, 'id');
    log(hashItem);
  } catch (err) {
    log(err);
  }

  const hashData = getDataItem(hashItem);
  const uniqueName = hashData?.hashKey;

  if (!uniqueName) {
    throw Error('No file found');
  }

  try {
    const res = await removeItem(tableName, 'id', hashKey);
    log('Removed hash item', res);
  } catch (err) {
    log('error deleting item', err);
  }

  return uniqueName;
};

export const getUserData = async (tableName: string, machineId: string) => {
  log(`Looking for user ${machineId} in table ${tableName}...`);

  let dataItem;
  try {
    dataItem = await findItem(tableName, machineId, 'machineId', 'GSI1');
    log(dataItem);
  } catch (err) {
    log(err);
  }

  log(`Found items`);

  const now = Math.floor(Date.now() / 1000);

  return (
    dataItem &&
    dataItem.Items && {
      data: dataItem.Items.map((item) => ({
        id: item.id,
        expiration: item.expiration,
        fileName: item.data.originalFileName + item.data.fileExtension,
      })).filter((item) => item.expiration > now),
    }
  );
};
