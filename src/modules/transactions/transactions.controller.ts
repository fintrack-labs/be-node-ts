import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { AdjustBalanceDto, CreateTransactionDto, TransactionGetDto, TransactionResponseDto } from './transaction.dto.js';
import { CurrentUser } from '@common/decorators/current-user.decorator.js';
import { type UserPojo } from '@common/interfaces/user.interface.js';
import { AuthGuard } from '@modules/auth/guards/auth/auth.guard.js';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface.js';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
    constructor(
        private readonly transactionService: TransactionsService
    ) { }

    @Get('dashboard')
    async getDashboardMonth(
        @CurrentUser() user: UserPojo,
        @Query('month') month: string,
    ) {
        return this.transactionService.getDashboardMonth(user.userId, month);
    }

    @Get(':id')
    async get(
        @CurrentUser() user: UserPojo,
        @Param('id') id: number): Promise<TransactionResponseDto> {
        const data = await this.transactionService.getById(user.userId, id);
        return data;
    }

    @Get()
    async findAll(
        @CurrentUser() user: UserPojo,
        @Query() queryDto: TransactionGetDto): Promise<PaginatedResponse<TransactionResponseDto>> {
        return await this.transactionService.find(user.userId, queryDto);
    }

    @Post()
    async create(
        @CurrentUser() user: UserPojo,
        @Body() dto: CreateTransactionDto
    ): Promise<TransactionResponseDto> {
        return this.transactionService.create(user.userId, dto);
    }

    @Post('/adjustment')
    async adjustment(
        @CurrentUser() user: UserPojo,
        @Body() dto: AdjustBalanceDto
    ): Promise<TransactionResponseDto> {
        return this.transactionService.adjutmentBalance(user.userId, dto);
    }

}
