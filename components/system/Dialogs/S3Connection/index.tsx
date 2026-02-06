import { memo, useCallback, useEffect, useRef, useState } from "react";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import useCloseOnEscape from "components/system/Dialogs/useCloseOnEscape";
import StyledS3Connection from "components/system/Dialogs/S3Connection/StyledS3Connection";
import {
  DEFAULT_PROVIDER,
  S3_PROVIDERS,
} from "components/system/Dialogs/S3Connection/constants";
import { useFileSystem } from "contexts/fileSystem";
import { useProcesses } from "contexts/process";
import { useSession } from "contexts/session";
import { type S3Connection as S3ConnectionType } from "contexts/session/types";
import { PREVENT_SCROLL } from "utils/constants";
import { haltEvent } from "utils/functions";
import { storeS3Credentials, removeS3Credentials } from "utils/s3/credentials";

const S3Connection: FC<ComponentProcessProps> = ({ id }) => {
  const { closeWithTransition } = useProcesses();
  const { mountS3, unMountS3 } = useFileSystem();
  const { s3Connections, setS3Connections } = useSession();
  const closeOnEscape = useCloseOnEscape(id);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [provider, setProvider] = useState<string>(DEFAULT_PROVIDER);
  const [connectionName, setConnectionName] = useState("");
  const [endpoint, setEndpoint] = useState(
    S3_PROVIDERS[DEFAULT_PROVIDER].endpoint
  );
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [bucket, setBucket] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [status, setStatus] = useState<{
    message: string;
    type: "error" | "success" | "";
  }>({ message: "", type: "" });
  const [isConnecting, setIsConnecting] = useState(false);

  const handleProviderChange = useCallback(
    (newProvider: string) => {
      setProvider(newProvider);
      const providerConfig = S3_PROVIDERS[newProvider];

      if (providerConfig) {
        let newEndpoint = providerConfig.endpoint;

        if (newProvider === "aws" && region) {
          newEndpoint = newEndpoint.replace("{region}", region);
        }
        setEndpoint(newEndpoint);
      }
    },
    [region]
  );

  const handleRegionChange = useCallback(
    (newRegion: string) => {
      setRegion(newRegion);
      if (provider === "aws") {
        setEndpoint(S3_PROVIDERS.aws.endpoint.replace("{region}", newRegion));
      }
    },
    [provider]
  );

  const generateConnectionId = useCallback(
    () => `s3_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const handleConnect = useCallback(async () => {
    if (
      !connectionName.trim() ||
      !endpoint.trim() ||
      !accessKeyId.trim() ||
      !secretAccessKey.trim() ||
      !bucket.trim()
    ) {
      setStatus({
        message: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    const existingConnection = (s3Connections || []).find(
      (conn) => conn.name === connectionName.trim()
    );

    if (existingConnection) {
      setStatus({
        message: "A connection with this name already exists",
        type: "error",
      });
      return;
    }

    setIsConnecting(true);
    setStatus({ message: "Connecting...", type: "" });

    const connectionId = generateConnectionId();
    const connection: S3ConnectionType = {
      bucket: bucket.trim(),
      endpoint: endpoint.trim(),
      id: connectionId,
      name: connectionName.trim(),
      provider: provider as S3ConnectionType["provider"],
      region: S3_PROVIDERS[provider]?.regionRequired ? region : undefined,
    };

    try {
      storeS3Credentials(
        connectionId,
        accessKeyId.trim(),
        secretAccessKey.trim()
      );
      await mountS3(connection);

      setS3Connections((prev) => [...prev, connection]);
      setStatus({ message: "Connected successfully!", type: "success" });

      setConnectionName("");
      setAccessKeyId("");
      setSecretAccessKey("");
      setBucket("");
    } catch (error) {
      removeS3Credentials(connectionId);
      setStatus({
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [
    accessKeyId,
    bucket,
    connectionName,
    endpoint,
    generateConnectionId,
    mountS3,
    provider,
    region,
    s3Connections,
    secretAccessKey,
    setS3Connections,
  ]);

  const handleDisconnect = useCallback(
    (connection: S3ConnectionType) => {
      unMountS3(connection.name);
      removeS3Credentials(connection.id);
      setS3Connections((prev) =>
        prev.filter((conn) => conn.id !== connection.id)
      );
      setStatus({ message: "Disconnected", type: "success" });
    },
    [setS3Connections, unMountS3]
  );

  useEffect(() => {
    dialogRef.current?.focus(PREVENT_SCROLL);
  }, []);

  return (
    <StyledS3Connection
      ref={dialogRef}
      onContextMenu={(event) => {
        if (
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLSelectElement)
        ) {
          haltEvent(event);
        }
      }}
      {...closeOnEscape}
    >
      <h3>S3 Storage Connections</h3>

      <div className="connections-list">
        {!s3Connections || s3Connections.length === 0 ? (
          <div className="empty-message">No connections configured</div>
        ) : (
          s3Connections.map((connection) => (
            <div key={connection.id} className="connection-item">
              <div className="connection-info">
                <div className="connection-name">{connection.name}</div>
                <div className="connection-details">
                  {S3_PROVIDERS[connection.provider]?.name ||
                    connection.provider}{" "}
                  - {connection.bucket}
                </div>
              </div>
              <button
                className="disconnect-btn"
                onClick={() => handleDisconnect(connection)}
                type="button"
              >
                Disconnect
              </button>
            </div>
          ))
        )}
      </div>

      <div className="form-section">
        <div className="form-row">
          <label htmlFor="s3-provider">Provider:</label>
          <select
            id="s3-provider"
            onChange={(e) => handleProviderChange(e.target.value)}
            value={provider}
          >
            {Object.entries(S3_PROVIDERS).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="s3-name">Name:</label>
          <input
            id="s3-name"
            onChange={(e) => setConnectionName(e.target.value)}
            placeholder="My S3 Storage"
            type="text"
            value={connectionName}
          />
        </div>

        <div className="form-row">
          <label htmlFor="s3-endpoint">Endpoint:</label>
          <input
            id="s3-endpoint"
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://s3.example.com"
            type="text"
            value={endpoint}
          />
        </div>

        {S3_PROVIDERS[provider]?.regionRequired && (
          <div className="form-row">
            <label htmlFor="s3-region">Region:</label>
            <input
              id="s3-region"
              onChange={(e) => handleRegionChange(e.target.value)}
              placeholder="us-east-1"
              type="text"
              value={region}
            />
          </div>
        )}

        <div className="form-row">
          <label htmlFor="s3-bucket">Bucket:</label>
          <input
            id="s3-bucket"
            onChange={(e) => setBucket(e.target.value)}
            placeholder="my-bucket"
            type="text"
            value={bucket}
          />
        </div>

        <div className="form-row">
          <label htmlFor="s3-access-key">Access Key:</label>
          <input
            autoComplete="off"
            id="s3-access-key"
            onChange={(e) => setAccessKeyId(e.target.value)}
            type="text"
            value={accessKeyId}
          />
        </div>

        <div className="form-row">
          <label htmlFor="s3-secret-key">Secret Key:</label>
          <input
            autoComplete="off"
            id="s3-secret-key"
            onChange={(e) => setSecretAccessKey(e.target.value)}
            type="password"
            value={secretAccessKey}
          />
        </div>
      </div>

      {status.message && (
        <div className={`status-message ${status.type}`}>{status.message}</div>
      )}

      <div className="buttons">
        <button
          className="primary"
          disabled={isConnecting}
          onClick={handleConnect}
          type="button"
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
        <button onClick={() => closeWithTransition(id)} type="button">
          Close
        </button>
      </div>
    </StyledS3Connection>
  );
};

export default memo(S3Connection);
