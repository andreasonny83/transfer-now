import AWS from 'aws-sdk';
import {
  Config,
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals
} from 'unique-names-generator';

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

/* eslint-disable no-console */
export const generateUniqueName = async (tableName: string): Promise<string> => {
  const docClient = new AWS.DynamoDB.DocumentClient();

  const randomName = (fileName: string, iteration = 1): Promise<string> => {
    if (iteration > 3) {
      throw Error('Cannot find an available name');
    }

    const params = {
      TableName: tableName,
      Key: {
        id: fileName
      }
    };

    const res = docClient.get(params, err => {
      if (err) {
        console.error(`Unable to find item. Error JSON:`, JSON.stringify(err, null, 2));
      }
    });

    return res.promise().then(data => {
      if (data && data.Item && data.Item) {
        console.error(`Unique name: "${fileName}: already exists. Generating a new one`);
        const newFileName = uniqueNamesGenerator(randomNameConfig);
        return randomName(newFileName, iteration + 1);
      }

      return fileName;
    });
  };

  return randomName(uniqueNamesGenerator(randomNameConfig));
};
