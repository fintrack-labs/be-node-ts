import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from "@nestjs/common";
import { AccountsService } from './accounts.service.js';
import { AuthGuard } from "@modules/auth/guards/auth/auth.guard.js";
import { CurrentUser } from "@common/decorators/current-user.decorator.js";
import { type UserPojo } from "@common/interfaces/user.interface.js";
import { PaginatedResponse } from "@common/interfaces/paginated-response.interface.js";
import { AccountGetRequestDto, AccountRequestDto, AccountResponseDto } from "./account.dto.js";

@Controller('accounts')
@UseGuards(AuthGuard)
export class AccountsController {

    constructor(private readonly accountService: AccountsService) { }

    @Get()
    async findAll(
        @CurrentUser() user: UserPojo,
        @Query() query: AccountGetRequestDto,
    ): Promise<PaginatedResponse<AccountResponseDto>> {
        return this.accountService.findByUserId(user.userId, query);
    }

    @Get(':id')
    async getOne(
        @CurrentUser() user: UserPojo,
        @Param('id') id: number,
    ): Promise<AccountResponseDto> {
        return this.accountService.findById(user.userId, id);
    }

    @Post()
    async create(
        @CurrentUser() user: UserPojo,
        @Body() dto: AccountRequestDto,
    ): Promise<AccountResponseDto> {
        return this.accountService.create(user.userId, dto);
    }

    @Put(':id')
    async update(
        @CurrentUser() user: UserPojo,
        @Param('id') id: number,
        @Body() dto: AccountRequestDto,
    ): Promise<AccountResponseDto> {
        return this.accountService.update(user.userId, id, dto);
    }

    @Delete(':id')
    async delete(
        @CurrentUser() user: UserPojo,
        @Param('id') id: number,
    ): Promise<void> {
        return this.accountService.delete(user.userId, id);
    }
}
