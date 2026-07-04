import {
    IFileReadOptions,
    IFileRows,
} from 'src/common/file/interfaces/file.interface';

export interface IFileService {
    writeCsv<T = unknown>(rows: IFileRows<T>): Buffer;
    writeCsvFromArray<T = unknown>(rows: T[][]): Buffer;
    writeExcel<T = unknown>(
        rows: IFileRows<T>[],
        options?: IFileReadOptions
    ): Buffer;
    writeExcelFromArray<T = unknown>(
        rows: T[][],
        options?: IFileReadOptions
    ): Buffer;
    readCsv(file: Buffer): IFileRows;
    readExcel(file: Buffer, options?: IFileReadOptions): IFileRows[];
}
