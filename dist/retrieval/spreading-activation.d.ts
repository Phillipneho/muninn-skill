/**
 * Spreading Activation via Knowledge Graph
 *
 * Implements 2-hop graph traversal to expand initial retrieval results
 * with connected entities from the knowledge graph.
 *
 * Based on: arXiv:2512.15922 - "Leveraging Spreading Activation for Improved Document Retrieval"
 */
import type { Memory } from '../storage/index.js';
import { RelationshipStore, Relationship } from '../storage/relationship-store.js';
import { EntityStore } from '../storage/entity-store.js';
export interface SpreadingActivationOptions {
    /** Maximum hops for graph traversal (default: 2) */
    maxHops: number;
    /** Decay factor per hop (default: 0.5) */
    decayFactor: number;
    /** Maximum neighbors per entity (default: 10) */
    maxNeighbors: number;
    /** Minimum activation threshold (default: 0.25) */
    minActivation: number;
}
export interface NeighborResult {
    entityId: string;
    entityName: string;
    activation: number;
    relationship: Relationship;
}
/**
 * Main spreading activation function
 *
 * Takes initial retrieval results and expands them via 2-hop graph traversal
 * to capture related entities that weren't in the initial query results.
 *
 * @param initialResults - Initial BM25 + Vector search results
 * @param relationshipStore - The knowledge graph relationship store
 * @param entityStore - The entity store
 * @param allMemories - All available memories for finding neighbor memories
 * @param options - Configuration options
 * @returns Expanded results with graph neighbors
 */
export declare function spreadActivation(initialResults: Memory[], relationshipStore: RelationshipStore, entityStore: EntityStore, allMemories: Memory[], options?: Partial<SpreadingActivationOptions>): Promise<Memory[]>;
/**
 * Simple version that only uses relationship store (for compatibility)
 */
export declare function spreadActivationSimple(initialResults: Memory[], relationshipStore: RelationshipStore, options?: Partial<SpreadingActivationOptions>): Promise<Memory[]>;
//# sourceMappingURL=spreading-activation.d.ts.map