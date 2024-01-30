import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
} from '@aws-sdk/lib-dynamodb';
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

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const randomNameConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  length: 3,
  separator: '_',
  style: 'lowerCase',
};

const findItem = async (tableName: string, itemId: string): Promise<QueryCommandOutput> => {
  const params: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeNames: {
      '#id': 'id',
    },
    ExpressionAttributeValues: {
      ':id': itemId,
    },
  };

  const command = new QueryCommand(params);
  return docClient.send(command);
};

const getDataItem = (data?: QueryCommandOutput) => {
  if (data && data.Items && data.Count && data.Count > 0 && data.Items.length && data.Items[0]) {
    return data.Items[0] as ItemData;
  }

  return undefined;
};

const isDataFresh = (dataItem?: QueryCommandOutput): boolean => {
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
  mimeType: string,
  machineId: string
): Promise<PutCommandOutput> => {
  const client = new DynamoDBClient({ region: REGION });
  const docClient = DynamoDBDocumentClient.from(client);

  const requestTime = Date.now();
  const expirationTime = Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

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
  return docClient.send(command);
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

export const getUserData = async (tableName: string, machineId: string) => {
  const params: QueryCommandInput = {
    TableName: tableName,
    IndexName: 'GSI1',
    KeyConditionExpression: '#machineId = :machineId',
    ExpressionAttributeNames: {
      '#machineId': 'machineId',
    },
    ExpressionAttributeValues: {
      ':machineId': machineId,
    },
  };

  const command = new QueryCommand(params);
  const data = await docClient.send(command);
  return (
    data &&
    data.Items && {
      data: data.Items.map((item: any) => {
        return {
          id: item.id,
          expiration: item.expiration,
          fileName: item.data.originalFileName + item.data.fileExtension,
        };
      }),
    }
  );
};
