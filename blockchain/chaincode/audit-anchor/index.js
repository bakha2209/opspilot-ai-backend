'use strict';

const { Contract } = require('fabric-contract-api');

class AuditAnchorContract extends Contract {
  async InitLedger(ctx) {
    return;
  }

  async CreateAuditAnchor(
    ctx,
    eventId,
    companyId,
    eventType,
    resourceType,
    resourceId,
    payloadHash,
    createdAt,
  ) {
    const asset = {
      eventId,
      companyId,
      eventType,
      resourceType,
      resourceId,
      payloadHash,
      createdAt,
      blockchainTimestamp: createdAt,
    };

    await ctx.stub.putState(eventId, Buffer.from(JSON.stringify(asset)));

    return JSON.stringify(asset);
  }

  async GetAuditAnchor(ctx, eventId) {
    const bytes = await ctx.stub.getState(eventId);

    if (!bytes || bytes.length === 0) {
      throw new Error('Audit anchor not found');
    }

    return bytes.toString();
  }

  async VerifyAuditAnchor(ctx, eventId, payloadHash) {
    const bytes = await ctx.stub.getState(eventId);

    if (!bytes || bytes.length === 0) {
      return JSON.stringify({
        verified: false,
        reason: 'NOT_FOUND',
      });
    }

    const anchor = JSON.parse(bytes.toString());

    return JSON.stringify({
      verified: anchor.payloadHash === payloadHash,
      storedHash: anchor.payloadHash,
      requestHash: payloadHash,
    });
  }
}

module.exports = AuditAnchorContract;
