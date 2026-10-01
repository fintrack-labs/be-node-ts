import { AuditSubscriber } from '@common/subscribers/audit.subscriber.js';
import { SoftDeleteSubscriber } from '@common/subscribers/soft-delete.subscriber.js';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
    'database',
    (): TypeOrmModuleOptions => {
        return {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'fintrack_db',
            schema: process.env.DB_SCHEMA || 'fintrack-labs',
            autoLoadEntities: true,
            subscribers: [AuditSubscriber, SoftDeleteSubscriber],
            synchronize: false,
            logging: process.env.NODE_ENV === 'development',
            extra: {
                decimalNumbers: true,
                parseInt8: true
            },
            ssl:
                process.env.DB_SSL === 'true'
                    ? { rejectUnauthorized: false }
                    : false,
        }
    },
);