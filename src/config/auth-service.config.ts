import { registerAs } from '@nestjs/config';

export interface AuthServiceConfig {
    baseUrl: string;
    timeout: number;
}

export default registerAs(
    'authService',
    (): AuthServiceConfig => ({
        baseUrl: process.env.BE_AUTH_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.BE_AUTH_TIMEOUT || '5000', 10),
    }),
);