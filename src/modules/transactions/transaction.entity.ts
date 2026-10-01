import { Column, Entity } from "typeorm";
import { BaseEntity } from "@common/entities/base.entity.js";
import { NumericTransformer } from "@common/entities/numeric-transformer.js";
import { PaymentMethod, TransactionType } from "./transaction.enum.js";
import { CreateTransactionDto } from "./transaction.dto.js";

@Entity('transactions')
export class Transaction extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'account_id', type: 'bigint', transformer: new NumericTransformer(), })
    accountId: number | null;

    @Column({ name: 'destination_account_id', type: 'bigint', nullable: true, transformer: new NumericTransformer() })
    destinationAccountId: number | null;

    @Column({ name: 'category_id', type: 'bigint', nullable: true })
    categoryId: number | null;

    @Column({ type: 'varchar', length: 20 })
    type: TransactionType;

    @Column({ name: 'payment_method', type: 'varchar', length: 20, default: PaymentMethod.CASH })
    paymentMethod: PaymentMethod;

    @Column('decimal', { precision: 15, scale: 2, transformer: new NumericTransformer() })
    amount: number;

    @Column({ name: 'transaction_date', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    transactionDate: Date;

    @Column({ type: 'varchar', name: 'merchant_name', length: 100, nullable: true })
    merchantName: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', name: 'receipt_image_url', length: 255, nullable: true })
    receiptImageUrl: string | null;

    @Column({ type: 'text', nullable: true })
    note: string | null;

    @Column({ name: 'is_recurring', default: false })
    isRecurring: boolean;

    static fromDto(dto: CreateTransactionDto, userId: string): Partial<Transaction> {
        const { sourceAccountId, destinationAccountId, ...rest } = dto;
        return {
            ...rest,
            accountId: sourceAccountId,
            userId,
        };
    }
}