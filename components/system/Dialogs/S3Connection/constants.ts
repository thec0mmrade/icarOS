export type S3Provider = {
  endpoint: string;
  name: string;
  regionRequired?: boolean;
};

export const S3_PROVIDERS: Record<string, S3Provider> = {
  aws: {
    endpoint: "https://s3.{region}.amazonaws.com",
    name: "Amazon S3",
    regionRequired: true,
  },
  custom: {
    endpoint: "",
    name: "Custom",
  },
  minio: {
    endpoint: "",
    name: "MinIO",
  },
  storj: {
    endpoint: "https://gateway.storjshare.io",
    name: "Storj",
  },
};

export const DEFAULT_PROVIDER = "storj";
