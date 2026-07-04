import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LlmAdvisorProvider } from './llm-advisor.provider';
import {
    AiAdvisorReport,
    DeterministicAuditReport,
    RecommendationContext,
} from '../interfaces/audit-ai.interfaces';
import {
    compressContextForLlm,
    estimateTokens,
} from '../utils/llm-context.utils';

const AUDIT_AI_SYSTEM_PROMPT =
    'Ты — бизнес-советник для продавца Ozon. Используй ТОЛЬКО переданные факты из JSON-контекста. ' +
    'ЗАПРЕЩЕНО придумывать цифры, проценты, суммы или SKU, которых нет в контексте. ' +
    'Не обещай точный финансовый результат. ' +
    'Если estimatedLossMin/Max отсутствуют или lossCalculationConfidence=LOW — не пиши точные суммы потерь. ' +
    'Если dataQuality.state не READY — явно укажи, что аудит частичный, и перечисли warnings из dataQuality. ' +
    'Если detectorAvailability.<detector>.status=NOT_AVAILABLE — не делай выводов по этому направлению. ' +
    'Если dataQuality.hasAdsData=false — не делай выводов по рекламе и ДРР. ' +
    'Если dataQuality.hasFinanceData=false — не пиши точную прибыль или маржу. ' +
    'Не делай вид, что аудит полный при неполных данных. ' +
    'Ответ на русском языке в формате JSON: ' +
    '{"title":"...","executiveSummary":"...","topActions":[{"title":"...","reason":"...","steps":["..."]}],"risks":["..."]}';

interface OpenAiChatResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

/** AI-советник Profit Audit — только объяснение рассчитанных фактов */
@Injectable()
export class OzonAiAdvisorService {
    private readonly logger = new Logger(OzonAiAdvisorService.name);

    constructor(
        private readonly llmProvider: LlmAdvisorProvider,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async generateReport(
        context: RecommendationContext,
    ): Promise<{ report: AiAdvisorReport; usedLlm: boolean }> {
        const llmReport = await this.callLlm(context);
        if (llmReport) {
            return { report: llmReport, usedLlm: true };
        }

        return {
            report: this.buildDeterministicReport(context),
            usedLlm: false,
        };
    }

    buildDeterministicReport(context: RecommendationContext): DeterministicAuditReport {
        const { summary, issues, dataQuality } = context;
        const topIssues = [...issues]
            .sort((a, b) => {
                const order: Record<string, number> = {
                    CRITICAL: 0,
                    HIGH: 1,
                    MEDIUM: 2,
                    LOW: 3,
                };
                return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
            })
            .slice(0, 5);

        const topActions = topIssues.map((issue) => ({
            title: issue.recommendation.title,
            reason: issue.summary,
            steps: issue.recommendation.steps,
        }));

        const risks = topIssues.map(
            (issue) => `${issue.title}: ${issue.summary}`,
        );

        const lossRange =
            summary.estimatedLossMax > 0
                ? ` Потенциальные потери: ${String(summary.estimatedLossMin)}–${String(summary.estimatedLossMax)} ₽.`
                : '';

        const qualityNote =
            dataQuality.state !== 'READY'
                ? ` Качество данных: ${String(dataQuality.score)}/100 (${dataQuality.state}). ${dataQuality.warnings.join(' ')}`
                : dataQuality.warnings.length > 0
                  ? ` ${dataQuality.warnings.join(' ')}`
                  : '';

        return {
            title:
                context.reportType === 'INITIAL_AUDIT'
                    ? 'AI Profit Audit Ozon'
                    : 'Ежедневный отчёт CEO по Ozon',
            executiveSummary:
                `Найдено проблем: ${String(summary.totalIssues)}. ` +
                `Критичных: ${String(summary.criticalIssues)}, высоких: ${String(summary.highIssues)}.` +
                lossRange +
                qualityNote,
            topActions,
            risks,
            summary,
        };
    }

    formatReportText(report: AiAdvisorReport | DeterministicAuditReport): string {
        const lines = [
            report.title,
            '',
            report.executiveSummary,
            '',
            'Главные действия:',
        ];

        report.topActions.forEach((action, index) => {
            lines.push(`${String(index + 1)}. ${action.title} — ${action.reason}`);
        });

        if (report.risks.length > 0) {
            lines.push('', 'Риски:');
            report.risks.forEach((risk) => lines.push(`• ${risk}`));
        }

        return lines.join('\n');
    }

    private async callLlm(context: RecommendationContext): Promise<AiAdvisorReport | null> {
        if (!this.llmProvider.isEnabled()) {
            return null;
        }

        const apiKey = this.configService.get<string>('ozon.ai.apiKey') ?? '';
        const baseUrl =
            this.configService.get<string>('ozon.ai.baseUrl') ??
            'https://api.openai.com/v1';
        const model =
            this.configService.get<string>('ozon.ai.model') ?? 'gpt-4o-mini';

        const maxInputTokens =
            this.configService.get<number>('ozon.audit.llmMaxInputTokens') ?? 24_000;
        const maxIssues =
            this.configService.get<number>('ozon.audit.llmMaxIssues') ?? 15;
        const compressedContext = compressContextForLlm(
            context,
            maxInputTokens,
            maxIssues,
        );

        const userPrompt =
            `Контекст (только эти факты, не добавляй цифры):\n${JSON.stringify(compressedContext)}`;

        const estimatedTokens = estimateTokens(userPrompt);
        if (estimatedTokens > maxInputTokens) {
            this.logger.warn(
                `LLM context truncated estimatedTokens=${String(estimatedTokens)} max=${String(maxInputTokens)}`,
            );
            return null;
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post<OpenAiChatResponse>(
                    `${baseUrl.replace(/\/+$/, '')}/chat/completions`,
                    {
                        model,
                        temperature: 0.1,
                        max_tokens: 1500,
                        response_format: { type: 'json_object' },
                        messages: [
                            { role: 'system', content: AUDIT_AI_SYSTEM_PROMPT },
                            { role: 'user', content: userPrompt },
                        ],
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 45_000,
                    },
                ),
            );

            const content = response.data.choices?.[0]?.message?.content?.trim();
            if (!content) {
                return null;
            }

            const parsed = JSON.parse(content) as AiAdvisorReport;
            if (!parsed.title || !parsed.executiveSummary) {
                return null;
            }

            return parsed;
        } catch {
            this.logger.warn('LLM audit report недоступен, fallback на deterministic');
            return null;
        }
    }
}
