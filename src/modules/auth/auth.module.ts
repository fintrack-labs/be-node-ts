import { Module } from '@nestjs/common';
import { JwksService } from './jwks/jwks.service.js';
import { AuthGuard } from './guards/auth/auth.guard.js';

@Module({
    providers: [JwksService, AuthGuard],
    exports: [AuthGuard, JwksService]
})
export class AuthModule { }
