import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockchainEventIdToAuditLogs1783339999999 implements MigrationInterface {
  name = 'AddBlockchainEventIdToAuditLogs1783339999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS blockchain_event_id character varying(255)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_blockchain_event_id
      ON audit_logs(blockchain_event_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_logs_blockchain_event_id
    `);

    await queryRunner.query(`
      ALTER TABLE audit_logs
      DROP COLUMN IF EXISTS blockchain_event_id
    `);
  }
}
