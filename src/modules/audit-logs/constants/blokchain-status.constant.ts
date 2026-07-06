export const BlockchainStatus = {
  PENDING: 'PENDING',
  ANCHORED: 'ANCHORED',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
} as const;

export type BlockchainStatus =
  (typeof BlockchainStatus)[keyof typeof BlockchainStatus];
