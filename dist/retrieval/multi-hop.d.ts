/**
 * Multi-Hop Retrieval - Token-Efficient Implementation
 *
 * Combines:
 * 1. Entity-centric retrieval with temporal filtering
 * 2. PPR graph traversal (zero tokens)
 * 3. Spreading activation (zero tokens)
 * 4. IRCoT fallback (tokens only when needed)
 *
 * Based on: Ernie's multi-hop research (2026-02-27)
 */
import type { Memory } from '../storage/index.js';
import { EntityStore } from '../storage/entity-store.js';
import { RelationshipStore } from '../storage/relationship-store.js';
import { Path } from './graph-traversal.js';
export interface MultiHopOptions {
    /** Maximum memories to return (default: 20) */
    limit?: number;
    /** Entity-centric retrieval budget per entity (default: 50) */
    entityBudget?: number;
    /** PPR damping factor (default: 0.85) */
    pprDamping?: number;
    /** PPR iterations (default: 20) */
    pprIterations?: number;
    /** Spreading activation decay (default: 0.5) */
    activationDecay?: number;
    /** Maximum spreading hops (default: 2) */
    maxActivationHops?: number;
    /** Confidence threshold for IRCoT fallback (default: 0.7) */
    fallbackThreshold?: number;
    /** Enable IRCoT fallback (default: true) */
    enableFallback?: boolean;
    /** Entity store for graph operations */
    entityStore?: EntityStore;
    /** Relationship store for graph operations */
    relationshipStore?: RelationshipStore;
    /** All memories for spreading activation */
    allMemories?: Memory[];
}
export interface MultiHopResult {
    memories: Memory[];
    confidence: number;
    usedFallback: boolean;
    method: string;
    /** Paths found between entities (for multi-hop queries) */
    paths?: Path[];
    /** Entity pairs that were queried for paths */
    pathEntities?: string[];
}
export interface TemporalConstraint {
    after?: Date;
    before?: Date;
    on?: Date;
    raw?: string;
}
/**
 * Expand keywords with synonyms (rule-based, zero tokens)
 */
declare function expandKeywords(keywords: string[]): string[];
/**
 * Extract entities from query (rule-based, zero tokens)
 */
declare function extractQueryEntities(query: string): string[];
/**
 * Extract temporal constraints from query (rule-based, zero tokens)
 */
declare function extractTemporalConstraints(query: string): TemporalConstraint;
/**
 * Filter memories by temporal constraints
 */
declare function filterByTemporal(memories: Memory[], constraint: TemporalConstraint): Memory[];
/**
 * Retrieve all memories for entities, then filter and rank
 */
export declare function retrieveEntityCentric(query: string, getMemoriesByEntity: (entity: string, limit: number) => Memory[], options?: MultiHopOptions): Promise<{
    memories: Memory[];
    entities: string[];
    temporalConstraint: TemporalConstraint;
}>;
/**
 * Compute confidence score for retrieval results
 */
declare function computeConfidence(memories: Memory[], query: string, entities: string[], temporalConstraint: TemporalConstraint): number;
/**
 * Multi-hop retrieval with zero-token graph methods
 * Falls back to IRCoT only if confidence < threshold
 */
export declare function multiHopRetrieval(query: string, getMemoriesByEntity: (entity: string, limit: number) => Memory[], options?: MultiHopOptions): Promise<MultiHopResult>;
export { extractQueryEntities, extractTemporalConstraints, expandKeywords, filterByTemporal, computeConfidence };
//# sourceMappingURL=multi-hop.d.ts.map