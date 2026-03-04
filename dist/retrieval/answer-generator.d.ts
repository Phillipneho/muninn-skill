/**
 * LLM Answer Generator for LOCOMO Benchmark
 *
 * Generates concise answers from retrieved memories using OpenAI API
 * Optimized for speed with minimal context
 */
import { Memory } from '../storage/index.js';
/**
 * Generate concise answer from retrieved memories using OpenAI
 * Optimized for speed: uses minimal context and small response
 */
export declare function generateAnswer(query: string, memories: Memory[], options?: {
    maxTokens?: number;
    model?: string;
}): Promise<string>;
/**
 * Check if generated answer matches expected answer using OpenAI
 */
export declare function checkAnswerWithLLM(generated: string, expected: string, question: string, options?: {
    model?: string;
}): Promise<boolean>;
/**
 * Generate answer with caching
 */
export declare function generateAnswerWithCache(query: string, memories: Memory[], options?: {
    maxTokens?: number;
    model?: string;
}): Promise<string>;
/**
 * Check answer with caching
 */
export declare function checkAnswerWithCache(generated: string, expected: string, question: string, options?: {
    model?: string;
}): Promise<boolean>;
//# sourceMappingURL=answer-generator.d.ts.map