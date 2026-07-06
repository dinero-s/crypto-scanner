import { Injectable } from '@nestjs/common';
import { FundingArbitrageService } from 'src/modules/arbitrage/services/funding-arbitrage.service';
import { CashCarryArbitrageService } from 'src/modules/arbitrage/services/cash-carry-arbitrage.service';
import { ArbitrageTypeEnum } from 'src/modules/arbitrage/enums/arbitrage-type.enum';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeConnectorService } from 'src/modules/exchanges/services/exchange-connector.service';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { MarketDataCollectorService } from 'src/modules/market-data/services/market-data-collector.service';
import { OpportunitiesQueryDto, ScannerDashboardDto } from '../dto/mini-app.dto';

/** Фасад REST API для Mini App */
@Injectable()
export class MiniAppApiService {
    constructor(
        private readonly fundingArbitrageService: FundingArbitrageService,
        private readonly cashCarryArbitrageService: CashCarryArbitrageService,
        private readonly exchangeRegistry: ExchangeRegistryService,
        private readonly exchangeConnectorService: ExchangeConnectorService,
        private readonly marketDataCollector: MarketDataCollectorService,
    ) {}

    /** Dashboard summary */
    async getDashboard(): Promise<ScannerDashboardDto> {
        const collectorStatus = await this.marketDataCollector.getCollectorStatus();
        const funding = await this.fundingArbitrageService.findOpportunities({ limit: 1 });
        const cashCarry = await this.cashCarryArbitrageService.findOpportunities({ limit: 1 });

        return {
            fundingCount: funding.length,
            cashCarryCount: cashCarry.length,
            lastUpdatedAt: collectorStatus.lastRunAt
                ? new Date(collectorStatus.lastRunAt).getTime()
                : null,
            collectorsHealthy: collectorStatus.healthy,
        };
    }

    /** Funding opportunities */
    async getFundingOpportunities(query: OpportunitiesQueryDto) {
        return this.fundingArbitrageService.findOpportunities({
            type: ArbitrageTypeEnum.FUNDING,
            exchange: query.exchange,
            minNetYield: query.minNetYieldPct,
            limit: query.limit,
        });
    }

    /** Cash & carry opportunities */
    async getCashCarryOpportunities(query: OpportunitiesQueryDto) {
        return this.cashCarryArbitrageService.findOpportunities({
            type: ArbitrageTypeEnum.CASH_CARRY,
            exchange: query.exchange,
            minNetYield: query.minNetYieldPct,
            limit: query.limit,
        });
    }

    /** Exchanges list with capabilities */
    async getExchanges() {
        const health = await this.exchangeConnectorService.getHealthStatus();

        return this.exchangeRegistry.getAllConnectors().map((connector) => ({
            exchange: connector.getExchangeName(),
            healthy: health[connector.getExchangeName()] ?? false,
            capabilities: this.resolveCapabilities(connector.getExchangeName()),
        }));
    }

    private resolveCapabilities(exchange: ExchangeEnum) {
        const predictedFunding = ![
            ExchangeEnum.GATE,
            ExchangeEnum.KUCOIN,
            ExchangeEnum.KRAKEN,
        ].includes(exchange);

        return {
            spot: true,
            perpetual: true,
            fundingRate: true,
            predictedFunding,
            openInterest: exchange !== ExchangeEnum.KRAKEN,
        };
    }

    /** Scanner health for Mini App */
    async getScannerHealth() {
        const status = await this.marketDataCollector.getCollectorStatus();
        return {
            collectors: status,
            timestamp: Date.now(),
        };
    }
}
