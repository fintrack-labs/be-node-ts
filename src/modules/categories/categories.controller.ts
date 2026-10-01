import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from "@nestjs/common";
import { CategoriesService } from "./categories.service.js";
import { CategoryDto, CategorySearchDto } from "./dto/category.dto.js";
import { AuthGuard } from "@modules/auth/guards/auth/auth.guard.js";
import { CurrentUser } from "@common/decorators/current-user.decorator.js";
import { type UserPojo } from "@common/interfaces/user.interface.js";
import { CategoryResponseDto } from "./dto/category.response.dto.js";
import { PaginatedResponse } from "@common/interfaces/paginated-response.interface.js";

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    async findAll(
        @CurrentUser() user: UserPojo,
        @Query() query: CategorySearchDto,
    ): Promise<PaginatedResponse<CategoryResponseDto>> {
        return this.categoriesService.findAll(user.userId, query);
    }

    @Post()
    async create(
        @CurrentUser() user: UserPojo,
        @Body() dto: CategoryDto,
    ): Promise<CategoryResponseDto> {
        return this.categoriesService.create(user.userId, dto);
    }

    @Get(':id')
    async getOne(
        @CurrentUser() user: UserPojo,
        @Param('id') id: number,
    ): Promise<CategoryResponseDto> {
        return this.categoriesService.findById(user.userId, id);
    }

    @Put(':id')
    async update(
        @CurrentUser() user: UserPojo,
        @Param('id') id: number,
        @Body() dto: CategoryDto,
    ): Promise<CategoryResponseDto> {
        return this.categoriesService.update(user.userId, id, dto);
    }

    @Delete(':id')
    async delete(
        @CurrentUser() user: UserPojo,
        @Param('id') id: number,
    ): Promise<void> {
        return this.categoriesService.delete(user.userId, id);
    }
}