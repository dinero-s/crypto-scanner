import { ClientSession, Document, Model } from 'mongoose';
import { IPaginationOrder } from 'src/common/pagination/interfaces/pagination.interface';

export interface IDatabaseQueryContainOptions {
    fullWord: boolean;
}

export interface IDatabaseJoin {
    field: string;
    localKey: string;
    foreignKey: string;
    model: string | Model<unknown>;
    condition?: Record<string, unknown>;
    justOne?: boolean;
    join?: this | this[];
}

export type IDatabaseDocument<T> = T & Document;

// find one
export interface IDatabaseFindOneOptions {
    select?: Record<string, boolean | number> | string;
    join?: boolean | IDatabaseJoin | IDatabaseJoin[];
    session?: ClientSession;
    withDeleted?: boolean;
}

// find one lock
export type IDatabaseFindOneLockOptions = IDatabaseFindOneOptions;

export type IDatabaseGetTotalOptions = Pick<
    IDatabaseFindOneOptions,
    'session' | 'withDeleted' | 'join'
>;

export type IDatabaseSaveOptions = Pick<
    IDatabaseFindOneOptions,
    'session'
>;

// find
export interface IDatabaseFindAllPaginationPagingOptions {
    limit: number;
    offset: number;
}
export interface IDatabaseFindAllPaginationOptions {
    paging?: IDatabaseFindAllPaginationPagingOptions;
    order?: IPaginationOrder;
    populate?: string | string[];
}

export interface IDatabaseFindAllOptions
    extends IDatabaseFindAllPaginationOptions,
    IDatabaseFindOneOptions { }

// create
export interface IDatabaseCreateOptions
    extends Pick<IDatabaseFindOneOptions, 'session'> {
    _id?: string;
}

// exist
export interface IDatabaseExistOptions
    extends Pick<
        IDatabaseFindOneOptions,
        'session' | 'withDeleted' | 'join'
    > {
    excludeId?: string[];
}

// bulk
export type IDatabaseManyOptions = Pick<
    IDatabaseFindOneOptions,
    'session' | 'join'
>;

export type IDatabaseCreateManyOptions = Pick<
    IDatabaseFindOneOptions,
    'session'
>;

export type IDatabaseSoftDeleteManyOptions = IDatabaseManyOptions;

export type IDatabaseRestoreManyOptions = IDatabaseManyOptions;

// Raw
export type IDatabaseRawOptions = Pick<
    IDatabaseFindOneOptions,
    'session' | 'withDeleted'
>;

export type IDatabaseRawFindAllOptions = Pick<
    IDatabaseFindAllOptions,
    'order' | 'paging' | 'session' | 'withDeleted'
>;

export type IDatabaseRawGetTotalOptions = Pick<
    IDatabaseRawFindAllOptions,
    'session' | 'withDeleted'
>;
