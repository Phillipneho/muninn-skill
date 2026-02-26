/**
 * Content Router (Enhanced Keyword Version)
 *
 * Classifies content into memory types using pattern matching.
 * No LLM required - fast, deterministic, zero dependencies.
 *
 * Accuracy target: 90%+
 */
export interface RoutingResult {
    types: {
        episodic: number;
        semantic: number;
        procedural: number;
    };
    reasoning: string;
    confidence: number;
    matchedPatterns: string[];
}
export declare function routeWithLLM(content: string, context?: string): Promise<RoutingResult>;
export declare function routeContent(content: string, context?: string): Promise<{
    episodic: boolean;
    semantic: boolean;
    procedural: boolean;
}>;
export declare function routeWithKeywords(content: string, context?: string): RoutingResult;
//# sourceMappingURL=router.d.ts.map