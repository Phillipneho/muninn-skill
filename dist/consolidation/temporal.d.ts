/**
 * Temporal Reasoning Module
 *
 * Tracks how facts change over time and answers temporal queries:
 * - "When did X change?"
 * - "How did X evolve over sessions?"
 * - "What was X's value at time Y?"
 */
import MemoryStore, { Memory } from '../storage/index.js';
export interface TemporalEvent {
    timestamp: string;
    memory: Memory;
    change_type: 'created' | 'updated' | 'contradicted' | 'reinforced';
    value: string;
    previous_value?: string;
}
export interface TemporalTimeline {
    entity: string;
    attribute: string;
    events: TemporalEvent[];
    current_value: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
}
export interface TemporalQueryResult {
    question: string;
    timeline: TemporalTimeline | null;
    answer: string;
    confidence: number;
}
/**
 * Extract temporal events from a memory
 */
export declare function extractTemporalEvents(memory: Memory): TemporalEvent[];
/**
 * Build a timeline for a specific entity and attribute
 */
export declare function buildTimeline(store: MemoryStore, entity: string, attribute: string): Promise<TemporalTimeline | null>;
/**
 * Answer a temporal query
 */
export declare function answerTemporalQuery(store: MemoryStore, query: string): Promise<TemporalQueryResult>;
/**
 * Detect temporal relationships between memories
 */
export declare function detectTemporalRelationships(memories: Memory[]): Map<string, Memory[]>;
//# sourceMappingURL=temporal.d.ts.map