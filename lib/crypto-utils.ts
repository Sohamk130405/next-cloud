export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,

      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptFile(
  fileBuffer: ArrayBuffer,
  password: string
): Promise<{
  encryptedData: ArrayBuffer;
  iv: string;
  salt: string;
  authTag: string;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKeyFromPassword(password, salt);

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileBuffer
  );

  return {
    encryptedData,
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    authTag: btoa(
      String.fromCharCode(...new Uint8Array(encryptedData).slice(-16))
    ),
  };
}

export async function decryptFile(
  encryptedData: ArrayBuffer,
  password: string,
  ivString: string,
  saltString: string
): Promise<ArrayBuffer> {
  const iv = new Uint8Array(
    atob(ivString)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  const salt = new Uint8Array(
    atob(saltString)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  const key = await deriveKeyFromPassword(password, salt);

  return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encryptedData);
}

export async function hashPassword(
  password: string,
  salt: Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}
