import { useEffect, useRef } from "react";
import { useFileSystem } from "contexts/fileSystem";
import { useSession } from "contexts/session";
import { S3_MOUNT_ROOT } from "utils/constants";

const useS3ConnectionLoader = (): void => {
  const { exists, mkdirRecursive, mountS3, rootFs } = useFileSystem();
  const { s3Connections, sessionLoaded } = useSession();
  const loadedConnectionsRef = useRef(false);

  useEffect(() => {
    if (
      loadedConnectionsRef.current ||
      !rootFs ||
      !sessionLoaded ||
      !s3Connections ||
      s3Connections.length === 0
    ) {
      return;
    }

    loadedConnectionsRef.current = true;

    const mountConnections = async (): Promise<void> => {
      const s3RootExists = await exists(S3_MOUNT_ROOT);

      if (!s3RootExists) {
        await mkdirRecursive(S3_MOUNT_ROOT);
      }

      await Promise.all(
        (s3Connections || []).map((connection) =>
          mountS3(connection).catch(() => {
            // Connection may have invalid credentials, ignore
          })
        )
      );
    };

    mountConnections();
  }, [exists, mkdirRecursive, mountS3, rootFs, s3Connections, sessionLoaded]);
};

export default useS3ConnectionLoader;
