import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { toDecimal, toNumber } from '../utils/arbitrage-math.util';

export interface ScoringInput {
    netYieldPercent: number;
    spreadPercent: number | null;
    volume24h: number;
    minVolume24h: number;
    fundingRate?: number;
    predictedFundingRate?: number;
}

/** Расчёт risk/opportunity score */
@Injectable()
export class ArbitrageScoringService {
    /** Risk score 0–100 (выше = рискованнее) */
    calculateRiskScore(input: ScoringInput): number {
        let risk = 0;

        const volumeRatio = this.safeRatio(input.minVolume24h, input.volume24h);
        if (volumeRatio > 10) {
            risk += 40;
        } else if (volumeRatio > 5) {
            risk += 25;
        } else if (volumeRatio > 2) {
            risk += 10;
        }

        const spread = Math.abs(input.spreadPercent ?? 0);
        if (spread > 1) {
            risk += 35;
        } else if (spread > 0.5) {
            risk += 20;
        } else if (spread > 0.2) {
            risk += 10;
        }

        if (input.fundingRate !== undefined && input.predictedFundingRate !== undefined) {
            const current = toDecimal(input.fundingRate);
            const predicted = toDecimal(input.predictedFundingRate);
            if (current && predicted && !current.eq(0)) {
                const divergence = predicted.minus(current).abs().div(current.abs()).mul(100);
                if (divergence.gt(50)) {
                    risk += 20;
                } else if (divergence.gt(25)) {
                    risk += 10;
                }
            }
        }

        return Math.min(100, Math.max(0, Math.round(risk)));
    }

    /** Opportunity score 0–100 (выше = лучше) */
    calculateOpportunityScore(input: ScoringInput, riskScore: number): number {
        const net = toDecimal(input.netYieldPercent) ?? new Decimal(0);
        let score = net.mul(10).toNumber();

        const volumeBonus = Math.min(20, (input.volume24h / input.minVolume24h) * 5);
        score += volumeBonus;

        score -= riskScore * 0.3;

        return Math.min(100, Math.max(0, Math.round(score)));
    }

    private safeRatio(reference: number, actual: number): number {
        if (!Number.isFinite(actual) || actual <= 0) {
            return Infinity;
        }
        const ref = toDecimal(reference) ?? new Decimal(1);
        const act = toDecimal(actual) ?? new Decimal(1);
        return toNumber(ref.div(act));
    }
}
