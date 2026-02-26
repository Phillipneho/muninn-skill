/**
 * Entity Extractor
 *
 * Extracts named entities with types from text.
 * Pattern-based approach (no LLM needed for speed).
 *
 * Entity types:
 * - person: Names of people
 * - organization: Companies, teams, groups
 * - project: Named projects, products, apps
 * - technology: Programming languages, frameworks, tools
 * - location: Places, cities, countries
 * - event: Named events, meetings, launches
 * - concept: Abstract ideas, methodologies
 */
export type EntityType = 'person' | 'organization' | 'project' | 'technology' | 'location' | 'event' | 'concept';
export interface Entity {
    text: string;
    type: EntityType;
    confidence: number;
    context: string;
}
export declare function extractEntities(text: string): Entity[];
//# sourceMappingURL=entities.d.ts.map