import { CategoryType } from "@common/appConstants.js";
import { BaseEntity } from "@common/entities/base.entity.js";
import { AfterLoad, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity('categories')
export class Category extends BaseEntity<number> {
    @Column({ name: 'user_id', type: 'varchar', length: 50, nullable: true })
    userId: string | null;

    @Column({ name: 'name', type: 'varchar', length: 100 })
    name: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: CategoryType.EXPENSE,
    })
    type: CategoryType;

    @Column({ name: 'parent_id', type: 'bigint', nullable: true })
    parentId: number | null;
    @ManyToOne(() => Category, (category) => category.children, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'parent_id' })
    parent: Category;

    @OneToMany(() => Category, (category) => category.parent)
    children: Category[];


    @AfterLoad()
    convertCategoryFieldsToNumber() {
        if (this.parentId !== null && this.parentId !== undefined) {
            this.parentId = parseInt(this.parentId as unknown as string, 10);
        }
    }
}
