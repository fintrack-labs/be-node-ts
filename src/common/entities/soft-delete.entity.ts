import { DeleteDateColumn, Column } from 'typeorm';
import { AuditEntity } from './audit.entity.js';

export abstract class SoftDeleteEntity extends AuditEntity {
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt: Date | null;

    @Column({ name: 'deleted_by', type: 'varchar', length: 50, nullable: true })
    deletedBy: string | null;
}