import {
    PipeTransform,
    Injectable,
    UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ENUM_FILE_MIME } from 'src/common/file/constants/file.enum.constant';
import { ENUM_FILE_STATUS_CODE_ERROR } from 'src/common/file/constants/file.status-code.constant';
import { IFile } from 'src/common/file/interfaces/file.interface';

@Injectable()
export class FileTypePipe implements PipeTransform {
    constructor(
        readonly type: ENUM_FILE_MIME[],
        readonly field?: string
    ) {}

    async transform(value: unknown): Promise<IFile | IFile[]> {
        if (!value) {
            return value as IFile | IFile[];
        }

        const valueObj = value as Record<string, IFile | IFile[]>;
        const fieldValue: IFile | IFile[] = this.field
            ? valueObj[this.field]
            : (value as IFile | IFile[]);

        if (
            !fieldValue ||
            (typeof fieldValue === 'object' &&
                !Array.isArray(fieldValue) &&
                Object.keys(fieldValue).length === 0) ||
            (Array.isArray(fieldValue) && fieldValue.length === 0)
        ) {
            return value as IFile | IFile[];
        }

        if (Array.isArray(fieldValue)) {
            for (const val of fieldValue) {
                await this.validate(val.mimetype);
            }

            return value as IFile | IFile[];
        }

        const file: IFile = fieldValue as IFile;
        await this.validate(file.mimetype);

        return value as IFile | IFile[];
    }

    async validate(mimetype: string): Promise<void> {
        if (!this.type.find(val => val === mimetype.toLowerCase())) {
            throw new UnsupportedMediaTypeException({
                statusCode: ENUM_FILE_STATUS_CODE_ERROR.MIME_ERROR,
                message: 'file.error.mimeInvalid',
            });
        }

        return;
    }
}
