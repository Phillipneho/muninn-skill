/**
 * Coreference Resolution
 *
 * Rule-based pronoun resolution for multi-hop queries.
 * Maps pronouns (she/her/he/him/they/them) to their antecedents
 * based on recent entity mentions in the text.
 *
 * Based on: Muninn Multi-Hop Improvements Spec (2026-03-03)
 */
export interface CoreferenceResolution {
    pronoun: string;
    antecedent: string;
    position: number;
    replaced: boolean;
}
export interface CoreferenceResult {
    resolvedText: string;
    resolutions: CoreferenceResolution[];
}
/**
 * Gender and number pronoun mappings
 * Maps pronouns to potential antecedent categories
 */
declare const PRONOUN_MAP: Record<string, string[]>;
/**
 * Common verbs that establish entity identity
 */
declare const IDENTITY_VERBS: Set<string>;
/**
 * Resolve coreferences in text using rule-based approach
 *
 * Algorithm:
 * 1. Split text into sentences
 * 2. Track recent entities in context
 * 3. When pronoun found, match to most recent compatible entity
 * 4. Replace pronoun with antecedent if match found
 *
 * @param text - Input text to resolve
 * @param knownEntities - Map of lowercase entity name -> entity name
 * @returns Resolved text and list of resolutions made
 */
export declare function resolveCoreferences(text: string, knownEntities: Map<string, string>): CoreferenceResult;
/**
 * Resolve coreferences from extracted entities (simpler version)
 *
 * @param text - Input text
 * @param entities - Array of entity names found in text
 * @returns Resolved text
 */
export declare function resolveCoreferencesFromEntities(text: string, entities: string[]): CoreferenceResult;
/**
 * Extract potential antecedents from query context
 *
 * @param query - User query
 * @param entityNames - Known entity names
 * @returns Map of potential antecedents
 */
export declare function extractAntecedentsFromQuery(query: string, entityNames: string[]): Map<string, string>;
/**
 * Check if text likely contains coreferences
 *
 * @param text - Text to check
 * @returns True if likely contains pronouns needing resolution
 */
export declare function likelyHasCoreferences(text: string): boolean;
/**
 * Escape special regex characters in a string
 */
declare function escapeRegex(string: string): string;
/**
 * Get pronoun category
 */
declare function getPronounCategory(pronoun: string): 'female' | 'male' | 'neutral' | 'other';
export { PRONOUN_MAP, IDENTITY_VERBS, getPronounCategory, escapeRegex };
//# sourceMappingURL=coreference.d.ts.map