import {
  type BFSCallback,
  type BFSOneArgCallback,
  BaseFileSystem,
  type FileSystemOptions,
} from "browserfs/dist/node/core/file_system";
import { ApiError, ErrorCode } from "browserfs/dist/node/core/api_error";
import Stats, { FileType } from "browserfs/dist/node/core/node_fs_stats";
import { type S3Client } from "@aws-sdk/client-s3";
import {
  copyObject,
  createS3Client,
  deleteObject,
  getObject,
  headObject,
  listObjects,
  putObject,
  type S3Config,
} from "utils/s3";

type S3Options = S3Config;

type DirectoryCache = {
  entries: { isDir: boolean; name: string }[];
  timestamp: number;
};

const CACHE_TTL_MS = 30000;

export default class S3FileSystem extends BaseFileSystem {
  public static readonly Name = "S3FileSystem";

  public static readonly Options: FileSystemOptions = {};

  public static Create(opts: S3Options, cb: BFSCallback<S3FileSystem>): void {
    try {
      const fs = new S3FileSystem(opts);

      cb(undefined, fs);
    } catch (error) {
      cb(new ApiError(ErrorCode.EIO, String(error)));
    }
  }

  public static isAvailable(): boolean {
    return true;
  }

  private bucket: string;

  private client: S3Client;

  private dirCache = new Map<string, DirectoryCache>();

  public constructor(config: S3Options) {
    super();
    this.client = createS3Client(config);
    this.bucket = config.bucket;
  }

  public getName(): string {
    return S3FileSystem.Name;
  }

  public isReadOnly(): boolean {
    return false;
  }

  public supportsSymlinks(): boolean {
    return false;
  }

  public supportsProps(): boolean {
    return false;
  }

  public supportsSynch(): boolean {
    return false;
  }

