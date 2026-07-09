import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  connect,
  Contract,
  Gateway,
  Identity,
  Signer,
  signers,
} from '@hyperledger/fabric-gateway';
import * as grpc from '@grpc/grpc-js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FabricGatewayService implements OnModuleDestroy {
  private gateway: Gateway | null = null;
  private contract: Contract | null = null;
  private client: grpc.Client | null = null;

  private readonly channelName =
    process.env.FABRIC_CHANNEL_NAME ?? 'audit-channel';

  private readonly chaincodeName =
    process.env.FABRIC_CHAINCODE_NAME ?? 'audit-anchor';

  async getContract(): Promise<Contract> {
    if (this.contract) {
      return this.contract;
    }

   const certPath = process.env.FABRIC_CERT_PATH!;
   const keyPath = process.env.FABRIC_KEY_PATH!;
   const tlsCertPath = process.env.FABRIC_TLS_CERT_PATH!;

   const peerEndpoint =
     process.env.FABRIC_PEER_ENDPOINT ?? 'peer0.org1.opspilot.com:7051';

   const peerHostAlias =
     process.env.FABRIC_PEER_HOST_ALIAS ?? 'peer0.org1.opspilot.com';

    const certFile = this.getFirstFile(certPath);
    const keyFile = this.getFirstFile(keyPath);

    const identity: Identity = {
      mspId: process.env.FABRIC_MSP_ID ?? 'Org1MSP',
      credentials: fs.readFileSync(certFile),
    };

    const privateKey = crypto.createPrivateKey(fs.readFileSync(keyFile));
    const signer: Signer = signers.newPrivateKeySigner(privateKey);

    const tlsRootCert = fs.readFileSync(tlsCertPath);

    this.client = new grpc.Client(
      peerEndpoint,
      grpc.credentials.createSsl(tlsRootCert),
      {
        'grpc.ssl_target_name_override': peerHostAlias,
      },
    );

    this.gateway = connect({
      client: this.client,
      identity,
      signer,
      evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
      endorseOptions: () => ({ deadline: Date.now() + 15000 }),
      submitOptions: () => ({ deadline: Date.now() + 15000 }),
      commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
    });

    const network = this.gateway.getNetwork(this.channelName);
    this.contract = network.getContract(this.chaincodeName);

    return this.contract;
  }

  async onModuleDestroy() {
    this.gateway?.close();
    this.client?.close();
  }

  async testConnection() {
    const contract = await this.getContract();

    const resultBytes = await contract.evaluateTransaction(
      'GetAuditAnchor',
      'event-005',
    );

    const resultJson = new TextDecoder().decode(resultBytes);

    return JSON.parse(resultJson);
  }

  private getFirstFile(dirPath: string): string {
    const files = fs.readdirSync(dirPath);

    if (!files.length) {
      throw new Error(`No files found in ${dirPath}`);
    }

    return path.join(dirPath, files[0]);
  }

  async createAuditAnchor(input: {
    eventId: string;
    companyId: string;
    eventType: string;
    resourceType: string;
    resourceId: string;
    payloadHash: string;
    createdAt: string;
  }) {
    const contract = await this.getContract();

    const transaction = contract.newProposal('CreateAuditAnchor', {
      arguments: [
        input.eventId,
        input.companyId,
        input.eventType,
        input.resourceType,
        input.resourceId,
        input.payloadHash,
        input.createdAt,
      ],
    });

    const endorsedTransaction = await transaction.endorse();

    const txId = transaction.getTransactionId();

    const committedTransaction = await endorsedTransaction.submit();

    const resultBytes = committedTransaction.getResult();
    const resultJson = new TextDecoder().decode(resultBytes);

    return {
      txId,
      result: JSON.parse(resultJson),
    };
  }

  async getAuditAnchor(eventId: string) {
    const contract = await this.getContract();

    const resultBytes = await contract.evaluateTransaction(
      'GetAuditAnchor',
      eventId,
    );

    const resultJson = new TextDecoder().decode(resultBytes);

    return JSON.parse(resultJson);
  }

  async verifyAuditAnchor(eventId: string, payloadHash: string) {
    const contract = await this.getContract();

    const resultBytes = await contract.evaluateTransaction(
      'VerifyAuditAnchor',
      eventId,
      payloadHash,
    );

    const resultJson = new TextDecoder().decode(resultBytes);

    return JSON.parse(resultJson);
  }

  async healthCheck() {
    const contract = await this.getContract();

    await contract.evaluateTransaction(
      'VerifyAuditAnchor',
      'health-check-event',
      'health-check-hash',
    );

    return {
      status: 'UP',
      channel: this.channelName,
      chaincode: this.chaincodeName,
    };
  }
}
