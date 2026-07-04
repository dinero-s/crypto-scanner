import { Request } from 'express';
import { ResponsePagingMetadataPaginationDto } from 'src/common/response/dtos/response.paging.dto';

export interface IRequestApp<
    T = Record<string, unknown>,
    N = Record<string, unknown>,
    B = Record<string, unknown>,
> extends Request {
    apiKey?: B;
    user?: T;
    __user?: N;

    __language: string;
    __version: string;

    __pagination?: ResponsePagingMetadataPaginationDto;
}
