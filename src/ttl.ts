import { deleteMeta } from './bucket';
import { log } from './log';

const BUCKET_NAME = process.env.BUCKET_NAME || '';

export const handler = async (event: any): Promise<any> => {
  const { Records } = event;
  const items = Records.filter((record: any) => record.eventName === 'REMOVE').map((record: any) => record.dynamodb);

  if (!items.length) {
    return {
      statusCode: 200,
      body: 'Nothing to remove',
    };
  }

  try {
    for (const item of items) {
      const id = item.Keys.id.S;
      log('Removing item', id);
      await deleteMeta(BUCKET_NAME, id);
    }
  } catch (err: any) {
    log(err.message || err);
  }

  return {
    statusCode: 200,
    body: 'Goodbye',
  };
};
