import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OZON_AI_SYSTEM_PROMPT } from '../../constants/ozon-api.constants';

interface OpenAiChatResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

/** LLM-провайдер для AI Advisor (OpenAI-compatible API) */
@Injectable()
export class LlmAdvisorProvider {
    private readonly logger = new Logger(LlmAdvisorProvider.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    isEnabled(): boolean {
        const enabled =
            this.configService.get<boolean>('ozon.ai.enabled') === true;
        const apiKey = this.configService.get<string>('ozon.ai.apiKey');
        return enabled && Boolean(apiKey);
    }

    async generateSummary(userPrompt: string): Promise<string | null> {
        if (!this.isEnabled()) {
            return null;
        }

        const apiKey = this.configService.get<string>('ozon.ai.apiKey') ?? '';
        const baseUrl =
            this.configService.get<string>('ozon.ai.baseUrl') ??
            'https://api.openai.com/v1';
        const model =
            this.configService.get<string>('ozon.ai.model') ?? 'gpt-4o-mini';

        try {
            const response = await firstValueFrom(
                this.httpService.post<OpenAiChatResponse>(
                    `${baseUrl.replace(/\/+$/, '')}/chat/completions`,
                    {
                        model,
                        temperature: 0.2,
                        max_tokens: 500,
                        messages: [
                            { role: 'system', content: OZON_AI_SYSTEM_PROMPT },
                            { role: 'user', content: userPrompt },
                        ],
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 30_000,
                    },
                ),
            );

            const content = response.data.choices?.[0]?.message?.content?.trim();
            return content ?? null;
        } catch {
            this.logger.warn('LLM advisor недоступен, fallback на rule-based');
            return null;
        }
    }
}
