import { AccountType, CurrencyType } from "@common/appConstants.js";
import { NumericTransformer } from "@common/dto/numeric-transformer.js";
import { BaseEntity } from "@common/entities/base.entity.js";
import { Column, Entity, VersionColumn } from "typeorm";

@Entity({ name: "accounts" })
export class Account extends BaseEntity {
    @Column({ name: 'user_id', type: 'varchar', length: 50, nullable: true })
    userId: string | null;

    @Column({ name: 'name', type: 'varchar', length: 100 })
    name: string;

    @Column({ name: 'type', type: 'varchar', length: 20 })
    type: AccountType;

    @Column({ name: 'balance', type: 'decimal', precision: 15, scale: 2, transformer: new NumericTransformer() })
    balance: number;

    @Column({ name: 'account_number', type: 'varchar', length: 50, nullable: true })
    accountNumber: string | null;

    @Column({ name: 'currency', type: 'varchar', length: 3 })
    currency: CurrencyType;

    @VersionColumn()
    version: number;
}