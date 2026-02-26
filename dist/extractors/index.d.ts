/**
 * Content Extractors
 * Extract structured data from raw conversation/content
 *
 * Uses enhanced keyword router for classification (95%+ accuracy)
 */
export { routeContent, routeWithKeywords, RoutingResult } from './router.js';
export { normalizeEntities, extractWithNormalization, createAliasStore, type NormalizedEntity, type EntityAliasStore } from './normalize.js';
import { extractEntities as extractEntitiesImpl } from './entities.js';
export interface ExtractionResult {
    type: 'episodic' | 'semantic' | 'procedural';
    title?: string;
    summary?: string;
    entities: string[];
    topics: string[];
    salience: number;
}
export declare function extractEpisodic(content: string): ExtractionResult;
export declare function extractSemantic(content: string): ExtractionResult;
export declare function extractProcedural(content: string): {
    title?: string;
    steps: string[];
};
export declare function extract(content: string, context?: string): Promise<ExtractionResult>;
export { extractEntitiesImpl as extractEntities };
//# sourceMappingURL=index.d.ts.map