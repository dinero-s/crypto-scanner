import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
    private readonly allowOrigins: string[];
    private readonly allowMethod: string[];
    private readonly allowHeader: string[];

    constructor(private readonly configService: ConfigService) {
        this.allowOrigins = this.configService.get<string[]>(
            'middleware.cors.allowOrigins',
        ) ?? ['http://localhost:5173', 'http://localhost:4001'];
        this.allowMethod = this.configService.get<string[]>(
            'middleware.cors.allowMethod',
        ) ?? ['GET', 'DELETE', 'PUT', 'PATCH', 'POST'];
        this.allowHeader = this.configService.get<string[]>(
            'middleware.cors.allowHeader',
        ) ?? [];
    }

    use(req: Request, res: Response, next: NextFunction): void {
        const corsOptions: CorsOptions = {
            origin: (origin, callback) => {
                if (!origin || this.allowOrigins.includes(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error('Not allowed by CORS'));
            },
            methods: this.allowMethod,
            allowedHeaders: this.allowHeader,
            preflightContinue: false,
            credentials: true,
            optionsSuccessStatus: HttpStatus.NO_CONTENT,
        };

        cors(corsOptions)(req, res, next);
    }
}
