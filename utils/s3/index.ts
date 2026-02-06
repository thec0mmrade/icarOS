import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

export type S3Config = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  region?: string;
  secretAccessKey: string;
};

export const createS3Client = (config: S3Config): S3Client => {
  const clientConfig: S3ClientConfig = {
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: config.region || "auto",
  };

  return new S3Client(clientConfig);
};

export const listObjects = async (
  client: S3Client,
  bucket: string,
  prefix: string,
  continuationToken?: string
): Promise<{
  contents: { key: string; lastModified?: Date; size?: number }[];
  isTruncated: boolean;
  nextContinuationToken?: string;
  prefixes: string[];
}> => {
  const normalizedPrefix = prefix === "/" ? "" : prefix.replace(/^\//, "");
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    ContinuationToken: continuationToken,
    Delimiter: "/",
    Prefix: normalizedPrefix,
  });

  const response = await client.send(command);

  return {
    contents: (response.Contents || [])
      .filter((item) => item.Key !== normalizedPrefix)
      .map((item) => ({
        key: item.Key || "",
        lastModified: item.LastModified,
        size: item.Size,
      })),
    isTruncated: response.IsTruncated || false,
    nextContinuationToken: response.NextContinuationToken,
    prefixes: (response.CommonPrefixes || [])
      .map((p) => p.Prefix || "")
      .filter(Boolean),
  };
};

export const headObject = async (
  client: S3Client,
  bucket: string,
  key: string
): Promise<{ contentLength: number; lastModified?: Date } | undefined> => {
  try {
    const normalizedKey = key.replace(/^\//, "");
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: normalizedKey,
    });

    const response = await client.send(command);

    return {
      contentLength: response.ContentLength || 0,
      lastModified: response.LastModified,
    };
  } catch {
    return undefined;
  }
};

export const getObject = async (
  client: S3Client,
  bucket: string,
  key: string
): Promise<Uint8Array> => {
  const normalizedKey = key.replace(/^\//, "");
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: normalizedKey,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error("Empty response body");
  }

  return response.Body.transformToByteArray();
};

export const putObject = async (
  client: S3Client,
  bucket: string,
  key: string,
  data: Uint8Array | Buffer
): Promise<void> => {
  const normalizedKey = key.replace(/^\//, "");
  const command = new PutObjectCommand({
    Body: data,
    Bucket: bucket,
    Key: normalizedKey,
  });

  await client.send(command);
};

export const deleteObject = async (
  client: S3Client,
  bucket: string,
  key: string
): Promise<void> => {
  const normalizedKey = key.replace(/^\//, "");
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: normalizedKey,
  });

  await client.send(command);
};

export const copyObject = async (
  client: S3Client,
  bucket: string,
  sourceKey: string,
  destKey: string
): Promise<void> => {
  const normalizedSource = sourceKey.replace(/^\//, "");
  const normalizedDest = destKey.replace(/^\//, "");
  const command = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${normalizedSource}`,
    Key: normalizedDest,
  });

  await client.send(command);
};

export const pathToS3Key = (path: string, mountPoint: string): string => {
  const relativePath = path.startsWith(mountPoint)
    ? path.slice(mountPoint.length)
    : path;

  return relativePath.replace(/^\/+/, "");
};

export const s3KeyToPath = (key: string, mountPoint: string): string =>
  `${mountPoint}/${key}`.replace(/\/+/g, "/");
