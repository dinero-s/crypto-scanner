import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/** Пути запросов иконок от браузера — отвечаем 204 без передачи в роуты */
const ICON_PATHS = new Set([
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
]);

@Injectable()
export class FaviconMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        if (ICON_PATHS.has(req.path)) {
            res.status(HttpStatus.NO_CONTENT).end();
            return;
        }
        next();
    }
}
