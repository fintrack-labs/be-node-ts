import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity.js';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface.js';
import { plainToInstance } from 'class-transformer';
import { AccountGetRequestDto, AccountRequestDto, AccountResponseDto } from './account.dto.js';

@Injectable()
export class AccountsService {
    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
    ) { }

    async findByUserId(userId: string, queryDto: AccountGetRequestDto): Promise<PaginatedResponse<AccountResponseDto>> {
        const { search, page = 1, limit = 10, sortBy = 'id', sortOrder = 'DESC', skip } = queryDto;
        const queryBuilder = this.accountRepository
            .createQueryBuilder('account')
            .where("account.userId = :userId", { userId });

        if (queryDto.type) {
            queryBuilder.andWhere("account.type = :type", { type: queryDto.type });
        }
        if (queryDto.currency) {
            queryBuilder.andWhere("account.currency = :currency", { currency: queryDto.currency });
        }
        if (search) {
            queryBuilder.andWhere('account.name ILIKE :search', {
                search: `%${search}%`,
            });
        }

        if (sortBy && sortOrder) {
            queryBuilder.orderBy(`account.${sortBy}`, sortOrder);
        }

        queryBuilder.skip(skip).take(limit);

        const [accounts, totalItems] = await queryBuilder.getManyAndCount();
        const data = plainToInstance(AccountResponseDto, accounts, {
            excludeExtraneousValues: true,
        });

        return {
            data,
            page,
            limit,
            totalItems,
            pageCount: Math.ceil(totalItems / limit),
        };
    }

    async findById(userId: string, id: number): Promise<AccountResponseDto> {
        const account = await this.get(userId, id);
        return plainToInstance(AccountResponseDto, account, {
            excludeExtraneousValues: true
        });
    }

    async create(userId: string, dto: AccountRequestDto): Promise<AccountResponseDto> {
        const account = this.accountRepository.create({
            ...dto,
            userId,
        });
        const saved = await this.accountRepository.save(account);
        return plainToInstance(AccountResponseDto, saved, {
            excludeExtraneousValues: true
        });
    }

    async update(userId: string, id: number, dto: AccountRequestDto): Promise<AccountResponseDto> {
        const account = await this.findById(userId, id);
        const updateData = Object.fromEntries(
            Object.entries({
                name: dto.name,
                type: dto.type,
                currency: dto.currency
            }).filter(([key, value]) => value !== undefined && value !== null)
        )
        await this.accountRepository.update(id, updateData);
        return this.findById(userId, id);
    }

    private async get(userId: string, id: number) {
        const queryBuilder = this.accountRepository
            .createQueryBuilder('account')
            .andWhere('account.id = :id', { id })
            .andWhere('account.userId = :userId', { userId });

        const account = await queryBuilder.getOne();
        if (!account) {
            throw new NotFoundException(`Account not found with id ${id}`);
        }
        return plainToInstance(AccountResponseDto, account, {
            excludeExtraneousValues: true
        });
    }

    async delete(userId: string, id: number): Promise<void> {
        const account = await this.get(userId, id);
        await this.accountRepository.softRemove(account);
    }
}
