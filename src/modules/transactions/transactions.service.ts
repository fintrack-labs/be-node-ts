import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Transaction } from './transaction.entity.js';
import { AdjustBalanceDto, CreateTransactionDto, TransactionGetDto, TransactionResponseDto } from './transaction.dto.js';
import { Account } from '../accounts/account.entity.js';
import { TransactionType } from './transaction.enum.js';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface.js';

const MAX_LOCK_RETRIES = 3;
const LOCK_RETRY_DELAY_MS = 10;
const RETRYABLE_LOCK_ERROR_CODES = new Set(['55P03', '40P01', '40001']);

function isRetryableLockError(error: unknown): boolean {
    const code = (error as { code?: unknown })?.code;
    return typeof code === 'string' && RETRYABLE_LOCK_ERROR_CODES.has(code);
}

function waitForLockRetry(attempt: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, LOCK_RETRY_DELAY_MS * attempt);
    });
}

@Injectable()
export class TransactionsService {

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly dataSource: DataSource
    ) { }

    async create(userId: string, dto: CreateTransactionDto): Promise<TransactionResponseDto> {
        this.validateCreateInput(userId, dto);
        return this.createWithRetry(userId, dto, 0);
    }

    private async createWithRetry(
        userId: string,
        dto: CreateTransactionDto,
        attempt: number,
    ): Promise<TransactionResponseDto> {
        try {
            const result = await this.createWithLock(userId, dto);
            return result;
        } catch (error) {
            if (!isRetryableLockError(error) || attempt >= MAX_LOCK_RETRIES) {
                throw error;
            }

            await waitForLockRetry(attempt + 1);
            return this.createWithRetry(userId, dto, attempt + 1);
        }
    }

    private validateCreateInput(userId: string, dto: CreateTransactionDto): void {
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
        if (dto.type === TransactionType.TRANSFER && !dto.destinationAccountId) {
            throw new BadRequestException('Destination account is required for internal transfer');
        }
        if (dto.sourceAccountId && dto.destinationAccountId && dto.sourceAccountId === dto.destinationAccountId) {
            throw new BadRequestException('Source and destination account can not be same');
        }
    }

    private async createWithLock(userId: string, dto: CreateTransactionDto): Promise<TransactionResponseDto> {
        return this.dataSource.transaction(async (manager) => {
            const { sourceAccount, destAccount } = await this.loadAccounts(manager, userId, dto);

            if (sourceAccount && dto.amount > sourceAccount.balance) {
                throw new BadRequestException('Insufficient balance');
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

    private async loadAccounts(
        manager: EntityManager,
        userId: string,
        dto: CreateTransactionDto,
    ): Promise<{ sourceAccount: Account | null; destAccount: Account | null }> {
        const accountIds = [dto.sourceAccountId, dto.destinationAccountId]
            .filter((id): id is number => id !== undefined && id !== null)
            .sort((left, right) => left - right);

        return accountIds.reduce(async (accountsPromise, accountId) => {
            const accounts = await accountsPromise;
            const account = await manager.findOne(Account, {
                where: { id: accountId, userId },
                lock: { mode: 'pessimistic_write', onLocked: 'nowait' }
            });
            if (!account) {
                throw new NotFoundException(
                    `${accountId === dto.sourceAccountId ? 'Source' : 'Destination'} Account not found`
                );
            }

            if (accountId === dto.sourceAccountId) {
                accounts.sourceAccount = account;
            } else {
                accounts.destAccount = account;
            }
            return accounts;
        }, Promise.resolve({ sourceAccount: null as Account | null, destAccount: null as Account | null }));
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
