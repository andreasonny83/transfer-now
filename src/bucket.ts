import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_MB) || 10;

export const generatePresignedUrl = async (bucketName: string, key: string, contentType: string, fileSize: number) => {
  const client = new S3Client();
  const maxFileSize = MAX_FILE_SIZE * 1000 * 1000;

  if (fileSize > maxFileSize) {
    const fileSizeInMb = (fileSize / 1000000).toFixed(2);
    throw Error(`The file size is too big. The maximum file size is ${MAX_FILE_SIZE}MB. File size: ${fileSizeInMb}MB`);
  }

  return createPresignedPost(client, {
    Bucket: bucketName,
    Expires: 10,
    Key: key,
    Fields: {
      key,
      'Content-Type': contentType,
      'Max-File-Size': String(maxFileSize),
    },
    Conditions: [
      ['content-length-range', 0, maxFileSize],
      ['eq', '$Content-Type', contentType],
      ['eq', '$key', key],
    ],
  });
};

export const getFileUrl = async (
  bucketName: string,
  key: string,
  expiration = 3,
  fileName?: string
): Promise<string> => {
  const client = new S3Client();

  const getObjectParams: GetObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
    ...(fileName && { ResponseContentDisposition: `attachment; filename="${fileName}"` }),
  };

  const command = new GetObjectCommand(getObjectParams);

  return getSignedUrl(client, command, { expiresIn: expiration });
};

export const deleteMeta = async (bucketName: string, key: string): Promise<DeleteObjectCommandOutput> => {
  const client = new S3Client();

  const deleteObjectParams: DeleteObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new DeleteObjectCommand(deleteObjectParams);

  return client.send(command);
};
