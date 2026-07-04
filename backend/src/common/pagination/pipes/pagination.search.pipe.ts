import { Inject, Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { REQUEST } from '@nestjs/core';
import { PaginationService } from 'src/common/pagination/services/pagination.service';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';

export function PaginationSearchPipe(
    availableSearch: string[] = []
): Type<PipeTransform> {
    @Injectable({ scope: Scope.REQUEST })
    class MixinPaginationSearchPipe implements PipeTransform {
        constructor(
            @Inject(REQUEST) protected readonly request: IRequestApp,
            private readonly paginationService: PaginationService
        ) { }

        async transform(
            value: Record<string, unknown>
        ): Promise<Record<string, unknown>> {

            const searchStr = String(value?.search ?? '');
            if (availableSearch.length === 0 || !searchStr) {
                this.addToRequestInstance(searchStr, availableSearch);
                return { ...value };
            }

            const search: Record<string, unknown> = this.paginationService.search(
                searchStr,
                availableSearch
            );

            this.addToRequestInstance(searchStr, availableSearch);
            return {
                ...value,
                _search: search,
                _availableSearch: availableSearch,

            };
        }

        addToRequestInstance(search: string, availableSearch: string[]): void {
            this.request.__pagination = {
                ...this.request.__pagination,
                search,
                availableSearch,

            };
        }
    }

    return mixin(MixinPaginationSearchPipe);
}
