/**
 * Temporal Decay Scorer
 *
 * Applies exponential half-life decay to memory scores based on age.
 * Memories older than the half-life are penalized but never fully removed.
 *
 * Also handles contradiction chains - when an entity has been superseded,
 * the entire chain is boosted to provide context.
 *
 * Based on: "Temporal RAG: Why RAG Always Gets 'When' Questions Wrong" (SOTA Blog, Jan 2026)
 */
import type { Memory } from '../storage/index.js';
import { RelationshipStore, Relationship } from '../storage/relationship-store.js';
import { EntityStore } from '../storage/entity-store.js';
export interface TemporalDecayOptions {
    /** Half-life in days (default: 30) */
    halfLifeDays: number;
    /** Minimum score floor (default: 0.1) */
    minScore: number;
    /** Contradiction chain boost factor (default: 1.5) */
    contradictionBoost: number;
}
/**
 * Temporal Decay Scorer class
 */
export declare class TemporalDecayScorer {
    private decayRate;
    private options;
    constructor(options?: Partial<TemporalDecayOptions>);
    /**
     * Calculate temporal score for a memory
     * Score = e^(-λt) where t is age in days
     *
     * @param memory - The memory to score
     * @param referenceDate - Reference date for calculating age (default: now)
     * @returns Score between minScore and 1.0
     */
    score(memory: Memory, referenceDate?: Date): number;
    /**
     * Get the decay rate
     */
    getDecayRate(): number;
    /**
     * Get the half-life in days
     */
    getHalfLifeDays(): number;
    /**
     * Apply temporal decay to an array of memories
     *
     * @param memories - Array of memories with existing scores
     * @param scoreProperty - Property name containing the base score (default: '_finalScore')
     * @param referenceDate - Reference date for calculating age
     * @returns Memories with temporal scores applied
     */
    applyDecay<T extends Memory>(memories: T[], scoreProperty?: string, referenceDate?: Date): Array<T & {
        _temporalScore: number;
        _combinedScore: number;
    }>;
    /**
     * Sort memories by combined score (base score * temporal decay)
     */
    sortByTemporalScore<T extends Memory>(memories: T[], scoreProperty?: string): T[];
}
/**
 * Check if an entity has contradictions and get the chain
 */
export declare function getContradictionChain(entityStore: EntityStore, relationshipStore: RelationshipStore, entityName: string): {
    current?: Relationship;
    superseded: Relationship[];
};
/**
 * Apply temporal decay with contradiction handling
 *
 * @param memories - Base memories to score
 * @param baseScores - Map of memory ID to base score
 * @param entityStore - Entity store for contradiction lookup
 * @param relationshipStore - Relationship store for contradiction lookup
 * @param options - Temporal decay options
 * @returns Memories with temporal scores and contradiction boosts applied
 */
export declare function applyTemporalDecayWithContradictions(memories: Memory[], baseScores: Map<string, number>, entityStore: EntityStore, relationshipStore: RelationshipStore, options?: Partial<TemporalDecayOptions>): Memory[];
/**
 * Default scorer instance with 30-day half-life
 */
export declare const defaultTemporalScorer: TemporalDecayScorer;
/**
 * Quick score function for simple use cases
 */
export declare function getTemporalScore(memory: Memory, halfLifeDays?: number): number;
//# sourceMappingURL=temporal-decay.d.ts.map