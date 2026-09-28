import { CategoryType } from "@common/appConstants.js";
import { Expose, Type } from "class-transformer";

export class CategoryResponseDto {
    @Expose()
    id: number;

    // @Expose()
    // userId: string | null;

    @Expose()
    name: string;

    @Expose()
    type: CategoryType;

    @Expose()
    parentId: string | null;

    @Expose()
    @Type(() => CategoryResponseDto)
    children?: CategoryResponseDto[];

    @Expose()
    createdAt: Date;
}