/**
 * Graph Traversal for Knowledge Graph
 * BFS for multi-hop connections with path ranking
 */
import { RelationshipStore, Relationship, RelationshipType } from '../storage/relationship-store.js';
import { EntityStore, Entity } from '../storage/entity-store.js';
export interface Path {
    entities: string[];
    relationships: string[];
    hops: number;
    relevance: number;
}
export interface GraphTraversalOptions {
    maxHops?: number;
    includeSuperseded?: boolean;
    relationshipTypes?: RelationshipType[];
}
/**
 * Find all paths between two entities using BFS
 */
export declare function findPaths(entityStore: EntityStore, relationshipStore: RelationshipStore, fromEntityName: string, toEntityName: string, options?: GraphTraversalOptions): Path[];
/**
 * Get all entities connected to a given entity
 */
export declare function getConnectedEntities(entityStore: EntityStore, relationshipStore: RelationshipStore, entityName: string, options?: GraphTraversalOptions): Entity[];
/**
 * Get all relationships for an entity (both as source and target)
 */
export declare function getEntityRelationships(entityStore: EntityStore, relationshipStore: RelationshipStore, entityName: string, options?: GraphTraversalOptions): Relationship[];
/**
 * Find entities by relationship pattern
 */
export declare function findEntitiesByRelationship(entityStore: EntityStore, relationshipStore: RelationshipStore, relationshipType: RelationshipType, value?: string): Entity[];
/**
 * Get timeline of an entity's relationships
 */
export declare function getEntityTimeline(entityStore: EntityStore, relationshipStore: RelationshipStore, entityName: string, relationshipType?: RelationshipType): {
    relationship: Relationship;
    entity: Entity;
}[];
//# sourceMappingURL=graph-traversal.d.ts.map