  public override stat(
    p: string,
    isLstat: boolean | null,
    cb: BFSCallback<Stats>
  ): void {
    const key = this.pathToKey(p);

    if (key === "") {
      cb(
        undefined,
        new Stats(FileType.DIRECTORY, 4096, 0o755, Date.now(), Date.now())
      );
      return;
    }

    headObject(this.client, this.bucket, key)
      .then((result) => {
        if (result) {
          const mtime = result.lastModified?.getTime() || Date.now();

          cb(
            undefined,
            new Stats(FileType.FILE, result.contentLength, 0o644, mtime, mtime)
          );
        } else {
          this.isDirectory(key)
            .then((isDir) => {
              if (isDir) {
                cb(
                  undefined,
                  new Stats(
                    FileType.DIRECTORY,
                    4096,
                    0o755,
                    Date.now(),
                    Date.now()
                  )
                );
              } else {
                cb(ApiError.ENOENT(p));
              }
            })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            .catch(() => cb(ApiError.ENOENT(p)));
        }
      })
      .catch(() => {
        this.isDirectory(key)
          .then((isDir) => {
            if (isDir) {
              cb(
                undefined,
                new Stats(
                  FileType.DIRECTORY,
                  4096,
                  0o755,
                  Date.now(),
                  Date.now()
                )
              );
            } else {
              cb(ApiError.ENOENT(p));
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          .catch(() => cb(ApiError.ENOENT(p)));
      });
  }

  public override readdir(p: string, cb: BFSCallback<string[]>): void {
    const key = this.pathToKey(p);
    const prefix = key ? `${key}/` : "";

    const cached = this.getCachedDir(prefix);

    if (cached) {
      cb(
        undefined,
        cached.entries.map((e) => e.name)
      );
      return;
    }

    this.listAll(prefix)
      .then((entries) => {
        this.setCachedDir(prefix, entries);
        cb(
          undefined,
          entries.map((e) => e.name)
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .catch(() => cb(ApiError.ENOENT(p)));
  }

  public override readFile(
    fname: string,
    encoding: string | null,
    flag: unknown,
    cb: BFSCallback<Buffer>
  ): void {
    const key = this.pathToKey(fname);

    getObject(this.client, this.bucket, key)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .then((data) => cb(undefined, Buffer.from(data)))
      .catch(() => {
        cb(ApiError.ENOENT(fname));
      });
  }

  public override writeFile(
    fname: string,
    data: Buffer | string,
    encoding: string | null,
    flag: unknown,
    mode: number,
    cb: BFSOneArgCallback
  ): void {
    const key = this.pathToKey(fname);
    const buffer = typeof data === "string" ? Buffer.from(data) : data;

    putObject(this.client, this.bucket, key, buffer)
      .then(() => {
        this.invalidateParentCache(key);
        // eslint-disable-next-line unicorn/no-null
        cb(null);
      })
      .catch((error) => {
        cb(new ApiError(ErrorCode.EIO, `Write failed: ${error}`, fname));
      });
  }

  public override unlink(p: string, cb: BFSOneArgCallback): void {
    const key = this.pathToKey(p);

    deleteObject(this.client, this.bucket, key)
      .then(() => {
        this.invalidateParentCache(key);
        // eslint-disable-next-line unicorn/no-null
        cb(null);
      })
      .catch((error) => {
        cb(new ApiError(ErrorCode.EIO, `Delete failed: ${error}`, p));
      });
  }

  public override mkdir(p: string, mode: number, cb: BFSOneArgCallback): void {
    const key = this.pathToKey(p);
    const dirKey = key.endsWith("/") ? key : `${key}/`;

    putObject(this.client, this.bucket, `${dirKey}.keep`, Buffer.from(""))
      .then(() => {
        this.invalidateParentCache(key);
        // eslint-disable-next-line unicorn/no-null
        cb(null);
      })
      .catch((error) => {
        cb(new ApiError(ErrorCode.EIO, `Mkdir failed: ${error}`, p));
      });
  }

  public override rmdir(p: string, cb: BFSOneArgCallback): void {
    const key = this.pathToKey(p);
    const dirKey = key.endsWith("/") ? key : `${key}/`;

    deleteObject(this.client, this.bucket, `${dirKey}.keep`)
      .then(() => {
        this.invalidateParentCache(key);
        // eslint-disable-next-line unicorn/no-null
        cb(null);
      })
      .catch(() => {
        // eslint-disable-next-line unicorn/no-null
        cb(null);
      });
  }

  public override rename(
    oldPath: string,
    newPath: string,
    cb: BFSOneArgCallback
  ): void {
    const oldKey = this.pathToKey(oldPath);
    const newKey = this.pathToKey(newPath);

    copyObject(this.client, this.bucket, oldKey, newKey)
      .then(() => deleteObject(this.client, this.bucket, oldKey))
      .then(() => {
        this.invalidateParentCache(oldKey);
        this.invalidateParentCache(newKey);
        // eslint-disable-next-line unicorn/no-null
        cb(null);
      })
      .catch((error) => {
        cb(new ApiError(ErrorCode.EIO, `Rename failed: ${error}`, oldPath));
      });
  }

  public override exists(p: string, cb: (exists: boolean) => void): void {
    const key = this.pathToKey(p);

    if (key === "") {
      cb(true);
      return;
    }

    headObject(this.client, this.bucket, key)
      .then((result) => {
        if (result) {
          cb(true);
        } else {
          this.isDirectory(key)
            .then(cb)
            .catch(() => cb(false));
        }
      })
      .catch(() => {
        this.isDirectory(key)
          .then(cb)
          .catch(() => cb(false));
      });
  }

  private pathToKey(p: string): string {
    return p.replace(/^\/+/, "").replace(/\/+$/, "");
  }

  private async isDirectory(key: string): Promise<boolean> {
    const prefix = key ? `${key}/` : "";
    const result = await listObjects(this.client, this.bucket, prefix);

    return result.contents.length > 0 || result.prefixes.length > 0;
  }

  private async listAll(
    prefix: string
  ): Promise<{ isDir: boolean; name: string }[]> {
    const entries: { isDir: boolean; name: string }[] = [];
    let continuationToken: string | undefined;

    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await listObjects(
        this.client,
        this.bucket,
        prefix,
        continuationToken
      );

      for (const item of result.contents) {
        const name = item.key.slice(prefix.length).replace(/\/$/, "");

        if (name && !name.includes("/") && name !== ".keep") {
          entries.push({ isDir: false, name });
        }
      }

      for (const prefixItem of result.prefixes) {
        const name = prefixItem.slice(prefix.length).replace(/\/$/, "");

        if (name && !name.includes("/")) {
          entries.push({ isDir: true, name });
        }
      }

      continuationToken = result.isTruncated
        ? result.nextContinuationToken
        : undefined;
    } while (continuationToken);

    return entries;
  }

  private getCachedDir(prefix: string): DirectoryCache | undefined {
    const cached = this.dirCache.get(prefix);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached;
    }

    if (cached) {
      this.dirCache.delete(prefix);
    }

    return undefined;
  }

  private setCachedDir(
    prefix: string,
    entries: { isDir: boolean; name: string }[]
  ): void {
    this.dirCache.set(prefix, { entries, timestamp: Date.now() });
  }

  private invalidateParentCache(key: string): void {
    const parts = key.split("/");

    parts.pop();
    const parentPrefix = parts.length > 0 ? `${parts.join("/")}/` : "";

    this.dirCache.delete(parentPrefix);
  }
}
