/**
 * Temporal Metadata Extractor
 *
 * Converts natural language time expressions into ISO dates and relative offsets.
 * Ported from Python dateparser approach for Muninn Memory System.
 *
 * Usage:
 *   extractTemporalMetadata("in a fortnight", new Date())
 *   → { eventTime: "2026-03-12", daysOffset: 14, isFuture: true }
 */
import { DateTime } from 'luxon';
/**
 * Reference clock - injected into all temporal operations
 * Defaults to now, but can be overridden for testing or context-aware extraction
 */
export declare function getReferenceClock(): DateTime;
export interface TemporalMetadata {
    /** When this was mentioned */
    mentionTime: string;
    /** The parsed event time (ISO format) */
    eventTime: string | null;
    /** Days from mention to event */
    daysOffset: number | null;
    /** Is this a future event? */
    isFuture: boolean | null;
    /** Granularity of the time expression */
    granularity: 'hour' | 'day' | 'week' | 'month' | 'year' | null;
    /** Original text that was parsed */
    originalText: string;
    /** Confidence level (0-1) */
    confidence: number;
}
/**
 * Extract temporal metadata from natural language text
 *
 * Architecture: Reference Clock Injection
 * - Every extraction call includes Current_Time context
 * - Invalid dates degrade gracefully (return null, not crash)
 * - Reference clock can be overridden for testing or context-aware extraction
 */
export declare function extractTemporalMetadata(text: string, referenceDate?: Date | string | null): TemporalMetadata;
/**
 * Batch extract temporal metadata from multiple texts
 */
export declare function extractTemporalMetadataBatch(texts: string[], referenceDate?: Date): Array<{
    text: string;
    metadata: TemporalMetadata;
}>;
/**
 * Resolve "X days after Y" style expressions with context
 *
 * Architecture: Multi-Hop Temporal Join
 * 1. Muninn retrieves the date of "Y" (Single-hop factual recall)
 * 2. Feed that date as reference_date into this function
 * 3. Calculate the offset
 *
 * Example: "Two weeks after the launch"
 * - First: Retrieve "launch" event date from memory store
 * - Then: Calculate launch_date + 14 days
 */
export declare function resolveRelativeWithContext(text: string, contextEvents: Map<string, Date>, referenceDate?: Date | string | null): TemporalMetadata;
//# sourceMappingURL=temporal-metadata.d.ts.map