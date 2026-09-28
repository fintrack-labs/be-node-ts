import { ValueTransformer } from "typeorm";

export class NumericTransformer implements ValueTransformer {
    to(data: number): number {
        return data;
    }
    from(data: string | null | undefined): number {
        if (data === null || data === undefined) {
            return 0;
        }
        const parsed = parseFloat(data);
        return isNaN(parsed) ? 0 : parsed;
    }
}