/**
 * Temporal Extractor for Muninn Memory System
 *
 * Extracts dates from text and normalizes to ISO format for efficient temporal queries.
 * Designed to power the LOCOMO benchmark temporal questions like:
 * "When did Caroline go to the LGBTQ support group?"
 *
 * Handles:
 * - Absolute dates: "May 7, 2023", "7 May 2023", "2023-05-07"
 * - Relative dates: "last Tuesday", "yesterday", "next week"
 * - Relative to reference: "the week before 6 July 2023"
 * - Date ranges: "the week before X", "the month of August 2023"
 *
 * Returns: Array of { date: Date, text: string, confidence: number }
 */
export interface TemporalExtraction {
    /** Extracted date or start of range */
    date: Date;
    /** End date if range */
    endDate?: Date;
    /** Type of extraction */
    dateType: 'absolute' | 'relative' | 'range';
    /** Granularity */
    granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
    /** Original text that was parsed */
    originalText: string;
    /** Confidence level (0-1) */
    confidence: number;
}
/**
 * Extract all dates from text
 *
 * @param text - Input text containing date mentions
 * @param referenceDate - Optional reference date for relative calculations (defaults to now)
 * @returns Array of temporal extractions
 */
export declare function extractDates(text: string, referenceDate?: Date): TemporalExtraction[];
/**
 * Detect if a query is asking about a temporal relationship
 * Common patterns: "When did...", "What day...", "What time..."
 */
export declare function detectTemporalQuery(query: string): {
    isTemporal: boolean;
    temporalType: 'when' | 'what_day' | 'what_time' | 'duration' | 'frequency' | null;
    extractedDates: TemporalExtraction[];
};
/**
 * Format a date for display
 */
export declare function formatDate(date: Date, format?: 'iso' | 'readable' | 'relative'): string;
/**
 * Format a date range for display
 */
export declare function formatDateRange(start: Date, end: Date, format?: 'iso' | 'readable'): string;
//# sourceMappingURL=temporal.d.ts.map