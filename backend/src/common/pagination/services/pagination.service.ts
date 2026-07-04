import { Injectable } from '@nestjs/common';
import {
    DatabaseQueryContain,
    DatabaseQueryEqual,
    DatabaseQueryIn,
    DatabaseQueryNin,
    DatabaseQueryNotEqual,
    DatabaseQueryOr,
} from 'src/common/database/decorators/database.decorator';
import {
    PAGINATION_DEFAULT_AVAILABLE_ORDER_BY,
    PAGINATION_DEFAULT_MAX_PAGE,
    PAGINATION_DEFAULT_MAX_PER_PAGE,
    PAGINATION_DEFAULT_ORDER_BY,
    PAGINATION_DEFAULT_ORDER_DIRECTION,
    PAGINATION_DEFAULT_PAGE,
    PAGINATION_DEFAULT_PER_PAGE,
} from 'src/common/pagination/constants/pagination.constant';
import { IPaginationOrder } from 'src/common/pagination/interfaces/pagination.interface';
import { IPaginationService } from 'src/common/pagination/interfaces/pagination.service.interface';

/** Сервис для построения параметров пагинации и фильтрации */
@Injectable()
export class PaginationService implements IPaginationService {
    /** Считает offset по номеру страницы и размеру страницы с учетом лимитов */
    offset(page: number, perPage: number): number {
        page =
            page > PAGINATION_DEFAULT_MAX_PAGE
                ? PAGINATION_DEFAULT_MAX_PAGE
                : page;
        perPage =
            perPage > PAGINATION_DEFAULT_MAX_PER_PAGE
                ? PAGINATION_DEFAULT_MAX_PER_PAGE
                : perPage;
        const offset: number = (page - 1) * perPage;

        return offset;
    }

    /** Считает общее количество страниц с учетом максимума */
    totalPage(totalData: number, perPage: number): number {
        let totalPage = Math.ceil(totalData / perPage);
        totalPage = totalPage === 0 ? 1 : totalPage;
        return totalPage > PAGINATION_DEFAULT_MAX_PAGE
            ? PAGINATION_DEFAULT_MAX_PAGE
            : totalPage;
    }

    /** Нормализует номер страницы по умолчаниям и максимальным значениям */
    page(page?: number): number {
        return page
            ? page > PAGINATION_DEFAULT_MAX_PAGE
                ? PAGINATION_DEFAULT_MAX_PAGE
                : page
            : PAGINATION_DEFAULT_PAGE;
    }

    /** Нормализует размер страницы по умолчаниям и максимальным значениям */
    perPage(perPage?: number): number {
        return perPage
            ? perPage > PAGINATION_DEFAULT_MAX_PER_PAGE
                ? PAGINATION_DEFAULT_MAX_PER_PAGE
                : perPage
            : PAGINATION_DEFAULT_PER_PAGE;
    }

    /** Строит объект сортировки с учетом списка доступных полей */
    order(
        orderByValue = PAGINATION_DEFAULT_ORDER_BY,
        orderDirectionValue = PAGINATION_DEFAULT_ORDER_DIRECTION,
        availableOrderBy = PAGINATION_DEFAULT_AVAILABLE_ORDER_BY
    ): IPaginationOrder {
        const orderBy: string = availableOrderBy.includes(orderByValue)
            ? orderByValue
            : PAGINATION_DEFAULT_ORDER_BY;


        return { [orderBy]: orderDirectionValue };
    }

    /** Строит условие полнотекстового поиска по набору полей */
    search(
        searchValue: string,
        availableSearch: string[]
    ): Record<string, unknown> {
        if (
            searchValue === undefined ||
            searchValue === '' ||
            availableSearch.length === 0
        ) {
            return undefined;
        }

        return DatabaseQueryOr(
            availableSearch.map(val => DatabaseQueryContain(val, searchValue))
        );
    }

    /** Создает условие равенства по полю */
    filterEqual<T = string>(field: string, filterValue: T): Record<string, T> {
        return DatabaseQueryEqual<T>(field, filterValue) as Record<string, T>;
    }

    /** Создает условие неравенства по полю */
    filterNotEqual<T = string>(
        field: string,
        filterValue: T
    ): Record<string, T> {
        return DatabaseQueryNotEqual<T>(field, filterValue) as Record<string, T>;
    }

    /** Создает условие частичного вхождения строки */
    filterContain(field: string, filterValue: string): Record<string, unknown> {
        return DatabaseQueryContain(field, filterValue);
    }

    /** Создает условие полного совпадения слова */
    filterContainFullMatch(
        field: string,
        filterValue: string
    ): Record<string, unknown> {
        return DatabaseQueryContain(field, filterValue, { fullWord: true });
    }

    /** Строит условие IN по массиву значений */
    filterIn<T = string>(field: string, filterValue: T[]): Record<string, unknown> {
        return DatabaseQueryIn<T>(field, filterValue);
    }

    /** Строит условие NOT IN по массиву значений */
    filterNin<T = string>(
        field: string,
        filterValue: T[]
    ): Record<string, unknown> {
        return DatabaseQueryNin<T>(field, filterValue);
    }

    /** Строит условие равенства по дате */
    filterDate(field: string, filterValue: Date): Record<string, Date> {
        return DatabaseQueryEqual<Date>(field, filterValue) as Record<string, Date>;
    }
}
