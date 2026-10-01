import { Controller, Get, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthGuard } from '../auth/guards/auth/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { type UserPojo } from '@common/interfaces/user.interface.js';

@Controller('health')
export class HealthController {

    constructor(private dataSource: DataSource) { }

    @Get()
    async check() {
        const isDbConnected = this.dataSource.isInitialized;
        let dbStatus = 'DOWN'; if (isDbConnected) {
            try {
                await this.dataSource.query('SELECT 1');
                dbStatus = 'UP';
            } catch {
                dbStatus = 'ERROR';
            }
        }

        return {
            status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: dbStatus,
                    connected: isDbConnected,
                },
            },
        };
    }

    @Get('ping')
    ping() {
        return { message: 'pong' };
    }

    @Get("protected")
    @UseGuards(AuthGuard)
    protected(@CurrentUser() user: UserPojo) {
        return {
            status: 'ok',
            message: 'AuthGuard & JWKS verification working properly!',
            authenticatedUser: user,
        };
    }

}
