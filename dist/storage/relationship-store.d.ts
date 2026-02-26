/**
 * Relationship Store for Knowledge Graph
 * Stores relationships with timestamps, sessionId, and contradiction tracking
 */
import Database from 'better-sqlite3';
export type RelationshipType = 'has_target' | 'has_customer' | 'uses' | 'built_by' | 'employs' | 'has_priority' | 'part_of' | 'went_to' | 'works_at' | 'knows' | 'has_interest' | 'has_identity' | 'has_plan';
export interface Relationship {
    id: string;
    source: string;
    target: string;
    type: RelationshipType;
    value?: string;
    timestamp: string;
    sessionId: string;
    confidence: number;
    supersededBy?: string;
}
export declare class RelationshipStore {
    private db;
    constructor(db: Database.Database);
    private createTables;
    /**
     * Add a relationship
     * Returns the relationship and any superseded relationship
     */
    addRelationship(rel: Omit<Relationship, 'id'>): {
        relationship: Relationship;
        superseded?: Relationship;
    };
    /**
     * Find contradiction (same source, same type, different value, not superseded)
     */
    private findContradiction;
    /**
     * Get relationship by ID
     */
    getById(id: string): Relationship | null;
    /**
     * Get relationships from a source entity
     */
    getBySource(sourceId: string): Relationship[];
    /**
     * Get relationships to a target entity
     */
    getByTarget(targetId: string): Relationship[];
    /**
     * Get relationships by type
     */
    getByType(type: RelationshipType): Relationship[];
    /**
     * Get temporal history for an entity and relationship type
     * Returns all versions ordered chronologically
     */
    getHistory(sourceId: string, type?: RelationshipType): Relationship[];
    /**
     * Get current (non-superseded) relationship for entity + type
     */
    getCurrent(sourceId: string, type: RelationshipType): Relationship | null;
    /**
     * Get all relationships
     */
    getAll(): Relationship[];
    /**
     * Get relationships by session
     */
    getBySession(sessionId: string): Relationship[];
    /**
     * Find all active contradictions (relationships that have been superseded)
     */
    getContradictions(): {
        current: Relationship;
        superseded: Relationship;
    }[];
    /**
     * Get all superseded relationships
     */
    getSuperseded(): Relationship[];
    private rowToRelationship;
}
//# sourceMappingURL=relationship-store.d.ts.map