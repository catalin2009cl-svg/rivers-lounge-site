export const rpID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
export const rpName = process.env.WEBAUTHN_RP_NAME ?? "River's Lounge";
export const origin = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:3000';
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// Warn loudly if running in production without the required env vars — these
// defaults will cause SecurityError on every WebAuthn operation.
if (process.env.NODE_ENV === 'production') {
  if (!process.env.WEBAUTHN_RP_ID)
    console.error('[WebAuthn] WEBAUTHN_RP_ID is not set — defaulting to "localhost". All passkey operations will fail.');
  if (!process.env.WEBAUTHN_ORIGIN)
    console.error('[WebAuthn] WEBAUTHN_ORIGIN is not set — defaulting to "http://localhost:3000". All passkey operations will fail.');
}
