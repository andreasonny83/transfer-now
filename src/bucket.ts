import { PassThrough } from 'stream';
import AWS from 'aws-sdk';

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_MB) || 100;

export const generatePresignedUrl = (
  bucketName: string,
  key: string,
  contentType: string
) => {
  const s3 = new AWS.S3();
  const maxFileSize = MAX_FILE_SIZE * 1000 * 1000;

  const res = s3.createPresignedPost({
    Bucket: bucketName,
    Expires: 10,
    Fields: {
      key,
      'Content-Type': contentType,
      'Max-File-Size': String(maxFileSize)
    },
    Conditions: [['content-length-range', 0, maxFileSize]]
  });

  return res;
};
