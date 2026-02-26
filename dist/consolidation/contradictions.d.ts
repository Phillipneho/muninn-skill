/**
 * Contradiction Detection Module
 *
 * Identifies conflicting facts and resolves by:
 * - Detecting semantic contradictions (not just keyword matches)
 * - Resolving by timestamp (newer wins)
 * - Flagging ambiguous cases for review
 */
import MemoryStore, { Memory } from '../storage/index.js';
export interface Contradiction {
    memory1: Memory;
    memory2: Memory;
    conflict: string;
    resolution: 'newer_wins' | 'source_priority' | 'flag_for_review';
    winner: Memory;
    confidence: number;
}
export interface ContradictionReport {
    total_checked: number;
    contradictions_found: number;
    auto_resolved: number;
    flagged_for_review: number;
    details: Contradiction[];
}
/**
 * Check if two memories might contradict each other
 */
export declare function detectContradiction(mem1: Memory, mem2: Memory): Promise<Contradiction | null>;
/**
 * Scan all memories for contradictions
 */
export declare function scanContradictions(store: MemoryStore): Promise<ContradictionReport>;
/**
 * Get the resolved value for a query (considering contradictions)
 */
export declare function getResolvedValue(store: MemoryStore, query: string): Promise<{
    value: string;
    source: Memory;
    confidence: number;
}>;
//# sourceMappingURL=contradictions.d.ts.map