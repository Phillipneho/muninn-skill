/**
 * Graph Traversal - BFS Path Finding for Multi-Hop Queries
 *
 * Implements BFS to find paths between entity pairs in the knowledge graph.
 * Used for answering multi-hop questions like "What is the connection between A and B?"
 *
 * Based on: Muninn Multi-Hop Improvements Spec (2026-03-03)
 */
import { RelationshipStore, RelationshipType } from '../storage/relationship-store.js';
import { EntityStore } from '../storage/entity-store.js';
export interface Path {
    segments: PathSegment[];
    length: number;
}
export interface PathSegment {
    source: string;
    target: string;
    type: RelationshipType;
    value?: string;
}
export interface GraphTraversalOptions {
    /** Maximum hops for path finding (default: 3) */
    maxHops?: number;
    /** Maximum paths to return (default: 10) */
    maxPaths?: number;
    /** Entity store for looking up entity names */
    entityStore?: EntityStore;
}
/**
 * Find all paths between two entities using BFS
 *
 * This is the core algorithm for multi-hop queries. It finds all paths
 * from sourceEntity to targetEntity up to maxHops, skipping any relationships
 * that have been superseded (contradicted).
 *
 * @param sourceEntityId - Source entity ID or name
 * @param targetEntityId - Target entity ID or name
 * @param relationshipStore - The relationship store for graph traversal
 * @param options - Configuration options
 * @returns Array of paths found, sorted by length (shortest first)
 */
export declare function findPaths(sourceEntityId: string, targetEntityId: string, relationshipStore: RelationshipStore, options?: GraphTraversalOptions): Path[];
/**
 * Find paths between two entities by name (looks up IDs first)
 *
 * @param sourceName - Source entity name
 * @param targetName - Target entity name
 * @param entityStore - Entity store for name -> ID lookup
 * @param relationshipStore - Relationship store for graph
 * @param options - Configuration options
 * @returns Array of paths found
 */
export declare function findPathsByName(sourceName: string, targetName: string, entityStore: EntityStore, relationshipStore: RelationshipStore, options?: GraphTraversalOptions): Path[];
/**
 * Get path description for answer synthesis
 *
 * Converts a path into human-readable text using entity names.
 *
 * @param path - The path to describe
 * @param entityStore - Entity store for name lookup
 * @returns Human-readable path description
 */
export declare function getPathDescription(path: Path, entityStore: EntityStore): string;
/**
 * Get all paths between multiple entity pairs
 *
 * Useful for queries with multiple entities like "What connects A, B, and C?"
 *
 * @param entityNames - Array of entity names to find connections between
 * @param entityStore - Entity store
 * @param relationshipStore - Relationship store
 * @param options - Configuration options
 * @returns Map of entity pair -> paths
 */
export declare function findConnectionsBetweenEntities(entityNames: string[], entityStore: EntityStore, relationshipStore: RelationshipStore, options?: GraphTraversalOptions): Map<string, Path[]>;
/**
 * Score a path by relevance
 *
 * Higher scores = more relevant paths.
 * Considers:
 * - Path length (shorter = better)
 * - Relationship confidence
 * - Entity mentions
 *
 * @param path - Path to score
 * @param relationshipStore - Relationship store for confidence lookup
 * @param entityStore - Entity store for mention lookup
 * @returns Score (higher = better)
 */
export declare function scorePath(path: Path, relationshipStore: RelationshipStore, entityStore: EntityStore): number;
/**
 * Sort paths by score (descending)
 *
 * @param paths - Paths to sort
 * @param relationshipStore - Relationship store
 * @param entityStore - Entity store
 * @returns Sorted paths (best first)
 */
export declare function rankPaths(paths: Path[], relationshipStore: RelationshipStore, entityStore: EntityStore): Path[];
export type { RelationshipType };
//# sourceMappingURL=graph-traversal.d.ts.map