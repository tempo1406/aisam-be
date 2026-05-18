import { registerAs } from '@nestjs/config';
import { PostgresConfig } from 'src/types/postgre-config.type';

export default registerAs<PostgresConfig>('postgres', () => ({
  host: process.env.POSTGRE_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.POSTGRE_DATABASE_PORT || '5432', 10),
  username: process.env.POSTGRE_DATABASE_USERNAME || 'postgres',
  password: process.env.POSTGRE_DATABASE_PASSWORD || 'postgres',
  database: process.env.POSTGRE_DATABASE_NAME || 'postgres',
  synchronize: process.env.POSTGRE_DATABASE_SYNCHRONIZE === 'true',
  ssl:
    process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra:
    process.env.POSTGRES_SSL === 'true' ? { sslmode: 'require' } : undefined,
}));
