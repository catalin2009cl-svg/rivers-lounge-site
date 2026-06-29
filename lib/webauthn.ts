export const rpID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
export const rpName = process.env.WEBAUTHN_RP_NAME ?? 'Rivers Lounge';
export const origin = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:3000';
export const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
