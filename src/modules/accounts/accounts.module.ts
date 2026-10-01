import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service.js';
import { AccountsController } from './accounts.controller.js';
import { Account } from './account.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@modules/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    AuthModule
  ],
  providers: [AccountsService],
  controllers: [AccountsController],
  exports: [AccountsService, TypeOrmModule]
})
export class AccountsModule { }
