import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import {
    ENUM_APP_ENVIRONMENT,
    ENUM_APP_TIMEZONE,
} from 'src/app/constants/app.enum.constant';
import { ENUM_MESSAGE_LANGUAGE } from 'src/common/message/constants/message.enum.constant';

export class AppEnvDto {
    @IsString()
    @IsNotEmpty()
    APP_NAME: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(ENUM_APP_ENVIRONMENT)
    APP_ENV: ENUM_APP_ENVIRONMENT;

    @IsString()
    @IsNotEmpty()
    @IsEnum(ENUM_MESSAGE_LANGUAGE)
    APP_LANGUAGE: ENUM_MESSAGE_LANGUAGE;

    @IsString()
    @IsNotEmpty()
    @IsEnum(ENUM_APP_TIMEZONE)
    APP_TIMEZONE: ENUM_APP_TIMEZONE;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    APP_DEBUG: boolean;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    HTTP_ENABLE: boolean;

    @IsNotEmpty()
    @IsString()
    HTTP_HOST: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    HTTP_PORT: number;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    URL_VERSIONING_ENABLE: boolean;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    URL_VERSION: number;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    JOB_ENABLE: boolean;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    THROTTLE_ENABLE: boolean;

    @IsNotEmpty()
    @IsString()
    DATABASE_URI: string;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    DATABASE_DEBUG: boolean;

    @IsNotEmpty()
    @IsString()
    REDIS_HOST: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    REDIS_PORT: number;

    @IsOptional()
    @IsString()
    REDIS_PASSWORD?: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    REDIS_DB: number;

    @IsNotEmpty()
    @IsString()
    SERVER_URL: string;

    @IsNotEmpty()
    @IsString()
    SWAGGER_URL: string;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    DOC_ENABLE: boolean;

    @IsNotEmpty()
    @IsString()
    AUTH_JWT_SUBJECT: string;

    @IsNotEmpty()
    @IsString()
    AUTH_JWT_AUDIENCE: string;

    @IsNotEmpty()
    @IsString()
    AUTH_JWT_ISSUER: string;

    @IsNotEmpty()
    @IsString()
    AUTH_JWT_ACCESS_TOKEN_EXPIRED: string;

    @IsNotEmpty()
    @IsString()
    AUTH_JWT_ACCESS_TOKEN_SECRET_KEY: string;

    @IsNotEmpty()
    @IsString()
    AUTH_JWT_REFRESH_TOKEN_EXPIRED: string;

    @IsNotEmpty()
    @IsString()
    AUTH_JWT_REFRESH_TOKEN_SECRET_KEY: string;

    @IsNotEmpty()
    @IsString()
    TOKEN_SECRET_ADMIN: string;

    @IsNotEmpty()
    @IsString()
    TOKEN_SECRET_USER: string;

    @IsOptional()
    @IsString()
    AWS_S3_CREDENTIAL_KEY?: string;

    @IsOptional()
    @IsString()
    AWS_S3_CREDENTIAL_SECRET?: string;

    @IsOptional()
    @IsString()
    AWS_S3_REGION?: string;

    @IsOptional()
    @IsString()
    AWS_S3_BUCKET?: string;

    @IsOptional()
    @IsString()
    AWS_S3_ENDPOINT?: string;

    @IsOptional()
    @IsString()
    AWS_SES_CREDENTIAL_KEY?: string;

    @IsOptional()
    @IsString()
    AWS_SES_CREDENTIAL_SECRET?: string;

    @IsOptional()
    @IsString()
    AWS_SES_REGION?: string;

    @IsOptional()
    @IsString()
    MEDIA_STORAGE_DRIVER?: string;

    @IsOptional()
    @IsString()
    MEDIA_LOCAL_PATH?: string;

    @IsOptional()
    @IsString()
    AUTH_SOCIAL_GOOGLE_CLIENT_ID?: string;

    @IsOptional()
    @IsString()
    AUTH_SOCIAL_GOOGLE_CLIENT_SECRET?: string;

    @IsOptional()
    @IsString()
    AUTH_SOCIAL_GOOGLE_IOS_CLIENT_ID?: string;

    @IsOptional()
    @IsString()
    AUTH_SOCIAL_GOOGLE_ANDROID_CLIENT_ID?: string;

    @IsOptional()
    @IsString()
    AUTH_SOCIAL_APPLE_CLIENT_ID?: string;

    @IsOptional()
    @IsString()
    AUTH_SOCIAL_APPLE_SIGN_IN_CLIENT_ID?: string;

    @IsOptional()
    @IsString()
    SENTRY_DSN?: string;

    @IsOptional()
    @IsString()
    SMTP_HOST?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    SMTP_PORT?: number;

    @IsOptional()
    @IsString()
    SMTP_USER?: string;

    @IsOptional()
    @IsString()
    SMTP_PASSWORD?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    SMTP_SECURE?: boolean;

    @IsOptional()
    @IsString()
    SMTP_FROM_NAME?: string;

    @IsOptional()
    @IsString()
    SMTP_FROM_ADDRESS?: string;

    @IsOptional()
    @IsString()
    CORS_ALLOW_ORIGINS?: string;

    @IsOptional()
    @IsString()
    TELEGRAM_BOT_TOKEN?: string;

    @IsOptional()
    @IsString()
    TELEGRAM_MINI_APP_URL?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    TELEGRAM_ALERTS_ENABLED?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    SCANNER_JOBS_ENABLED?: boolean;

    @IsOptional()
    @IsString()
    SCANNER_DEFAULT_SYMBOLS?: string;
}
