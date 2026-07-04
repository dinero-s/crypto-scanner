import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import {
  ForbiddenFrontendOzonRequestError,
  assertNotOzonDirectRequest,
} from '../api/ozon/errors';
import { AvailabilityBadge } from '../components/ui/AvailabilityBadge';
import { AlertsPage } from '../pages/ozon/AlertsPage';
import { ConnectionsPage } from '../pages/ozon/ConnectionsPage';
import { CompetitorsPage } from '../pages/ozon/CompetitorsPage';
import { ProfitAuditPage } from '../pages/ozon/ProfitAuditPage';
import { sanitizeAuditValue } from '../utils/secrets';
import * as ozonApi from '../api/ozon/ozonApi';
import { UNAVAILABLE_MESSAGE } from '../utils/ozon';

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Ozon API client compliance', () => {
  it('blocks direct requests to Ozon hosts', () => {
    expect(() => assertNotOzonDirectRequest('https://www.ozon.ru/product/123')).toThrow(
      ForbiddenFrontendOzonRequestError,
    );
    expect(() => assertNotOzonDirectRequest('https://ozon.ru/api/test')).toThrow(
      ForbiddenFrontendOzonRequestError,
    );
    expect(() => assertNotOzonDirectRequest('https://xapi.ozon.ru/v1/data')).toThrow(
      ForbiddenFrontendOzonRequestError,
    );
  });

  it('allows backend API paths', () => {
    expect(() => assertNotOzonDirectRequest('/api/user/ozon/connections')).not.toThrow();
  });
});

describe('AvailabilityBadge', () => {
  it('shows unavailable message instead of error for NOT_AVAILABLE_VIA_OFFICIAL_API', () => {
    render(<AvailabilityBadge status="NOT_AVAILABLE_VIA_OFFICIAL_API" showMessage />);
    expect(screen.getByText(/недоступна через официальный API Ozon/i)).toBeInTheDocument();
    expect(screen.queryByText(/парсинг не удался/i)).not.toBeInTheDocument();
  });
});

describe('Audit secrets masking', () => {
  it('masks api keys and tokens in audit values', () => {
    expect(sanitizeAuditValue('apiKey', 'super-secret-key-12345')).toMatch(/•/);
    expect(sanitizeAuditValue('clientId', '1234567890')).toMatch(/•/);
    expect(sanitizeAuditValue('message', 'Sync completed')).toBe('Sync completed');
  });
});

