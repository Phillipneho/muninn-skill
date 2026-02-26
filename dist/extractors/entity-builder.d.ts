/**
 * Canonical Entity List Builder
 *
 * Scans memories and builds a canonical entity list with:
 * - Entity extraction (NER + LLM)
 * - Alias clustering
 * - Manual merge/dedup support
 */
export interface CanonicalEntity {
    id: string;
    name: string;
    type: 'person' | 'org' | 'project' | 'location' | 'event' | 'concept' | 'other';
    aliases: string[];
    mentionCount: number;
    firstMentioned: string;
    lastMentioned: string;
    confidence: number;
    merged?: boolean;
    mergedInto?: string;
}
export interface EntityCache {
    entities: Record<string, CanonicalEntity>;
    aliasToEntity: Record<string, string>;
    lastId: number;
}
/**
 * Register a new entity or add alias to existing
 */
export declare function registerEntity(name: string, type: CanonicalEntity['type'], timestamp?: string): CanonicalEntity;
/**
 * Add alias to existing entity
 */
export declare function addAlias(entityId: string, alias: string): boolean;
/**
 * Find entity by name or alias
 */
export declare function findEntity(nameOrAlias: string): CanonicalEntity | null;
/**
 * Get all entities
 */
export declare function getAllEntities(): CanonicalEntity[];
/**
 * Get entities by type
 */
export declare function getEntitiesByType(type: CanonicalEntity['type']): CanonicalEntity[];
/**
 * Merge entity A into entity B
 */
export declare function mergeEntities(sourceId: string, targetId: string): boolean;
/**
 * Extract entities from text using LLM
 */
export declare function extractEntitiesFromText(text: string, timestamp?: string): Promise<CanonicalEntity[]>;
/**
 * Scan all memories and build entity list
 */
export declare function scanMemoriesForEntities(memories: Array<{
    content: string;
    timestamp?: string;
}>): Promise<{
    total: number;
    newEntities: number;
    entities: CanonicalEntity[];
}>;
/**
 * Export entity list for review
 */
export declare function exportEntityList(): {
    entities: CanonicalEntity[];
    statistics: {
        total: number;
        byType: Record<string, number>;
        topMentioned: CanonicalEntity[];
    };
};
/**
 * Clear cache (for testing)
 */
export declare function clearCache(): void;
//# sourceMappingURL=entity-builder.d.ts.map