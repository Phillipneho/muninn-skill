/**
 * Entity Store for Knowledge Graph
 * Stores entities with aliases, mentions, and timestamps
 */
import Database from 'better-sqlite3';
export type EntityType = 'organization' | 'person' | 'project' | 'technology' | 'location';
export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    aliases: string[];
    mentions: number;
    firstSeen: string;
    lastSeen: string;
}
export declare class EntityStore {
    private db;
    constructor(db: Database.Database);
    private createTables;
    /**
     * Add or update an entity
     */
    addEntity(entity: Omit<Entity, 'id' | 'mentions' | 'firstSeen' | 'lastSeen'> & {
        firstSeen?: string;
        lastSeen?: string;
    }): Entity;
    /**
     * Get entity by ID
     */
    getById(id: string): Entity | null;
    /**
     * Get entity by name (case-insensitive)
     */
    getByName(name: string): Entity | null;
    /**
     * Get all entities of a specific type
     */
    getByType(type: EntityType): Entity[];
    /**
     * Get all entities
     */
    getAll(): Entity[];
    /**
     * Find entity by exact name or alias
     */
    findEntity(nameOrAlias: string): Entity | null;
    /**
     * Get entity history (all updates)
     */
    getHistory(entityName: string): {
        mentions: number;
        lastSeen: string;
    }[];
}
//# sourceMappingURL=entity-store.d.ts.map