describe('AlertsPage delivery warnings', () => {
  beforeEach(() => {
    vi.spyOn(ozonApi, 'getAlerts').mockResolvedValue([
      {
        id: 'a1',
        type: 'ai_recommendation',
        severity: 'medium',
        status: 'failed',
        message: 'Alert failed',
        channel: 'TELEGRAM',
        deliveryError: 'Bot token invalid',
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.spyOn(ozonApi, 'getConnections').mockResolvedValue([]);
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows telegram/email configuration warnings and delivery errors', async () => {
    wrap(<AlertsPage />);
    expect(await screen.findByText(/Email не указан в профиле/i)).toBeInTheDocument();
    expect(screen.getByText(/Telegram-уведомления не настроены/i)).toBeInTheDocument();
    expect(screen.getByText(/Bot token invalid/i)).toBeInTheDocument();
  });
});

describe('ConnectionsPage api key handling', () => {
  beforeEach(() => {
    vi.spyOn(ozonApi, 'getConnections').mockResolvedValue([
      {
        id: 'c1',
        sellerName: 'Магазин',
        clientId: '12345678',
        status: 'active',
      },
    ]);
  });

  afterEach(() => vi.restoreAllMocks());

  it('does not display api key after connection is created', async () => {
    wrap(
      <MemoryRouter>
        <ConnectionsPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Магазин')).toBeInTheDocument());
    expect(screen.queryByDisplayValue(/secret-api-key/i)).not.toBeInTheDocument();
    expect(screen.getByText(/1234/)).toBeInTheDocument();
  });
});

describe('Competitor form backend-only URL', () => {
  beforeEach(() => {
    vi.spyOn(ozonApi, 'createCompetitor').mockResolvedValue({
      id: 'comp1',
      connectionId: 'c1',
      status: 'active',
      urlReference: 'https://www.ozon.ru/product/test-123/',
    });
    vi.spyOn(ozonApi, 'getConnections').mockResolvedValue([
      { id: 'c1', sellerName: 'Shop', clientId: '1', status: 'active' },
    ]);
    vi.spyOn(ozonApi, 'getCompetitors').mockResolvedValue([]);
  });

  afterEach(() => vi.restoreAllMocks());

  it('sends competitor URL only to backend createCompetitor', async () => {
    const user = userEvent.setup();
    wrap(
      <MemoryRouter>
        <CompetitorsPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /добавить карточку/i }));
    const urlInput = screen.getByLabelText(/URL карточки Ozon/i);
    await user.type(urlInput, 'https://www.ozon.ru/product/test-123/');
    await user.click(screen.getByRole('button', { name: /^Добавить товар$/i }));

    await waitFor(() => {
      expect(ozonApi.createCompetitor).toHaveBeenCalled();
    });

    const [payload] = vi.mocked(ozonApi.createCompetitor).mock.calls[0];
    expect(payload).toEqual(
      expect.objectContaining({
        connectionId: 'c1',
        url: 'https://www.ozon.ru/product/test-123/',
      }),
    );
  });
});

describe('ProfitAuditPage', () => {
  beforeEach(() => {
    vi.spyOn(ozonApi, 'getConnections').mockResolvedValue([
      {
        id: 'c1',
        sellerName: 'Тест-магазин',
        clientId: '12345678',
        status: 'active',
        lastSyncAt: new Date().toISOString(),
      },
    ]);
    vi.spyOn(ozonApi, 'getAuditStatus').mockResolvedValue({
      state: 'AUDIT_READY',
      auditRun: {
        id: 'run1',
        status: 'SUCCESS',
        progressStep: 'DONE',
        periodFrom: '2026-01-01T00:00:00.000Z',
        periodTo: '2026-01-31T23:59:59.999Z',
        periodDays: 30,
        dataQualityScore: 85,
        issuesCount: 2,
        criticalIssuesCount: 1,
        highIssuesCount: 0,
        recommendationsCount: 2,
        estimatedLossMin: 10000,
        estimatedLossMax: 25000,
        lossCalculationConfidence: 'MEDIUM',
        finishedAt: new Date().toISOString(),
      },
      latestReportId: 'r1',
    });
    vi.spyOn(ozonApi, 'getLatestAuditReport').mockResolvedValue({
      report: {
        id: 'r1',
        type: 'INITIAL_AUDIT',
        aiText: 'AI-аудит Ozon завершен.\n\nНайдено проблем: 2',
        periodFrom: '2026-01-01',
        periodTo: '2026-01-31',
        createdAt: new Date().toISOString(),
      },
      auditRun: {
        id: 'run1',
        status: 'SUCCESS',
        progressStep: 'DONE',
        periodFrom: '2026-01-01T00:00:00.000Z',
        periodTo: '2026-01-31T23:59:59.999Z',
        periodDays: 30,
        issuesCount: 2,
        criticalIssuesCount: 1,
        highIssuesCount: 0,
        estimatedLossMin: 10000,
        estimatedLossMax: 25000,
      },
      dataQuality: {
        score: 85,
        state: 'READY',
        hasProductsData: true,
        hasPriceData: true,
        hasStockData: true,
        hasSalesData: true,
        hasFinanceData: true,
        hasAdsData: true,
        hasReturnsData: true,
        missingData: [],
        warnings: [],
        detectorAvailability: {
          stockoutRisk: { status: 'READY' },
          overstock: { status: 'READY' },
          adsWaste: { status: 'READY' },
          priceLeak: { status: 'READY' },
          returnSpike: { status: 'READY' },
        },
        checkedDetectorsCount: 5,
        availableDetectorsCount: 5,
        partialDetectorsCount: 0,
        unavailableDetectorsCount: 0,
      },
      topIssues: [
        {
          id: 'i1',
          type: 'STOCKOUT_RISK',
          severity: 'CRITICAL',
          confidence: 0.9,
          title: 'Риск out-of-stock: SKU-123',
          summary: 'Остаток закончится через 3 дня',
          evidence: [{ metric: 'stockDaysLeft', value: 3 }],
          status: 'NEW',
        },
      ],
      topRecommendations: [],
    });
    vi.spyOn(ozonApi, 'runProfitAudit').mockResolvedValue({
      auditRunId: 'run2',
      status: 'QUEUED',
      progressStep: 'QUEUED',
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows audit summary and run button', async () => {
    wrap(
      <MemoryRouter>
        <ProfitAuditPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('AI Profit Audit')).toBeInTheDocument();
    expect(await screen.findByText('Риск out-of-stock: SKU-123')).toBeInTheDocument();
    expect(await screen.findByText('Критичных')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /запустить аудит/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /открыть/i })).toHaveAttribute(
      'href',
      '/ozon/issues/i1',
    );
  });

  it('triggers audit via backend API', async () => {
    const user = userEvent.setup();
    wrap(
      <MemoryRouter>
        <ProfitAuditPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /запустить аудит/i }));

    await waitFor(() => {
      expect(ozonApi.runProfitAudit).toHaveBeenCalledWith({
        connectionId: 'c1',
        periodDays: 30,
      });
    });
  });
});

describe('UNAVAILABLE_MESSAGE copy', () => {
  it('uses compliant wording', () => {
    expect(UNAVAILABLE_MESSAGE).toContain('официальный API Ozon');
    expect(UNAVAILABLE_MESSAGE).not.toMatch(/парсинг не удался/i);
  });
});
