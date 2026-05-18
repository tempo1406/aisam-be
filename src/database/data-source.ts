import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.dev';
config({ path: path.resolve(process.cwd(), envFile) });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRE_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.POSTGRE_DATABASE_PORT || '5432', 10),
  username: process.env.POSTGRE_DATABASE_USERNAME || 'postgres',
  password: process.env.POSTGRE_DATABASE_PASSWORD || 'postgres',
  database: process.env.POSTGRE_DATABASE_NAME || 'postgres',
  synchronize: process.env.POSTGRE_DATABASE_SYNCHRONIZE === 'true',
  ssl:
    process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [`${__dirname}/../modules/**/entities/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});

export default AppDataSource;
