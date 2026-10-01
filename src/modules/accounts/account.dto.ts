import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { AccountType, CurrencyType } from "@common/appConstants.js";
import { PaginationQueryDto } from "@common/dto/pagination-query.dto.js";
import { Expose, Transform } from "class-transformer";

export class AccountGetRequestDto extends PaginationQueryDto {
    @Transform(({ value }) => (value === '' || value === 'null' ? null : value))
    @IsOptional()
    @IsEnum(AccountType)
    type?: AccountType | "";

    @Transform(({ value }) => (value === '' || value === 'null' ? null : value))
    @IsOptional()
    @IsEnum(CurrencyType)
    currency?: CurrencyType | null;
}

export class AccountRequestDto {
    // @IsNotEmpty()
    // @IsNumber()
    // id: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEnum(AccountType)
    type: AccountType;

    @IsNotEmpty()
    @IsNumber()
    balance: number;

    @IsString()
    accountNumber: string;

    @IsNotEmpty()
    @IsEnum(CurrencyType)
    currency: CurrencyType;
}

export class AccountResponseDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    type: AccountType;

    @Expose()
    balance: number;

    @Expose()
    accountNumber: string | null;

    @Expose()
    currency: CurrencyType;
}