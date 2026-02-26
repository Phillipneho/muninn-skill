/**
 * Hybrid Retrieval using Reciprocal Rank Fusion (RRF)
 *
 * Combines dense (semantic/embedding) and sparse (BM25) retrieval
 * to get the best of both worlds: semantic understanding + exact term matching.
 */
import type { Memory } from '../storage/index.js';
import { EntityStore } from '../storage/entity-store.js';
import { RelationshipStore } from '../storage/relationship-store.js';
export interface HybridOptions {
    /** Number of results from each retrieval method */
    k?: number;
    /** RRF constant (default 60) */
    rrfK?: number;
    /** Weight for dense scores (0-1) */
    denseWeight?: number;
    /** Weight for sparse scores (0-1) */
    sparseWeight?: number;
    /** Whether to use LLM filtering as final step */
    enableLLMFilter?: boolean;
    /** P7.2: Enable temporal decay scoring */
    enableTemporalDecay?: boolean;
    /** Half-life for temporal decay in days (default: 30) */
    temporalHalfLifeDays?: number;
    /** Entity store for contradiction detection */
    entityStore?: EntityStore;
    /** Relationship store for contradiction detection */
    relationshipStore?: RelationshipStore;
}
/**
 * Hybrid retrieval combining semantic and BM25 search
 *
 * @param query - Search query
 * @param documents - All documents to search
 * @param options - Configuration options
 * @returns Combined and ranked results
 */
export declare function hybridSearch(query: string, documents: Memory[], options?: HybridOptions): Promise<Memory[]>;
/**
 * Get retrieval scores breakdown for debugging
 */
export declare function getRetrievalBreakdown(query: string, documents: Memory[], k?: number): Promise<{
    query: string;
    dense: Array<{
        id: string;
        content: string;
        similarity: number;
        rank: number;
    }>;
    sparse: Array<{
        id: string;
        content: string;
        bm25: number;
        rank: number;
    }>;
    fused: Array<{
        id: string;
        content: string;
        rrfScore: number;
    }>;
}>;
//# sourceMappingURL=hybrid.d.ts.map