/**
 * LLM-Based Retrieval Filter
 *
 * Post-filters semantic search results using LLM to improve precision
 * while maintaining recall by using recall-biased prompts.
 */
import type { Memory } from '../storage/index.js';
export interface FilterOptions {
    /** Maximum number of results to return */
    k?: number;
    /** Whether to use recall-biased filtering (keep borderline cases) */
    recallBiased?: boolean;
    /** Custom prompt template */
    promptTemplate?: string;
    /** LLM timeout in ms (default 2000) */
    timeout?: number;
}
/**
 * Filter memories using LLM to improve relevance ranking
 * With fast timeout fallback to avoid hanging
 *
 * @param query - The search query
 * @param memories - Candidate memories from semantic search
 * @param options - Filter options
 * @returns Filtered and ranked memories
 */
export declare function filterMemories(query: string, memories: Memory[], options?: FilterOptions): Promise<Memory[]>;
/**
 * Post-retrieval scorer for temporal/contradiction questions
 */
export declare function scoreForQuestionType(memories: Memory[], query: string): Memory[];
//# sourceMappingURL=filter.d.ts.map