// import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

// export class CreateCampaignTables1731695925000 implements MigrationInterface {
//   public async up(queryRunner: QueryRunner): Promise<void> {
//     // Drop existing enum types if they exist (from previous failed migrations or schema sync)
//     await queryRunner.query(`
//       DROP TYPE IF EXISTS "campaigns_status_enum" CASCADE;
//       DROP TYPE IF EXISTS "campaign_posts_status_enum" CASCADE;
//       DROP TYPE IF EXISTS "agent_runs_status_enum" CASCADE;
//     `);

//     // Create campaigns table
//     await queryRunner.createTable(
//       new Table({
//         name: 'campaigns',
//         columns: [
//           {
//             name: 'id',
//             type: 'uuid',
//             isPrimary: true,
//             generationStrategy: 'uuid',
//             default: 'uuid_generate_v4()',
//           },
//           {
//             name: 'userId',
//             type: 'uuid',
//             isNullable: false,
//           },
//           {
//             name: 'brandId',
//             type: 'uuid',
//             isNullable: true,
//           },
//           {
//             name: 'name',
//             type: 'varchar',
//             length: '255',
//             isNullable: false,
//           },
//           {
//             name: 'description',
//             type: 'text',
//             isNullable: true,
//           },
//           {
//             name: 'status',
//             type: 'enum',
//             enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
//             default: "'DRAFT'",
//           },
//           {
//             name: 'targetPlatforms',
//             type: 'jsonb',
//             isNullable: false,
//             default: "'[]'",
//           },
//           {
//             name: 'contentGuidelines',
//             type: 'jsonb',
//             isNullable: false,
//           },
//           {
//             name: 'scheduleConfig',
//             type: 'jsonb',
//             isNullable: false,
//           },
//           {
//             name: 'aiConfig',
//             type: 'jsonb',
//             isNullable: false,
//           },
//           {
//             name: 'totalGeneratedPosts',
//             type: 'int',
//             default: 0,
//           },
//           {
//             name: 'totalPublishedPosts',
//             type: 'int',
//             default: 0,
//           },
//           {
//             name: 'metrics',
//             type: 'jsonb',
//             isNullable: true,
//           },
//           {
//             name: 'startDate',
//             type: 'timestamp',
//             isNullable: true,
//           },
//           {
//             name: 'endDate',
//             type: 'timestamp',
//             isNullable: true,
//           },
//           {
//             name: 'createdAt',
//             type: 'timestamp',
//             default: 'now()',
//           },
//           {
//             name: 'updatedAt',
//             type: 'timestamp',
//             default: 'now()',
//           },
//         ],
//       }),
//       true,
//     );

//     // Create campaign_posts table
//     await queryRunner.createTable(
//       new Table({
//         name: 'campaign_posts',
//         columns: [
//           {
//             name: 'id',
//             type: 'uuid',
//             isPrimary: true,
//             generationStrategy: 'uuid',
//             default: 'uuid_generate_v4()',
//           },
//           {
//             name: 'campaignId',
//             type: 'uuid',
//             isNullable: false,
//           },
//           {
//             name: 'userId',
//             type: 'uuid',
//             isNullable: false,
//           },
//           {
//             name: 'content',
//             type: 'text',
//             isNullable: false,
//           },
//           {
//             name: 'images',
//             type: 'jsonb',
//             default: "'[]'",
//           },
//           {
//             name: 'hashtags',
//             type: 'jsonb',
//             default: "'[]'",
//           },
//           {
//             name: 'platformVariants',
//             type: 'jsonb',
//             isNullable: true,
//           },
//           {
//             name: 'suggestedSchedule',
//             type: 'jsonb',
//             default: "'[]'",
//           },
//           {
//             name: 'status',
//             type: 'enum',
//             enum: ['DRAFT', 'APPROVED', 'REJECTED', 'SCHEDULED', 'PUBLISHED', 'FAILED'],
//             default: "'DRAFT'",
//           },
//           {
//             name: 'publishedPosts',
//             type: 'jsonb',
//             default: "'[]'",
//           },
//           {
//             name: 'reviewedBy',
//             type: 'uuid',
//             isNullable: true,
//           },
//           {
//             name: 'reviewedAt',
//             type: 'timestamp',
//             isNullable: true,
//           },
//           {
//             name: 'rejectionReason',
//             type: 'text',
//             isNullable: true,
//           },
//           {
//             name: 'aiMetadata',
//             type: 'jsonb',
//             isNullable: true,
//           },
//           {
//             name: 'createdAt',
//             type: 'timestamp',
//             default: 'now()',
//           },
//           {
//             name: 'updatedAt',
//             type: 'timestamp',
//             default: 'now()',
//           },
//         ],
//       }),
//       true,
//     );

