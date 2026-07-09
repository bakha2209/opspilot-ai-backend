export const BLOCKCHAIN_AUDIT_ANCHOR_QUEUE = 'audit.blockchain.anchor';

export const BLOCKCHAIN_AUDIT_DEAD_QUEUE = 'audit.blockchain.dead';

export const BLOCKCHAIN_AUDIT_MAX_RETRY = process.env.BLOCKCHAIN_MAX_RETRY
  ? parseInt(process.env.BLOCKCHAIN_MAX_RETRY, 10)
  : 3;
