/**
 * Relationship Extractor
 * Extracts relationships from memory content using pattern matching
 */
import { RelationshipType } from '../storage/relationship-store.js';
export interface ExtractedRelationship {
    source: string;
    target: string;
    type: RelationshipType;
    value?: string;
    confidence: number;
    matchedText: string;
}
declare function inferEntityType(name: string): string;
/**
 * Extract relationships from content
 */
export declare function extractRelationships(content: string, knownEntities: Map<string, string>): ExtractedRelationship[];
/**
 * Extract relationships and resolve to entity IDs
 */
export declare function extractAndResolveRelationships(content: string, entityResolver: (name: string) => string | null): Omit<import('../storage/relationship-store.js').Relationship, 'id'>[];
/**
 * Infer entity type from context
 */
export declare function inferTypeFromContext(content: string, entityName: string): string;
export { inferEntityType };
//# sourceMappingURL=relationships.d.ts.map