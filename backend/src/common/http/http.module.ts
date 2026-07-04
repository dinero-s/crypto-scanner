import { HttpModule, HttpService } from "@nestjs/axios";
import { Global, Inject, Logger, Module } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Global()
@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,


        })
    ],
    exports: [HttpModule],
})
export class GlobalHttpModule {
    constructor(private readonly httpService: HttpService, @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger) { }

    onModuleInit() {
        this.httpService.axiosRef.interceptors.request.use((request) => {
            const method = typeof request.method === "string" ? request.method.toUpperCase() : "UNKNOWN";
            const path = this.extractPath(request.url);
            const mediaKey = this.extractMediaKey(request.data);
            const mediaKeyPart = mediaKey ? ` mediaKey=${mediaKey}` : "";
            this.logger.log(`HTTP ${method} ${path}${mediaKeyPart}`);
            return request;
        }, (error) => {
            this.logger.error(`Request error: ${error.message}`);
            return Promise.reject(error);
        });
        this.httpService.axiosRef.interceptors.response.use((response) => {
            const message = this.extractShortMessage(response.data);
            const path = this.extractPath(response.config.url);
            this.logger.log(`HTTP ${response.status} ${path} ${message}`);
            return response;
        }, (error) => {
            this.logger.error(`Response error: ${error.message}`);
            return Promise.reject(error);
        });
    }

    private extractMediaKey(value: unknown): string | null {
        if (!this.isObject(value)) {
            return null;
        }

        if (typeof value.mediaKey === "string" && value.mediaKey.length > 0) {
            return value.mediaKey;
        }

        return null;
    }

    private extractShortMessage(value: unknown): string {
        if (!this.isObject(value)) {
            return "ok";
        }

        if (typeof value.message === "string" && value.message.length > 0) {
            return value.message;
        }

        if (typeof value.duration === "string" && value.duration.length > 0) {
            return `processed ${value.duration}`;
        }

        if (typeof value.thumbnailKey === "string" && value.thumbnailKey.length > 0) {
            return "processed";
        }

        return "ok";
    }

    private extractPath(url: string | undefined): string {
        if (typeof url !== "string" || url.length === 0) {
            return "/";
        }

        try {
            if (url.startsWith("http://") || url.startsWith("https://")) {
                const parsedUrl = new URL(url);
                return parsedUrl.pathname;
            }

            return url;
        } catch {
            return url;
        }
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        if (value === null || value === undefined) {
            return false;
        }

        return typeof value === "object";
    }
}
