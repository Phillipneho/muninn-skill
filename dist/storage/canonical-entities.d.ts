/**
 * Canonical Entity Table
 *
 * Solves the Single-Hop factual recall problem by assigning unique IDs
 * to all entities, regardless of how they're referenced.
 *
 * Example:
 * - "BHP" → ORG_001
 * - "the client" → ORG_001 (same entity)
 * - "Phillip" → PERSON_001
 * - "he" → PERSON_001 (after coreference resolution)
 *
 * This ensures all facts about an entity are linked, even if mentioned
 * with different names or pronouns.
 */
import type { Database as SQLiteDatabase } from 'better-sqlite3';
export interface CanonicalEntity {
    id: string;
    canonicalName: string;
    aliases: string[];
    type: 'person' | 'org' | 'project' | 'location' | 'event' | 'concept';
    firstMentioned: string;
    lastMentioned: string;
    mentionCount: number;
    metadata?: Record<string, any>;
}
export declare class CanonicalEntityTable {
    private db;
    constructor(db: SQLiteDatabase);
    private initTable;
    /**
     * Find an entity by any of its aliases or canonical name
     */
    findByAlias(name: string): CanonicalEntity | null;
    /**
     * Register a new entity or update an existing one
     */
    register(name: string, type: CanonicalEntity['type'], aliases?: string[], metadata?: Record<string, any>): CanonicalEntity;
    /**
     * Link an alias to an existing entity
     */
    linkAlias(entityId: string, alias: string): void;
    /**
     * Get all entities of a type
     */
    getByType(type: CanonicalEntity['type']): CanonicalEntity[];
    /**
     * Get most mentioned entities (for importance ranking)
     */
    getTopEntities(limit?: number): CanonicalEntity[];
    /**
     * Resolve a mention to its canonical entity ID
     * Returns null if not found (new entity)
     */
    resolve(mention: string): string | null;
    /**
     * Get canonical name for an entity ID
     */
    getCanonicalName(entityId: string): string | null;
    /**
     * Merge two entities (for deduplication)
     */
    merge(primaryId: string, secondaryId: string): void;
    private fromRow;
}
//# sourceMappingURL=canonical-entities.d.ts.map