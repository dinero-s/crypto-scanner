# Ozon

## Назначение
MVP Ozon Marketplace Operator + **AI Profit Audit**: подключение seller API, синхронизация, детерминированный аудит потерь, рекомендации, AI-объяснение фактов, конкуренты и алерты (только официальные API).

## Структура
- controllers: `ozon.controller.ts`, `ozon-audit.controller.ts`
- integration: подключения Ozon, шифрование credentials, аудит подключений
- seller: синхронизация товаров и отчётов продавца
- competitor: отслеживание товаров конкурентов, fan-out sync (job на карточку), алерты при изменении цены
- analytics: **Profit Audit** (`snapshots/`, `metrics/`, `detectors/`, `recommendations/`), `ProductAnalyticsService`
- ai-advisor: LLM + `OzonAiContextBuilderService`, `OzonAiAdvisorService`
- alerts: события уведомлений, Telegram, алерты конкурентов
- queue: BullMQ (`OZON_SYNC`, `OZON_AUDIT`, `OZON_COMPETITOR`; audit pipeline — пошаговые job с checkpoints)
- clients: HTTP-клиенты Ozon Seller/Statistics/Performance API
- compliance: whitelist разрешённых API-вызовов

## MongoDB (Profit Audit)
- `ozon_audit_runs` — запуски аудита (status, progressStep, period, metrics)
- `ozon_metric_snapshots` — дневные метрики SKU (TTL 365 дней по умолчанию)
- `ozon_detected_issues` — найденные проблемы (issueKey, dedup, loss confidence)
- `ozon_audit_recommendations` — рекомендации по issue (recommendationKey, dedup)
- `ozon_ai_reports` — AI/deterministic отчёты (TTL 365 дней по умолчанию)

## Основные потоки
- Подключение → создаётся `ozon_audit_runs` → `OZON_INITIAL_SYNC` → pipeline с progressStep.
- Cron 07:00 UTC → daily audit (если нет активного QUEUED/RUNNING).
- `POST /ozon/audit/run` — ручной аудит (`periodDays`: 30/60/90), защита от дублей RUNNING.
- Pipeline: SYNC → METRICS → DATA_QUALITY (snapshot на auditRun) → ISSUES → RECOMMENDATIONS → AI_REPORT → DONE; каждый шаг — отдельный BullMQ job.

## API Profit Audit (`/api/user/ozon/`)
- `POST audit/run` → `{ auditRunId, status, progressStep }`
- `GET audit/status` → UI state по `ozon_audit_runs`
- `GET audit/latest` → report + auditRun + dataQuality + topIssues/Recommendations
- `GET issues`, `GET issues/:id`, `PATCH issues/:id/status`
- `GET audit/recommendations`, `PATCH audit/recommendations/:id/status`

## Зависимости
- `UsersModule`, `OzonApiClientModule`, BullMQ `QUEUE_NAMES.OZON_*`, Redis lock для cron.
- Роутинг: `RoutesUserModule`.

## Что читать при изменениях
- `ozon.module.ts`, `analytics/services/ozon-audit.service.ts`, `analytics/services/ozon-audit-run.service.ts`, `analytics/detectors/*`, `queue/`, `ozon-audit.controller.ts`.
