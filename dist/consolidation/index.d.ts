/**
 * Consolidation Engine
 * Async job that runs periodically to:
 * - Extract entities from episodes
 * - Distill episodes into semantic facts
 * - Detect contradictions
 * - Build knowledge graph
 */
import { MemoryStore } from '../storage/index.js';
export interface ConsolidationResult {
    consolidated: number;
    entitiesDiscovered: number;
    contradictions: number;
    connectionsFormed: number;
}
export declare function consolidate(store: MemoryStore, options?: {
    batchSize?: number;
}): Promise<ConsolidationResult>;
export interface Claim {
    predicate: string;
    object: string;
    source: string;
    timestamp: string;
    superseded_by?: string;
}
export declare function resolveTruth(claims: Claim[]): Claim[];
//# sourceMappingURL=index.d.ts.map