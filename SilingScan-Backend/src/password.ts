import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

const deriveKey = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key as Buffer);
    });
  });

export const hashPassword = async (
  password: string,
): Promise<{ passwordHash: string; passwordSalt: string }> => {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);

  return {
    passwordHash: key.toString("base64"),
    passwordSalt: salt.toString("base64"),
  };
};

export const verifyPassword = async (
  password: string,
  passwordHash: string,
  passwordSalt: string,
): Promise<boolean> => {
  const expectedKey = Buffer.from(passwordHash, "base64");
  const actualKey = await deriveKey(password, Buffer.from(passwordSalt, "base64"));

  return (
    expectedKey.length === actualKey.length &&
    timingSafeEqual(expectedKey, actualKey)
  );
};
