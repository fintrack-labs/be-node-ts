import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service.js';
import { DataSource, Repository } from 'typeorm';
import { Account } from '../accounts/account.entity.js';
import { Transaction } from './transaction.entity.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionType } from './transaction.enum.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './transaction.dto.js';

describe('TransactionsService (TDD)', () => {
  let service: TransactionsService;
  let accountRepositoryMock: Partial<Repository<Account>>;
  let transactionRepositoryMock: Partial<Repository<Transaction>>;
  const userId = 'test-user-1';

  let mockFindOne: any;
  let mockSave: any;
  let mockTransaction: any;

  beforeEach(async () => {
    accountRepositoryMock = {};
    transactionRepositoryMock = {};

    mockFindOne = vi.fn();
    mockSave = vi.fn();

    mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockManager = {
          findOne: mockFindOne,
          create: vi.fn((_entityClass, entity) => entity),
          save: mockSave,
        };
        return callback(mockManager)
      });

    const dataSourceMock = {
      transaction: mockTransaction,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: DataSource, useValue: dataSourceMock },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepositoryMock },
        { provide: getRepositoryToken(Account), useValue: accountRepositoryMock },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    vi.clearAllMocks();
  });

  it('create transaction with zero or negative amount must throw error', async () => {
    const dto: CreateTransactionDto = {
      sourceAccountId: 1,
      type: TransactionType.EXPENSE,
      amount: 0
    };
    const mockAccount = { id: 1, userId, balance: 50000 };

    mockFindOne.mockResolvedValueOnce(mockAccount);

    await expect(service.create(userId, dto)).rejects.toThrow(
      new BadRequestException('Amount must be greater than 0'),
    );
  });

  it('create transaction with other user must throw error', async () => {
    const dto: CreateTransactionDto = {
      sourceAccountId: 1,
      type: TransactionType.EXPENSE,
      amount: 10000
    };
    mockFindOne.mockResolvedValueOnce(null);
    await expect(service.create(userId, dto)).rejects.toThrow(
      new NotFoundException('Source Account not found'),
    );
  });

  it('create transaction with destination account (other user) must throw error', async () => {
    const dto: CreateTransactionDto = {
      destinationAccountId: 1,
      type: TransactionType.INCOME,
      amount: 10000
    };
    mockFindOne.mockResolvedValueOnce(null);
    await expect(service.create(userId, dto)).rejects.toThrow(
      new NotFoundException('Destination Account not found'),
    );
  });

  it('create transaction with destinationAccount but not found must throw error', async () => {
    const dto: CreateTransactionDto = {
      sourceAccountId: 1,
      destinationAccountId: 2,
      type: TransactionType.TRANSFER,
      amount: 10000
    };
    const mockAccount = { id: 1, userId, balance: 50000 };
    mockFindOne.mockResolvedValueOnce(mockAccount);
    mockFindOne.mockResolvedValueOnce(null);

    await expect(service.create(userId, dto)).rejects.toThrow(
      new NotFoundException('Destination Account not found'),
    );
  })

  it('transfer to same account must throw error', async () => {
    const mockAccount = { id: 1, userId, balance: 50000 };
    mockFindOne.mockResolvedValueOnce(mockAccount);
    const dto: CreateTransactionDto = {
      sourceAccountId: 1,
      destinationAccountId: 1,
      type: TransactionType.TRANSFER,
      amount: 50000,
    };

    await expect(service.create(userId, dto)).rejects.toThrow(
      new BadRequestException('Source and destination account can not be same'),
    );
  });

  it('Insufficient balance must throw error', async () => {
    const dto: CreateTransactionDto = {
      sourceAccountId: 1,
      type: TransactionType.EXPENSE,
      amount: 200000
    };
    const mockAccount = { id: 1, userId, balance: 50000 };

    mockFindOne.mockResolvedValueOnce(mockAccount);

    await expect(service.create(userId, dto)).rejects.toThrow(
      new BadRequestException('Insufficient balance'),
    );
  });

  it('transfer internal account must debit source and credit destination', async () => {
    const dto: CreateTransactionDto = {
      sourceAccountId: 1,
      destinationAccountId: 2,
      type: TransactionType.TRANSFER,
      amount: 20000,
    };
    const mockSourceAccount = { id: 1, userId, balance: 100000 };
    const mockDestAccount = { id: 2, userId, balance: 50000 };

    mockFindOne.mockImplementation(async (entityClass: any, options: any) => {
      const searchId = options?.where?.id;
      if (searchId === 1) return mockSourceAccount;
      if (searchId === 2) return mockDestAccount;
      return null;
    })

    const savedEntities: any[] = [];
    mockSave.mockImplementation(async (entity: any) => {
      savedEntities.push(entity);
      return entity;
    });
    await service.create(userId, dto);


    const savedSource = savedEntities.find((ent) => ent.id === 1);
    const savedDest = savedEntities.find((ent) => ent.id === 2);

    expect(savedSource).toBeDefined();
    expect(savedDest).toBeDefined();

    expect(savedSource.balance).toBe(80000);
    expect(savedDest.balance).toBe(70000);
  });

  it('create income transaction must update dest balance', async () => {
    const dto: CreateTransactionDto = {
      destinationAccountId: 1,
      type: TransactionType.INCOME,
      amount: 20000,
    };
    const mockAccount = { id: 1, userId, balance: 50000 };
    mockFindOne.mockResolvedValueOnce(mockAccount);

    const savedEntities: any[] = [];
    mockSave.mockImplementation(async (entity: any) => {
      savedEntities.push(entity);
      return entity;
    });

    await service.create(userId, dto);
    const savedDest = savedEntities.find((ent) => ent.id === 1);
    expect(savedDest).toBeDefined();
    expect(savedDest.balance).toBe(70000);
  });

  it('create expense transaction must update source balance', async () => {
    const dto: CreateTransactionDto = {
      sourceAccountId: 1,
      type: TransactionType.EXPENSE,
      amount: 20000,
    };
    const mockAccount = { id: 1, userId, balance: 50000 };
    mockFindOne.mockResolvedValueOnce(mockAccount);

    const savedEntities: any[] = [];
    mockSave.mockImplementation(async (entity: any) => {
      savedEntities.push(entity);
      return entity;
    });

    await service.create(userId, dto);
    const savedSource = savedEntities.find((ent) => ent.id === 1);
    expect(savedSource).toBeDefined();
    expect(savedSource.balance).toBe(30000);
    expect(mockFindOne).toHaveBeenCalledWith(Account, expect.objectContaining({
      lock: { mode: 'pessimistic_write', onLocked: 'nowait' },
    }));
  });

  it('retries the whole transaction when acquiring a row lock fails', async () => {
    const dto: CreateTransactionDto = {
      sourceAccountId: 1,
      type: TransactionType.EXPENSE,
      amount: 20000,
    };
    const mockAccount = { id: 1, userId, balance: 50000 };

    mockFindOne
      .mockRejectedValueOnce({ code: '55P03' })
      .mockResolvedValueOnce(mockAccount);
    mockSave.mockImplementation(async (entity: any) => entity);

    await expect(service.create(userId, dto)).resolves.toBeDefined();
    expect(mockTransaction).toHaveBeenCalledTimes(2);
    expect(mockFindOne).toHaveBeenCalledTimes(2);
  });

  it('aggregates dashboard totals and daily values for the requested user and month', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      addGroupBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([
        { month: '2026-05', day: 3, type: TransactionType.EXPENSE, total: '50.00' },
        { month: '2026-06', day: 1, type: TransactionType.INCOME, total: '100.00' },
        { month: '2026-06', day: 2, type: TransactionType.EXPENSE, total: '25.00' },
      ]),
    };
    transactionRepositoryMock.createQueryBuilder = vi.fn().mockReturnValue(queryBuilder) as any;

    const result = await service.getDashboardMonth(userId, '2026-06');

    expect(result.totals[TransactionType.INCOME]).toBe(100);
    expect(result.totals[TransactionType.EXPENSE]).toBe(25);
    expect(result.previousTotals[TransactionType.EXPENSE]).toBe(50);
    expect(result.daily[TransactionType.INCOME][0]).toBe(100);
    expect(result.daily[TransactionType.EXPENSE][1]).toBe(25);
    expect(result.daysInMonth).toBe(30);
    expect(queryBuilder.where).toHaveBeenCalledWith('transaction.userId = :userId', { userId });
  });
});
