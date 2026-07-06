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

  private readonly channelName = 'audit-channel';
  private readonly chaincodeName = 'audit-anchor';

  async getContract(): Promise<Contract> {
    if (this.contract) {
      return this.contract;
    }

    const rootPath = '/app';

    const certPath = path.resolve(
      rootPath,
      'blockchain/organizations/peerOrganizations/org1.opspilot.com/users/Admin@org1.opspilot.com/msp/signcerts',
    );

    const keyPath = path.resolve(
      rootPath,
      'blockchain/organizations/peerOrganizations/org1.opspilot.com/users/Admin@org1.opspilot.com/msp/keystore',
    );

    const tlsCertPath = path.resolve(
      rootPath,
      'blockchain/organizations/peerOrganizations/org1.opspilot.com/peers/peer0.org1.opspilot.com/tls/ca.crt',
    );

    const peerEndpoint = 'peer0.org1.opspilot.com:7051';
    const peerHostAlias = 'peer0.org1.opspilot.com';

    const certFile = this.getFirstFile(certPath);
    const keyFile = this.getFirstFile(keyPath);

    const identity: Identity = {
      mspId: 'Org1MSP',
      credentials: fs.readFileSync(certFile),
    };

    const privateKey = crypto.createPrivateKey(fs.readFileSync(keyFile));
    const signer: Signer = signers.newPrivateKeySigner(privateKey);

    const tlsRootCert = fs.readFileSync(tlsCertPath);

    this.client = new grpc.Client(
      peerEndpoint,
      grpc.credentials.createSsl(tlsRootCert),
      {
        'grpc.ssl_target_name_override': 'peer0.org1.opspilot.com',
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
}
