/**
 * Contradiction Detection and Temporal Reasoning
 * Detects when new information contradicts old, tracks temporal history
 */
import { RelationshipStore, Relationship, RelationshipType } from '../storage/relationship-store.js';
import { EntityStore } from '../storage/entity-store.js';
export interface ContradictionResult {
    current: Relationship;
    superseded: Relationship;
    timestamp: string;
    sessionId: string;
}
export interface TemporalChange {
    entity: string;
    relationshipType: string;
    oldValue?: string;
    newValue?: string;
    timestamp: string;
    sessionId: string;
}
/**
 * Check if a new relationship contradicts existing ones
 */
export declare function detectContradiction(relationshipStore: RelationshipStore, sourceEntityId: string, type: RelationshipType, newValue?: string): Relationship | null;
/**
 * Get all contradictions involving an entity
 */
export declare function getEntityContradictions(relationshipStore: RelationshipStore, entityStore: EntityStore, entityName: string): ContradictionResult[];
/**
 * Get temporal history for an entity's relationship
 * Returns chronological list of all changes
 */
export declare function getTemporalHistory(relationshipStore: RelationshipStore, entityStore: EntityStore, entityName: string, relationshipType?: RelationshipType): TemporalChange[];
/**
 * Synthesize a temporal answer for a question about an entity
 */
export declare function synthesizeTemporalAnswer(relationshipStore: RelationshipStore, entityStore: EntityStore, entityName: string, relationshipType?: RelationshipType): Promise<string>;
/**
 * Synthesize a contradiction-aware answer
 */
export declare function synthesizeContradictionAnswer(relationshipStore: RelationshipStore, entityStore: EntityStore, entityName: string, question: string): string;
/**
 * Get all superseded relationships for an entity
 */
export declare function getSupersededRelationships(relationshipStore: RelationshipStore, entityStore: EntityStore, entityName: string): Relationship[];
/**
 * Check if a specific value is current (not superseded)
 */
export declare function isCurrentValue(relationshipStore: RelationshipStore, entityStore: EntityStore, entityName: string, relationshipType: RelationshipType, value: string): boolean;
/**
 * Get latest value with history
 */
export declare function getValueWithHistory(relationshipStore: RelationshipStore, entityStore: EntityStore, entityName: string, relationshipType?: RelationshipType): {
    current?: string;
    history: {
        value: string;
        timestamp: string;
        superseded: boolean;
    }[];
};
//# sourceMappingURL=contradiction.d.ts.map