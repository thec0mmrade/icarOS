const S3_ACCESS_PREFIX = "s3_access_";
const S3_SECRET_PREFIX = "s3_secret_";

export const storeS3Credentials = (
  connectionId: string,
  accessKeyId: string,
  secretAccessKey: string
): void => {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(`${S3_ACCESS_PREFIX}${connectionId}`, accessKeyId);
  localStorage.setItem(`${S3_SECRET_PREFIX}${connectionId}`, secretAccessKey);
};

export const getS3Credentials = (
  connectionId: string
): { accessKeyId: string; secretAccessKey: string } | undefined => {
  if (typeof localStorage === "undefined") return undefined;

  const accessKeyId = localStorage.getItem(
    `${S3_ACCESS_PREFIX}${connectionId}`
  );
  const secretAccessKey = localStorage.getItem(
    `${S3_SECRET_PREFIX}${connectionId}`
  );

  if (!accessKeyId || !secretAccessKey) return undefined;

  return { accessKeyId, secretAccessKey };
};

export const removeS3Credentials = (connectionId: string): void => {
  if (typeof localStorage === "undefined") return;

  localStorage.removeItem(`${S3_ACCESS_PREFIX}${connectionId}`);
  localStorage.removeItem(`${S3_SECRET_PREFIX}${connectionId}`);
};
