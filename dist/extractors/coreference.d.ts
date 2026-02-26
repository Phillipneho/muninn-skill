/**
 * Coreference Resolution for Muninn Memory System
 *
 * Resolves pronouns, aliases, and references to canonical entity names
 * BEFORE memory storage to prevent entity fragmentation.
 *
 * This fixes the LOCOMO benchmark gap where "Phillip", "him", and
 * "the Program Manager" were seen as 3 different entities.
 *
 * Uses LLM-based entity linking via local Ollama.
 */
import { MemoryStore } from '../storage/index.js';
export interface EntityAlias {
    canonical: string;
    aliases: string[];
    type: string;
}
export interface CoreferenceResult {
    originalText: string;
    resolvedText: string;
    entityMap: Map<string, string>;
    newEntitiesFound: string[];
}
/**
 * Initialize entity cache from memory store
 * Should be called when memory system starts
 */
export declare function initEntityCache(store: MemoryStore): Promise<void>;
/**
 * Add a new entity to the cache
 */
export declare function addToEntityCache(canonical: string, aliases: string[], type: string): void;
/**
 * Get canonical name for a pronoun or alias
 */
export declare function resolveEntity(mention: string): string | null;
/**
 * Clear entity cache (for testing)
 */
export declare function clearEntityCache(): void;
/**
 * Resolve coreferences in text
 *
 * @param text - Raw input text
 * @param knownEntities - Optional list of known entities (from memory store)
 * @param useLLM - Whether to use LLM for resolution (default: true)
 * @returns CoreferenceResult with resolved text and entity mappings
 */
export declare function resolveCoreferences(text: string, knownEntities?: string[], useLLM?: boolean): Promise<CoreferenceResult>;
/**
 * Simple coreference resolution without LLM
 * Uses pattern matching and entity cache only
 */
export declare function resolveCoreferencesSimple(text: string, knownEntities?: string[]): CoreferenceResult;
/**
 * Resolve coreferences before storing memory
 *
 * Returns metadata to be stored alongside the memory
 */
export interface MemoryCoreferenceMetadata {
    originalContent: string;
    resolvedContent: string;
    coreferenceMap: Record<string, string>;
    newEntities: string[];
}
/**
 * Pre-process content before memory storage
 */
export declare function preprocessForMemory(content: string, store?: MemoryStore): Promise<MemoryCoreferenceMetadata>;
/**
 * Simple version without LLM (faster, for batch processing)
 */
export declare function preprocessForMemorySimple(content: string, store?: MemoryStore): MemoryCoreferenceMetadata;
//# sourceMappingURL=coreference.d.ts.map