import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { TransactionsController } from './transactions.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { AccountsModule } from '@modules/accounts/accounts.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AuthModule,
    AccountsModule
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController]
})
export class TransactionsModule { }
