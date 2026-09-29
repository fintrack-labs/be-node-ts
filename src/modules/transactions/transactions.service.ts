import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from './transaction.entity.js';
import { AdjustBalanceDto, CreateTransactionDto, TransactionGetDto, TransactionResponseDto } from './transaction.dto.js';
import { Account } from '../accounts/account.entity.js';
import { TransactionType } from './transaction.enum.js';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface.js';

@Injectable()
export class TransactionsService {

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly dataSource: DataSource
    ) { }

    async create(userId: string, dto: CreateTransactionDto): Promise<TransactionResponseDto> {
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
            const transaction = manager.create(Transaction, Transaction.fromDto(dto, userId));
            const savedTransaction = await manager.save(transaction);
            return plainToInstance(TransactionResponseDto, savedTransaction, {
                excludeExtraneousValues: true
            });
        })
    }

    async find(userId: string, queryDto: TransactionGetDto): Promise<PaginatedResponse<TransactionResponseDto>> {
        const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'DESC', skip } = queryDto;
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.userId = :userId', { userId });

        // filter by dto not empty
        if (queryDto.type) {
            queryBuilder.andWhere("transaction.type = :type", { type: queryDto.type });
        }
        if (queryDto.paymentMethod) {
            queryBuilder.andWhere("transaction.paymentMethod = :paymentMethod", { paymentMethod: queryDto.paymentMethod });
        }
        if (queryDto.categoryId) {
            queryBuilder.andWhere("transaction.categoryId = :categoryId", { categoryId: queryDto.categoryId });
        }
        if (queryDto.description) {
            queryBuilder.andWhere("transaction.description = :description", { description: queryDto.description });
        }
        if (queryDto.merchantName) {
            queryBuilder.andWhere("transaction.merchantName = :merchantName", { merchantName: queryDto.merchantName });
        }
        if (queryDto.transactionDate) {
            queryBuilder.andWhere("transaction.transactionDate = :transactionDate", { transactionDate: queryDto.transactionDate });
        }
        // sorting builder
        if (sortBy && sortOrder) {
            queryBuilder.orderBy(`transaction.${sortBy}`, sortOrder);
        }
        // pagination
        queryBuilder.skip(skip).take(limit);

        const [transactions, totalItems] = await queryBuilder.getManyAndCount();
        const data = plainToInstance(TransactionResponseDto, transactions, {
            excludeExtraneousValues: true
        });
        return {
            data,
            page,
            limit,
            totalItems,
            pageCount: Math.ceil(totalItems / limit),
        };
    }

    private async get(userId: string, id: number): Promise<Transaction> {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.id = :id', { id })
            .andWhere('transaction.userId = :userId', { userId });

        const transaction = await queryBuilder.getOne();
        if (!transaction) {
            throw new NotFoundException(`Transaction not found with id ${id}`);
        }
        return transaction
    }

    async getById(userId: string, id: number): Promise<TransactionResponseDto> {
        const transaction = await this.get(userId, id);
        return plainToInstance(TransactionResponseDto, transaction, {
            excludeExtraneousValues: true
        });
    }

    async adjutmentBalance(userId: string, dto: AdjustBalanceDto): Promise<TransactionResponseDto> {
        // filter dto
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }
        if (dto.actualBalance < 0) {
            throw new BadRequestException('Actual balance must be greater than or equal to 0');
        }

        return this.dataSource.transaction(async (manager) => {
            const account = await manager.findOne(Account, {
                where: { id: dto.accountId, userId },
                lock: { mode: 'pessimistic_write' }
            });
            if (!account) {
                throw new NotFoundException(`Account not found with id ${dto.accountId}`);
            }
            if (dto.actualBalance === account.balance) {
                throw new BadRequestException('Actual balance is same as current balance');
            }

            const diff = dto.actualBalance - account.balance;
            account.balance = dto.actualBalance;
            await manager.save(account);

            const transaction = manager.create(Transaction, {
                type: TransactionType.ADJUSTMENT,
                amount: Math.abs(diff),
                accountId: dto.accountId,
                description: dto.reason || (diff > 0 ? 'Adjustment Balance Increased' : 'Adjustment Balance Decreased'),
                userId
            });

            await manager.save(transaction);
            return plainToInstance(TransactionResponseDto, transaction, {
                excludeExtraneousValues: true
            });
        })
    }
}
