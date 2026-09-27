import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from './transaction.entity.js';
import { CreateTransactionDto, TransactionResponseDto } from './transaction.dto.js';
import { Account } from '../accounts/account.entity.js';
import { TransactionType } from './transaction.enum.js';

@Injectable()
export class TransactionsService {

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly dataSource: DataSource
    ) { }

    // : Promise<TransactionResponseDto>
    async create(userId: string, dto: CreateTransactionDto) {
        console.log('DEBUG ', userId, dto)

        // implement optimistic lock and retry
        return await this.dataSource.transaction(async (manager) => {
            let sourceAccount: Account | null = null;
            let destAccount: Account | null = null;

            // Filter incoming data
            if (!userId) {
                throw new BadRequestException('User ID is required');
            }
            if (dto.amount <= 0) {
                throw new BadRequestException('Amount must be greater than 0');
            }
            if (dto.type === TransactionType.EXPENSE || dto.type === TransactionType.TRANSFER) {
                if (!dto.sourceAccountId) {
                    throw new BadRequestException('Source account not found');
                }
            }
            if (dto.type === TransactionType.INCOME || dto.type === TransactionType.TRANSFER) {
                if (!dto.destinationAccountId && dto.type === TransactionType.TRANSFER) {
                    throw new BadRequestException('Destination account is required for internal transfer');
                }
            }
            if (dto.sourceAccountId && dto.destinationAccountId && dto.sourceAccountId === dto.destinationAccountId) {
                throw new BadRequestException('Source and destination account can not be same');
            }

            // optimistic lock for source account
            if (dto.sourceAccountId) {
                const first = await manager.findOne(Account, {
                    where: { id: dto.sourceAccountId, userId },
                    lock: { mode: 'pessimistic_write' }
                });
                if (!first) {
                    throw new NotFoundException(`Source Account not found`);
                }

                // for expense transaction like bill, money to external source
                if (dto.amount > first.balance) {
                    throw new BadRequestException('Insufficient balance');
                }
                sourceAccount = first;
            }

            // optimistic lock for destination account
            if (dto.destinationAccountId) {
                const second = await manager.findOne(Account, {
                    where: { id: dto.destinationAccountId, userId },
                    lock: { mode: 'pessimistic_write' }
                });
                if (!second) {
                    throw new NotFoundException(`Destination Account not found`);
                }
                destAccount = second;
            }

            // for transfer internal account, we need rebalance source and destination
            if (dto.type === TransactionType.TRANSFER && sourceAccount && destAccount) {
                sourceAccount.balance -= dto.amount;
                await manager.save(sourceAccount);

                destAccount.balance += dto.amount;
                await manager.save(destAccount);
            }

            // for income transaction like salary, money from external source
            if (dto.type == TransactionType.INCOME && destAccount) {
                destAccount.balance += dto.amount;
                await manager.save(destAccount);
            }

            // for expense transaction like bill, money to external source
            if (dto.type == TransactionType.EXPENSE && sourceAccount) {
                sourceAccount.balance -= dto.amount;
                await manager.save(sourceAccount);
            }

            // save transaction for log history
            const transaction = manager.create(Transaction, {
                ...dto,
                userId
            })
            return await manager.save(transaction);
        })
    }
}
