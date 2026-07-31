import { createHash } from 'crypto';

export function createSha256Hash(payload: unknown): string {
  const normalizedPayload = JSON.stringify(sortRecursively(payload));

  return createHash('sha256').update(normalizedPayload).digest('hex');
}

// Compatibility for anchors created before recursive canonicalization was
// introduced. The old JSON replacer only retained top-level payload keys.
export function createLegacySha256Hash(payload: unknown): string {
  const normalizedPayload = JSON.stringify(
    payload,
    Object.keys(payload as Record<string, unknown>).sort(),
  );

  return createHash('sha256').update(normalizedPayload).digest('hex');
}

function sortRecursively(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortRecursively);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortRecursively(
          (value as Record<string, unknown>)[key],
        );
        return result;
      }, {});
  }

  return value;
}
