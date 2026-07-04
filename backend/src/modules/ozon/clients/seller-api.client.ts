import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllowedOzonApiService } from '../compliance/allowed-ozon-api.service';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { OzonApiType } from '../constants/ozon.enums';
import {
    BaseOzonApiClient,
    OzonApiCredentials,
} from './base-ozon-api.client';
import { OzonApiRateLimiterService } from './ozon-api-rate-limiter.service';

export interface OzonSellerProductListItem {
    product_id: number;
    offer_id: string;
}

export interface OzonSellerProductListResponse {
    result: {
        items: OzonSellerProductListItem[];
        total: number;
        last_id: string;
    };
}

export interface OzonSellerProductInfoItem {
    id: number;
    name: string;
    offer_id: string;
    sku: number;
    price: string;
    old_price: string;
    marketing_price: string;
    stocks?: {
        coming: number;
        present: number;
        reserved: number;
    };
}

export interface OzonSellerProductInfoResponse {
    items: OzonSellerProductInfoItem[];
}

export interface OzonSellerStocksResponse {
    items: Array<{
        product_id: number;
        offer_id: string;
        stocks: Array<{
            present: number;
            reserved: number;
            type: string;
        }>;
    }>;
}

export interface OzonSellerRolesResponse {
    result: Array<{
        name: string;
        methods: string[];
    }>;
}

/** Клиент официального Ozon Seller API */
@Injectable()
export class SellerApiClient extends BaseOzonApiClient {
    constructor(
        httpService: HttpService,
        configService: ConfigService,
        allowedOzonApiService: AllowedOzonApiService,
        complianceLog: ComplianceLogService,
        rateLimiter: OzonApiRateLimiterService,
    ) {
        super(
            httpService,
            configService,
            allowedOzonApiService,
            complianceLog,
            rateLimiter,
        );
    }

    private getBaseUrl(): string {
        return (
            this.configService.get<string>('ozon.api.sellerBaseUrl') ??
            'https://api-seller.ozon.ru'
        );
    }

    async healthCheck(
        credentials: OzonApiCredentials,
        userId?: string,
    ): Promise<OzonSellerRolesResponse> {
        return this.request<OzonSellerRolesResponse>(
            {
                apiType: OzonApiType.SELLER,
                baseUrl: this.getBaseUrl(),
                path: '/v1/roles',
                method: 'POST',
                body: {},
                userId,
            },
            credentials,
        );
    }

    async listProducts(
        credentials: OzonApiCredentials,
        lastId: string,
        limit: number,
        userId?: string,
    ): Promise<OzonSellerProductListResponse> {
        return this.request<OzonSellerProductListResponse>(
            {
                apiType: OzonApiType.SELLER,
                baseUrl: this.getBaseUrl(),
                path: '/v3/product/list',
                method: 'POST',
                body: {
                    filter: { visibility: 'ALL' },
                    last_id: lastId,
                    limit,
                },
                userId,
            },
            credentials,
        );
    }

    async getProductInfo(
        credentials: OzonApiCredentials,
        productIds: string[],
        offerIds: string[],
        skus: string[],
        userId?: string,
    ): Promise<OzonSellerProductInfoResponse> {
        return this.request<OzonSellerProductInfoResponse>(
            {
                apiType: OzonApiType.SELLER,
                baseUrl: this.getBaseUrl(),
                path: '/v3/product/info/list',
                method: 'POST',
                body: {
                    product_id: productIds,
                    offer_id: offerIds,
                    sku: skus,
                },
                userId,
            },
            credentials,
        );
    }

    async getStocks(
        credentials: OzonApiCredentials,
        productIds: string[],
        userId?: string,
    ): Promise<OzonSellerStocksResponse> {
        return this.request<OzonSellerStocksResponse>(
            {
                apiType: OzonApiType.SELLER,
                baseUrl: this.getBaseUrl(),
                path: '/v4/product/info/stocks',
                method: 'POST',
                body: {
                    filter: {
                        product_id: productIds,
                        visibility: 'ALL',
                    },
                    limit: 1000,
                },
                userId,
            },
            credentials,
        );
    }

    async createProductsReport(
        credentials: OzonApiCredentials,
        userId?: string,
    ): Promise<{ result: { code: string } }> {
        return this.request<{ result: { code: string } }>(
            {
                apiType: OzonApiType.SELLER,
                baseUrl: this.getBaseUrl(),
                path: '/v1/report/products/create',
                method: 'POST',
                body: {
                    language: 'DEFAULT',
                    visibility: 'ALL',
                },
                userId,
            },
            credentials,
        );
    }

    async getReportInfo(
        credentials: OzonApiCredentials,
        reportCode: string,
        userId?: string,
    ): Promise<Record<string, unknown>> {
        return this.request<Record<string, unknown>>(
            {
                apiType: OzonApiType.SELLER,
                baseUrl: this.getBaseUrl(),
                path: '/v1/report/info',
                method: 'POST',
                body: { code: reportCode },
                userId,
            },
            credentials,
        );
    }

    async listOrders(
        credentials: OzonApiCredentials,
        since: string,
        to: string,
        offset: number,
        userId?: string,
    ): Promise<Record<string, unknown>> {
        return this.request<Record<string, unknown>>(
            {
                apiType: OzonApiType.SELLER,
                baseUrl: this.getBaseUrl(),
                path: '/v3/posting/fbs/list',
                method: 'POST',
                body: {
                    dir: 'ASC',
                    filter: { since, to },
                    limit: 100,
                    offset,
                },
                userId,
            },
            credentials,
        );
    }
}
