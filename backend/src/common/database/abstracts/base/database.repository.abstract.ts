import { UpdateQuery, UpdateWithAggregationPipeline } from 'mongoose';
import {
    IDatabaseCreateOptions,
    IDatabaseExistOptions,
    IDatabaseFindAllOptions,
    IDatabaseFindOneOptions,
    IDatabaseCreateManyOptions,
    IDatabaseManyOptions,
    IDatabaseSoftDeleteManyOptions,
    IDatabaseRestoreManyOptions,
    IDatabaseRawOptions,
    IDatabaseGetTotalOptions,
    IDatabaseSaveOptions,
    IDatabaseFindOneLockOptions,
    IDatabaseRawFindAllOptions,
    IDatabaseRawGetTotalOptions,
    IDatabaseJoin,
} from 'src/common/database/interfaces/database.interface';

export abstract class DatabaseRepositoryAbstract<Entity = unknown> {
    abstract findAll(
        find?: Record<string, unknown>,
        options?: IDatabaseFindAllOptions
    ): Promise<Entity[]>;

    abstract findAllDistinct(
        fieldDistinct: string,
        find?: Record<string, unknown>,
        options?: IDatabaseFindAllOptions
    ): Promise<Entity[]>;

    abstract findOne(
        find: Record<string, unknown>,
        options?: IDatabaseFindOneOptions
    ): Promise<Entity>;

    abstract findOneById(
        _id: string,
        options?: IDatabaseFindOneOptions
    ): Promise<Entity>;

    abstract findOneAndLock(
        find: Record<string, unknown>,
        options?: IDatabaseFindOneLockOptions
    ): Promise<Entity>;

    abstract findOneByIdAndLock(
        _id: string,
        options?: IDatabaseFindOneLockOptions
    ): Promise<Entity>;

    abstract getTotal(
        find?: Record<string, unknown>,
        options?: IDatabaseGetTotalOptions
    ): Promise<number>;

    abstract exists(
        find: Record<string, unknown>,
        options?: IDatabaseExistOptions
    ): Promise<boolean>;

    abstract create<Dto>(
        data: Dto,
        options?: IDatabaseCreateOptions
    ): Promise<Entity>;

    abstract save(
        repository: Entity,
        options?: IDatabaseSaveOptions
    ): Promise<Entity>;

    abstract delete(
        repository: Entity,
        options?: IDatabaseSaveOptions
    ): Promise<Entity>;

    abstract softDelete(
        repository: Entity,
        options?: IDatabaseSaveOptions
    ): Promise<Entity>;

    abstract restore(
        repository: Entity,
        options?: IDatabaseSaveOptions
    ): Promise<Entity>;

    abstract createMany<Dto>(
        data: Dto[],
        options?: IDatabaseCreateManyOptions
    ): Promise<boolean>;

    abstract deleteManyByIds(
        _id: string[],
        options?: IDatabaseManyOptions
    ): Promise<boolean>;

    abstract deleteMany(
        find: Record<string, unknown>,
        options?: IDatabaseManyOptions
    ): Promise<boolean>;

    abstract softDeleteManyByIds(
        _id: string[],
        options?: IDatabaseSoftDeleteManyOptions
    ): Promise<boolean>;

    abstract softDeleteMany(
        find: Record<string, unknown>,
        options?: IDatabaseSoftDeleteManyOptions
    ): Promise<boolean>;

    abstract restoreManyByIds(
        _id: string[],
        options?: IDatabaseRestoreManyOptions
    ): Promise<boolean>;

    abstract restoreMany(
        find: Record<string, unknown>,
        options?: IDatabaseRestoreManyOptions
    ): Promise<boolean>;

    abstract updateMany<Dto>(
        find: Record<string, unknown>,
        data: Dto,
        options?: IDatabaseManyOptions
    ): Promise<boolean>;

    abstract join<T = unknown>(
        repository: Entity,
        joins: IDatabaseJoin | IDatabaseJoin[]
    ): Promise<T>;

    abstract updateManyRaw(
        find: Record<string, unknown>,
        data: UpdateWithAggregationPipeline | UpdateQuery<unknown>,
        options?: IDatabaseManyOptions
    ): Promise<boolean>;

    abstract raw<RawResponse, RawQuery = unknown>(
        rawOperation: RawQuery,
        options?: IDatabaseRawOptions
    ): Promise<RawResponse[]>;

    abstract rawFindAll<RawResponse, RawQuery = unknown>(
        rawOperation: RawQuery,
        options?: IDatabaseRawFindAllOptions
    ): Promise<RawResponse[]>;

    abstract rawGetTotal<RawQuery = unknown>(
        rawOperation: RawQuery,
        options?: IDatabaseRawGetTotalOptions
    ): Promise<number>;

    abstract model(): Promise<unknown>;
}
