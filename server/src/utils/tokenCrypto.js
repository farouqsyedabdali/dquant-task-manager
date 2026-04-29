const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('TOKEN_ENCRYPTION_KEY or JWT_SECRET is required for token encryption');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptToken(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

function decryptToken(value) {
  if (!value) return null;
  const [iv, authTag, encrypted] = String(value).split('.');
  if (!iv || !authTag || !encrypted) {
    throw new Error('Invalid encrypted token format');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

module.exports = {
  encryptToken,
  decryptToken
};
