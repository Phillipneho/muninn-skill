/**
 * Procedure Evolution Module
 * LLM-powered failure analysis and auto-improvement
 */
import { Procedure, ProcedureStep, EvolutionEvent } from '../storage/index.js';
export interface FailureAnalysis {
    failedStep: number;
    failureReason: string;
    suggestedFix: string;
    newSteps: string[];
    confidence: number;
}
export interface ProcedureMetrics {
    successRate: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    lastFailures: string[];
    reliability: number;
}
/**
 * Analyze a procedure failure using LLM
 */
export declare function analyzeFailure(procedure: Procedure, failedAtStep: number, context: string): Promise<FailureAnalysis>;
/**
 * Calculate reliability score with decay
 * Recent successes count more than old ones
 */
export declare function calculateReliability(procedure: Procedure): ProcedureMetrics;
/**
 * Decide if a procedure should be auto-evolved
 */
export declare function shouldAutoEvolve(procedure: Procedure): boolean;
/**
 * Generate improved procedure version
 */
export declare function evolveProcedure(procedure: Procedure, failedAtStep: number, context: string): Promise<{
    newSteps: ProcedureStep[];
    evolutionEvent: EvolutionEvent;
    analysis: FailureAnalysis;
}>;
//# sourceMappingURL=evolution.d.ts.map