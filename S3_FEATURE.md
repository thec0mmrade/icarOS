# S3-Compatible Storage Integration

Research notes for implementing S3-compatible storage in icarOS.

## Browser-Compatible Clients

### 1. s3-lite-client (Recommended)

A lightweight S3 client designed for browsers with no dependencies:

- **Size**: ~21 KB minified (~8 KB gzipped) vs AWS SDK's 399 KB
- **Browser support**: Works with any runtime supporting `fetch`, web streams, and ESM
- **MIT licensed**, derived from MinIO client

```typescript
import { S3Client } from "https://esm.sh/jsr/@bradenmacdonald/s3-lite-client";

const client = new S3Client({
  endPoint: "s3.amazonaws.com",
  region: "us-east-1",
  accessKey: "...",
  secretKey: "...",
});

// List, get, put objects
await client.putObject("bucket", "key", data);
const obj = await client.getObject("bucket", "key");
```

**Features:**

- List objects
- Get/download objects (with streaming support)
- Upload objects from string, Uint8Array, or ReadableStream
- Create pre-signed POST policy for direct browser uploads
- Check if a bucket exists, create buckets, remove buckets

### 2. @aws-sdk/client-s3

Official AWS SDK - heavier but full-featured with browser support.

### 3. AWS Storage Browser for S3

Open-source React component for browsing S3 buckets - could integrate well with icarOS's React architecture.

## Self-Hosted S3-Compatible Servers

### MinIO

High-performance S3-compatible object storage (AGPLv3):

- Drop-in S3 API replacement
- Provides JavaScript SDK
- Can run locally or on any server

### Scality CloudServer (Zenko)

Node.js S3 implementation with multi-cloud backend support (Azure, Google Cloud).

## Integration Approach for icarOS

Given the existing BrowserFS architecture, potential implementation:

1. **Create a new BrowserFS backend** that uses s3-lite-client
2. **Mount S3 buckets** similar to how HTTP filesystems are mounted
3. **Add to FileSystem context** alongside existing `mountHttpRequestFs()`

```typescript
// Potential API in contexts/fileSystem/useFileSystemContextState.ts
const mountS3Fs = useCallback(
  async (mountPoint: string, config: S3Config) => {
    // Use s3-lite-client to implement BrowserFS backend
    // Similar pattern to mountHttpRequestFs()
  },
  [rootFs]
);
```

### Implementation Steps

1. Add s3-lite-client dependency
2. Create S3 BrowserFS backend adapter (`contexts/fileSystem/S3Backend.ts`)
3. Add `mountS3Fs()` to FileSystem context
4. Create UI for configuring S3 connections (endpoint, credentials, bucket)
5. Add S3 mount option to FileExplorer context menu

### Security Considerations

- Credentials should be stored securely (not in localStorage plaintext)
- Consider using pre-signed URLs for temporary access
- Support for IAM roles and session tokens

## Resources

- [s3-lite-client on GitHub](https://github.com/bradenmacdonald/s3-lite-client)
- [s3-lite-client on JSR](https://jsr.io/@bradenmacdonald/s3-lite-client)
- [MinIO](https://github.com/minio/minio)
- [Scality CloudServer](https://github.com/scality/cloudserver)
- [AWS Storage Browser for S3](https://aws.amazon.com/about-aws/whats-new/2024/09/storage-browser-amazon-s3-alpha-release/)
- [S3-Compatible Storage Providers Guide](https://cloudian.com/guides/s3-storage/best-s3-compatible-storage-providers-top-5-options-in-2026/)
