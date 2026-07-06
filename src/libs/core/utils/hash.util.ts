import { createHash } from 'crypto';

export function createSha256Hash(payload: unknown): string {
  const normalizedPayload = JSON.stringify(
    payload,
    Object.keys(payload as any).sort(),
  );

  return createHash('sha256').update(normalizedPayload).digest('hex');
}
