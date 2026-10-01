import { AfterLoad, PrimaryGeneratedColumn, ValueTransformer } from "typeorm";
import { SoftDeleteEntity } from "./soft-delete.entity.js";
import { AfterInsert } from "typeorm/browser";

export const bigintToNumberTransformer: ValueTransformer = {
    to: (value: number | null): number | null => value,
    from: (value: string | null): number | null => {
        if (value === null || value === undefined) return null;
        return parseInt(value, 10);
    },
};

export abstract class BaseEntity<T = number> extends SoftDeleteEntity {
    @PrimaryGeneratedColumn('identity', {
        type: 'bigint',
    })
    id: T;

    @AfterLoad()
    convertIdsToNumber() {
        if (this.id !== null && this.id !== undefined) {
            this.id = parseInt(this.id as unknown as string, 10) as unknown as T;
        }
    }

    @AfterInsert()
    convertIdToNumber() {
        if (this.id && typeof this.id === 'string') {
            this.id = parseInt(this.id as unknown as string, 10) as unknown as T;
        }
    }
}