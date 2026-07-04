import { Injectable, Logger } from '@nestjs/common';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { ExchangeInstrumentRepository } from '../repositories/exchange-instrument.repository';
import { ExchangeHealthService } from './exchange-health.service';

/** Сбор справочника инструментов */
@Injectable()
export class InstrumentCollectorService {
    private readonly logger = new Logger(InstrumentCollectorService.name);

    constructor(
        private readonly registry: ExchangeRegistryService,
        private readonly instrumentRepository: ExchangeInstrumentRepository,
        private readonly healthService: ExchangeHealthService,
    ) {}

    /** Собрать инструменты со всех включённых бирж */
    async collectAll(): Promise<number> {
        const instruments = await this.healthService.collectPerExchange(
            (exchange) => this.registry.getConnector(exchange).getInstruments(),
            'collectInstruments',
        );

        const upserted = await this.instrumentRepository.upsertMany(instruments);
        this.logger.log(
            `collectInstruments upserted=${String(upserted)} total=${String(instruments.length)}`,
        );
        return upserted;
    }
}