//     // Create agent_runs table
//     await queryRunner.createTable(
//       new Table({
//         name: 'agent_runs',
//         columns: [
//           {
//             name: 'id',
//             type: 'uuid',
//             isPrimary: true,
//             generationStrategy: 'uuid',
//             default: 'uuid_generate_v4()',
//           },
//           {
//             name: 'campaignId',
//             type: 'uuid',
//             isNullable: false,
//           },
//           {
//             name: 'userId',
//             type: 'uuid',
//             isNullable: false,
//           },
//           {
//             name: 'status',
//             type: 'enum',
//             enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
//             default: "'RUNNING'",
//           },
//           {
//             name: 'inputParameters',
//             type: 'jsonb',
//             isNullable: true,
//           },
//           {
//             name: 'output',
//             type: 'jsonb',
//             isNullable: true,
//           },
//           {
//             name: 'errorMessage',
//             type: 'text',
//             isNullable: true,
//           },
//           {
//             name: 'createdAt',
//             type: 'timestamp',
//             default: 'now()',
//           },
//           {
//             name: 'completedAt',
//             type: 'timestamp',
//             isNullable: true,
//           },
//         ],
//       }),
//       true,
//     );

//     // Add foreign keys
//     await queryRunner.createForeignKey(
//       'campaigns',
//       new TableForeignKey({
//         columnNames: ['userId'],
//         referencedColumnNames: ['id'],
//         referencedTableName: 'users',
//         onDelete: 'CASCADE',
//       }),
//     );

//     await queryRunner.createForeignKey(
//       'campaigns',
//       new TableForeignKey({
//         columnNames: ['brandId'],
//         referencedColumnNames: ['id'],
//         referencedTableName: 'brands',
//         onDelete: 'SET NULL',
//       }),
//     );

//     await queryRunner.createForeignKey(
//       'campaign_posts',
//       new TableForeignKey({
//         columnNames: ['campaignId'],
//         referencedColumnNames: ['id'],
//         referencedTableName: 'campaigns',
//         onDelete: 'CASCADE',
//       }),
//     );

//     await queryRunner.createForeignKey(
//       'campaign_posts',
//       new TableForeignKey({
//         columnNames: ['userId'],
//         referencedColumnNames: ['id'],
//         referencedTableName: 'users',
//         onDelete: 'CASCADE',
//       }),
//     );

//     await queryRunner.createForeignKey(
//       'agent_runs',
//       new TableForeignKey({
//         columnNames: ['campaignId'],
//         referencedColumnNames: ['id'],
//         referencedTableName: 'campaigns',
//         onDelete: 'CASCADE',
//       }),
//     );

//     await queryRunner.createForeignKey(
//       'agent_runs',
//       new TableForeignKey({
//         columnNames: ['userId'],
//         referencedColumnNames: ['id'],
//         referencedTableName: 'users',
//         onDelete: 'CASCADE',
//       }),
//     );

//     // Create indexes
//     await queryRunner.query(`
//       CREATE INDEX "IDX_campaigns_userId" ON "campaigns" ("userId");
//       CREATE INDEX "IDX_campaigns_brandId" ON "campaigns" ("brandId");
//       CREATE INDEX "IDX_campaigns_status" ON "campaigns" ("status");
//       CREATE INDEX "IDX_campaign_posts_campaignId" ON "campaign_posts" ("campaignId");
//       CREATE INDEX "IDX_campaign_posts_userId" ON "campaign_posts" ("userId");
//       CREATE INDEX "IDX_campaign_posts_status" ON "campaign_posts" ("status");
//       CREATE INDEX "IDX_agent_runs_campaignId" ON "agent_runs" ("campaignId");
//       CREATE INDEX "IDX_agent_runs_userId" ON "agent_runs" ("userId");
//       CREATE INDEX "IDX_agent_runs_status" ON "agent_runs" ("status");
//     `);
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     // Drop indexes
//     await queryRunner.query(`
//       DROP INDEX IF EXISTS "IDX_campaigns_userId";
//       DROP INDEX IF EXISTS "IDX_campaigns_brandId";
//       DROP INDEX IF EXISTS "IDX_campaigns_status";
//       DROP INDEX IF EXISTS "IDX_campaign_posts_campaignId";
//       DROP INDEX IF EXISTS "IDX_campaign_posts_userId";
//       DROP INDEX IF EXISTS "IDX_campaign_posts_status";
//       DROP INDEX IF EXISTS "IDX_agent_runs_campaignId";
//       DROP INDEX IF EXISTS "IDX_agent_runs_userId";
//       DROP INDEX IF EXISTS "IDX_agent_runs_status";
//     `);

//     // Drop tables (foreign keys will be dropped automatically with CASCADE)
//     await queryRunner.dropTable('agent_runs', true);
//     await queryRunner.dropTable('campaign_posts', true);
//     await queryRunner.dropTable('campaigns', true);
//   }
// }
