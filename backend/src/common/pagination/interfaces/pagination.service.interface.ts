import { ENUM_PAGINATION_ORDER_DIRECTION_TYPE } from 'src/common/pagination/constants/pagination.enum.constant';
import { IPaginationOrder } from 'src/common/pagination/interfaces/pagination.interface';

export interface IPaginationService {
    offset(page: number, perPage: number): number;
    totalPage(totalData: number, perPage: number): number;
    page(page?: number): number;
    perPage(perPage?: number): number;
    order(
        orderByValue: string,
        orderDirectionValue: ENUM_PAGINATION_ORDER_DIRECTION_TYPE,
        availableOrderBy: string[]
    ): IPaginationOrder;
    search(searchValue: string, availableSearch: string[]): Record<string, unknown>;
    filterEqual<T = string>(field: string, filterValue: T): Record<string, T>;
    filterNotEqual<T = string>(
        field: string,
        filterValue: T
    ): Record<string, T>;
    filterContain(field: string, filterValue: string): Record<string, unknown>;
    filterContainFullMatch(
        field: string,
        filterValue: string
    ): Record<string, unknown>;
    filterIn<T = string>(field: string, filterValue: T[]): Record<string, unknown>;
    filterNin<T = string>(field: string, filterValue: T[]): Record<string, unknown>;
    filterDate(field: string, filterValue: Date): Record<string, Date>;
}
