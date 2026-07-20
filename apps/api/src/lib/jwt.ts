import jwt from "jsonwebtoken";

const ALGORITHM = "HS256";
const ACCESS_TOKEN_TTL = "24h";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface AccessTokenPayload {
  sub: string;
  familyGroupId: string;
  tokenVersion: number;
}

/**
 * Call once at boot. Signing/verifying with an undefined secret would
 * silently produce tokens nothing can trust - fail fast instead.
 */
export function assertJwtSecretConfigured(): void {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Copy .env.example to .env and set it.");
  }
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set.");
  }
  return secret;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getSecret(), { algorithm: ALGORITHM, expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getSecret(), { algorithms: [ALGORITHM] }) as AccessTokenPayload;
}
