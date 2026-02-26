/**
 * Session Priming (Working Memory Buffer)
 *
 * At session start, preloads "stale but important" entities - those
 * mentioned frequently in past sessions but not recently.
 *
 * This ensures continuity between sessions by surfacing relevant
 * context that would otherwise be forgotten.
 *
 * Based on: MemGPT/Letta architecture for working memory
 */
import type { Memory } from '../storage/index.js';
import { EntityStore } from '../storage/entity-store.js';
import { RelationshipStore } from '../storage/relationship-store.js';
export interface SessionPrimingOptions {
    /** Minimum session mentions to be considered "important" (default: 3) */
    minMentions: number;
    /** Hours since last mention to be considered "stale" (default: 48) */
    staleHours: number;
    /** Maximum entities to preload (default: 5) */
    maxEntities: number;
    /** Maximum memories per entity to retrieve (default: 2) */
    memoriesPerEntity: number;
}
/**
 * Find entities that are "stale but important"
 * - Mentioned in multiple sessions (>= minMentions)
 * - Not mentioned recently (>= staleHours ago)
 */
export interface StaleImportantEntity {
    entity: {
        id: string;
        name: string;
        type: string;
        mentions: number;
    };
    lastMentioned: Date;
    hoursSinceMention: number;
}
/**
 * Query for stale-but-important entities
 * Returns entities that were frequently referenced but haven't been
 * mentioned recently - good candidates for session context
 */
export declare function findStaleImportantEntities(entityStore: EntityStore, options?: Partial<SessionPrimingOptions>): Promise<StaleImportantEntity[]>;
/**
 * Cohesion Query - main function for session priming
 *
 * Finds entities that are frequently mentioned across sessions but have
 * gone stale, then retrieves recent memories about them.
 *
 * @param entityStore - Entity store for finding stale-important entities
 * @param relationshipStore - Relationship store for session tracking
 * @param recallFn - Function to recall memories (context, options) => Promise<Memory[]>
 * @param options - Configuration options
 * @returns Array of primed memories for session context
 */
export declare function cohesionQuery(entityStore: EntityStore, relationshipStore: RelationshipStore, recallFn: (context: string, options?: any) => Promise<Memory[]>, options?: Partial<SessionPrimingOptions>): Promise<{
    primedMemories: Memory[];
    staleEntities: StaleImportantEntity[];
    summary: string;
}>;
/**
 * Simple cohesion query that works with memory store
 *
 * @param entityStore - Entity store
 * @param relationshipStore - Relationship store
 * @param memories - All available memories
 * @param options - Configuration options
 * @returns Primed memories
 */
export declare function simpleCohesionQuery(entityStore: EntityStore, relationshipStore: RelationshipStore, memories: Memory[], options?: Partial<SessionPrimingOptions>): Promise<{
    primedMemories: Memory[];
    staleEntities: StaleImportantEntity[];
}>;
/**
 * Get session cohesion score
 * Measures how well connected the current session is to past sessions
 */
export declare function calculateSessionCohesion(currentSessionEntities: string[], staleEntities: StaleImportantEntity[]): number;
//# sourceMappingURL=session-priming.d.ts.map