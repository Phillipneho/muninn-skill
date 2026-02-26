/**
 * Entity Normalization
 *
 * Resolves entity mentions to canonical forms:
 * - Pronouns → Names (when resolvable)
 * - Abbreviations → Full names
 * - Dates → ISO 8601
 * - Aliases stored for retrieval
 */
import type { Entity, EntityType } from './entities.js';
export interface NormalizedEntity {
    original: string;
    canonical: string;
    type: EntityType;
    confidence: number;
    context: string;
    aliases: string[];
}
export interface NormalizationResult {
    entities: NormalizedEntity[];
    text: string;
}
/**
 * Normalize entities using LLM (optional) or rule-based fallback
 *
 * @param text - Input text
 * @param existingEntities - Pre-extracted entities (optional)
 * @param llmProvider - Optional LLM function for advanced normalization
 * @returns Normalized entities with aliases
 */
export declare function normalizeEntities(text: string, existingEntities?: Entity[], llmProvider?: (prompt: string) => Promise<string>): Promise<NormalizedEntity[]>;
/**
 * Alias storage for retrieval
 */
export interface EntityAliasStore {
    getAliases(canonical: string): string[];
    addAlias(canonical: string, alias: string): void;
    findCanonical(alias: string): string | null;
}
export declare function createAliasStore(): EntityAliasStore;
/**
 * Extract with normalization (combined function)
 */
export declare function extractWithNormalization(text: string, existingEntities?: Entity[], llmProvider?: (prompt: string) => Promise<string>): Promise<{
    entities: Entity[];
    normalized: NormalizedEntity[];
}>;
//# sourceMappingURL=normalize.d.ts.map