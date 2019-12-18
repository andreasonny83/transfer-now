import AWS from 'aws-sdk';
import {
  Config,
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals
} from 'unique-names-generator';
import { log } from './log';

const REGION = process.env.REGION || 'us-east-1';

AWS.config.update({
  region: REGION
});

const randomNameConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  length: 3,
  separator: '_',
  style: 'lowerCase'
};

export const generateUniqueName = async (tableName: string): Promise<string> => {
  const docClient = new AWS.DynamoDB.DocumentClient();

  const randomName = (fileName: string, iteration = 1): Promise<string> => {
    if (iteration > 3) {
      throw Error('Cannot find an available name.');
    }

    const params = {
      TableName: tableName,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id'
      },
      ExpressionAttributeValues: {
        ':id': fileName
      }
    };

    return docClient
      .query(params)
      .promise()
      .then(data => {
        log(`Looking for unique name ${fileName}. Response`, data);
        if (data && data.Count && data.Count > 0) {
          log(`Unique name: "${fileName}: already exists. Generating a new one...`);
          const newFileName = uniqueNamesGenerator(randomNameConfig);
          return randomName(newFileName, iteration + 1);
        }

        return fileName;
      });
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
  const params = {
    TableName: tableName,
    Item: {
      id: name,
      timestamp: requestTime,
      data: {
        originalFileName,
        fileExtension,
        mimeType
      }
    },
    ConditionExpression: 'attribute_not_exists(id)'
  };

  return docClient.put(params).promise();
};
