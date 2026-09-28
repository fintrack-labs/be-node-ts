import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsBoolean, IsDateString, ValidateIf, IsNotEmpty } from 'class-validator';
import { PaymentMethod, TransactionType } from './transaction.enum.js';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto.js';
import { Expose, Transform } from 'class-transformer';

export class CreateTransactionDto {
    @IsOptional()
    @IsNumber()
    sourceAccountId?: number | null;

    @ValidateIf((o) => o.type === TransactionType.TRANSFER || o.type === TransactionType.INCOME)
    @IsNotEmpty({ message: 'destination Account Id required with type TRANSFER' })
    @IsNumber()
    destinationAccountId?: number | null;

    @IsOptional()
    @IsNumber()
    categoryId?: number | null;

    @IsNotEmpty()
    @IsEnum(TransactionType)
    type: TransactionType;

    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @IsNotEmpty()
    @IsNumber()
    @IsPositive({ message: 'Amount should be greater than 0' })
    amount: number;

    @IsOptional()
    @IsString()
    merchantName?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    receiptImageUrl?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;
}

export class TransactionResponseDto {
    constructor(partial: Partial<TransactionResponseDto>) {
        Object.assign(this, partial);
    }
    @Expose()
    id: number;
    @Expose()
    @Transform(({ obj }) => obj.accountId ?? null)
    sourceAccountId?: number | null;
    @Expose()
    destinationAccountId?: number | null;
    @Expose()
    categoryId?: number | null;
    @Expose()
    type: TransactionType;
    @Expose()
    paymentMethod?: PaymentMethod;
    @Expose()
    amount: number;
    @Expose()
    merchantName?: string;
    @Expose()
    description?: string;
    @Expose()
    receiptImageUrl?: string;
    @Expose()
    note?: string;
    @Expose()
    isRecurring?: boolean;
    @Expose()
    transactionDate: Date;
}

export class TransactionGetDto extends PaginationQueryDto {
    @Transform(({ value }) => (value === '' || value === 'null' ? null : value))
    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType | '';

    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @IsOptional()
    @IsNumber()
    categoryId?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    merchantName?: string;

    @IsOptional()
    @IsDateString()
    transactionDate?: string;
}

export class AdjustBalanceDto {
    @IsNotEmpty()
    @IsNumber()
    accountId: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive({ message: 'Actual balance should be greater than 0' })
    @IsNotEmpty()
    actualBalance: number;

    @IsString()
    @IsOptional()
    reason?: string;
}