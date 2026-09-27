import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsBoolean, IsDateString, ValidateIf, IsNotEmpty } from 'class-validator';
import { PaymentMethod, TransactionType } from './transaction.enum.js';

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
    @IsDateString()
    transactionDate?: string;

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

}