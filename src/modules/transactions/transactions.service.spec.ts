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

  beforeEach(async () => {
    accountRepositoryMock = {};
    transactionRepositoryMock = {};

    mockFindOne = vi.fn();
    mockSave = vi.fn();

    const dataSourceMock = {
      transaction: vi.fn().mockImplementation(async (callback) => {
        const mockManager = {
          findOne: mockFindOne,
          create: vi.fn(),
          save: mockSave,
        };
        return callback(mockManager)
      }),
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
  });
});
