import { OzonAuditRunProgressStep } from '../../constants/ozon.enums';

/** Шаги Profit Audit pipeline в порядке выполнения */
export const AUDIT_PIPELINE_STEPS: OzonAuditRunProgressStep[] = [
    OzonAuditRunProgressStep.SYNC,
    OzonAuditRunProgressStep.METRICS_BUILD,
    OzonAuditRunProgressStep.DATA_QUALITY,
    OzonAuditRunProgressStep.ISSUES_DETECT,
    OzonAuditRunProgressStep.RECOMMENDATIONS_BUILD,
    OzonAuditRunProgressStep.AI_REPORT,
];

/** Индекс шага в pipeline (-1 если шаг вне pipeline) */
export function getAuditStepIndex(step: OzonAuditRunProgressStep): number {
    return AUDIT_PIPELINE_STEPS.indexOf(step);
}

/** Первый шаг pipeline с учётом skipSync */
export function getFirstAuditStep(skipSync: boolean): OzonAuditRunProgressStep {
    return skipSync
        ? OzonAuditRunProgressStep.METRICS_BUILD
        : OzonAuditRunProgressStep.SYNC;
}

/** Следующий шаг после current или null если pipeline завершён */
export function getNextAuditStep(
    current: OzonAuditRunProgressStep,
): OzonAuditRunProgressStep | null {
    const index = getAuditStepIndex(current);
    if (index < 0 || index >= AUDIT_PIPELINE_STEPS.length - 1) {
        return null;
    }
    return AUDIT_PIPELINE_STEPS[index + 1];
}

/** Шаг уже пройден относительно progressStep на auditRun */
export function isAuditStepCompleted(
    progressStep: OzonAuditRunProgressStep,
    targetStep: OzonAuditRunProgressStep,
): boolean {
    if (
        progressStep === OzonAuditRunProgressStep.DONE ||
        progressStep === OzonAuditRunProgressStep.FAILED
    ) {
        return true;
    }

    const progressIndex = getAuditStepIndex(progressStep);
    const targetIndex = getAuditStepIndex(targetStep);

    if (progressIndex < 0 || targetIndex < 0) {
        return false;
    }

    return progressIndex > targetIndex;
}
