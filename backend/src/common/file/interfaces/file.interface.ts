export type IFile = Express.Multer.File;

export interface IFileRows<T = unknown> {
    data: T[];
    sheetName?: string;
}

export interface IFileReadOptions {
    password?: string;
}

export interface IFileUploadSingle {
    field: string;
    fileSize: number;
}

export interface IFileUploadMultiple extends IFileUploadSingle {
    maxFiles: number;
}

export type IFileUploadMultipleField =
    Omit<IFileUploadMultiple, 'fileSize'>;

export type IFileUploadMultipleFieldOptions =
    Pick<IFileUploadSingle, 'fileSize'>;
