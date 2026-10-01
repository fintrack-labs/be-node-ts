import { CategoryType } from "@common/appConstants.js";
import { PaginationQueryDto } from "@common/dto/pagination-query.dto.js";
import { IsOptional, IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class CategoryDto {
    @IsOptional()
    @IsEnum(CategoryType)
    type: CategoryType;

    @IsOptional()
    @IsString()
    parentId: number | null;

    @IsNotEmpty()
    @IsString()
    name: string;

}

export class CategorySearchDto extends PaginationQueryDto {
    @IsOptional()
    @IsEnum(CategoryType)
    type: CategoryType;

    @IsOptional()
    @IsString()
    parentId: number | null;

    @IsString()
    @IsOptional()
    name: string;

}