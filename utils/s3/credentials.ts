import { openDB } from "idb";

const S3_ACCESS_PREFIX = "s3_access_";
const S3_SECRET_PREFIX = "s3_secret_";

// Credentials are encrypted at rest with AES-GCM. The key is generated
// non-extractable and kept in IndexedDB, so a plain localStorage dump (the
// trivial XSS exfiltration path) yields only ciphertext — an attacker must
// additionally reach the IndexedDB CryptoKey and replay this decrypt logic.
const CRYPTO_DB = "icaros-credential-crypto";
const CRYPTO_STORE = "keys";
const CRYPTO_KEY_ID = "s3-credential-key";
const IV_LENGTH = 12;

const getCryptoKey = async (): Promise<CryptoKey> => {
  const db = await openDB(CRYPTO_DB, 1, {
    upgrade(database) {
      database.createObjectStore(CRYPTO_STORE);
    },
  });

  try {
    const existingKey = (await db.get(CRYPTO_STORE, CRYPTO_KEY_ID)) as
      | CryptoKey
      | undefined;

    if (existingKey) return existingKey;

    const newKey = await crypto.subtle.generateKey(
      { length: 256, name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    await db.put(CRYPTO_STORE, newKey, CRYPTO_KEY_ID);

    return newKey;
  } finally {
    db.close();
  }
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCodePoint(byte);
  });

  return btoa(binary);
};

const fromBase64 = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (char) => char.codePointAt(0) ?? 0);

const encryptValue = async (plainText: string): Promise<string> => {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const cipherText = new Uint8Array(
    await crypto.subtle.encrypt(
      { iv, name: "AES-GCM" },
      key,
      new TextEncoder().encode(plainText)
    )
  );
  const combined = new Uint8Array(iv.length + cipherText.length);

  combined.set(iv);
  combined.set(cipherText, iv.length);

  return toBase64(combined);
};

const decryptValue = async (stored: string): Promise<string | undefined> => {
  try {
    const combined = fromBase64(stored);
    const iv = new Uint8Array(combined.subarray(0, IV_LENGTH));
    const cipherText = new Uint8Array(combined.subarray(IV_LENGTH));
    const key = await getCryptoKey();
    const plainText = await crypto.subtle.decrypt(
      { iv, name: "AES-GCM" },
      key,
      cipherText
    );

    return new TextDecoder().decode(plainText);
  } catch {
    return undefined;
  }
};

export const storeS3Credentials = async (
  connectionId: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<void> => {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(
    `${S3_ACCESS_PREFIX}${connectionId}`,
    await encryptValue(accessKeyId)
  );
  localStorage.setItem(
    `${S3_SECRET_PREFIX}${connectionId}`,
    await encryptValue(secretAccessKey)
  );
};

export const getS3Credentials = async (
  connectionId: string
): Promise<{ accessKeyId: string; secretAccessKey: string } | undefined> => {
  if (typeof localStorage === "undefined") return undefined;

  const storedAccessKeyId = localStorage.getItem(
    `${S3_ACCESS_PREFIX}${connectionId}`
  );
  const storedSecretAccessKey = localStorage.getItem(
    `${S3_SECRET_PREFIX}${connectionId}`
  );

  if (!storedAccessKeyId || !storedSecretAccessKey) return undefined;

  const accessKeyId = await decryptValue(storedAccessKeyId);
  const secretAccessKey = await decryptValue(storedSecretAccessKey);

  if (!accessKeyId || !secretAccessKey) return undefined;

  return { accessKeyId, secretAccessKey };
};

export const removeS3Credentials = (connectionId: string): void => {
  if (typeof localStorage === "undefined") return;

  localStorage.removeItem(`${S3_ACCESS_PREFIX}${connectionId}`);
  localStorage.removeItem(`${S3_SECRET_PREFIX}${connectionId}`);
};
