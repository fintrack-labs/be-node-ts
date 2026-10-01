import { Transform, Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class PaginationQueryDto {
    @IsOptional()
    @IsString()
    search?: string = "";

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'id';

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;

    get skip(): number {
        return ((this.page || 1) - 1) * (this.limit || 10);
    }

}