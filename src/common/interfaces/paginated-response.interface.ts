export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    totalItems: number;
    pageCount: number;
}