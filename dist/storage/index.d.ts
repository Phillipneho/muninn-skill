/**
 * OpenClaw Memory System v1
 * Storage Layer - SQLite + Vector Search
 *
 * Local-first, Ollama-compatible memory system
 * Forked from Engram patterns, optimized for OpenClaw
 */
export type MemoryType = 'episodic' | 'semantic' | 'procedural';
import { EntityStore } from './entity-store.js';
import { RelationshipStore } from './relationship-store.js';
export interface Memory {
    id: string;
    type: MemoryType;
    content: string;
    resolvedContent?: string;
    coreferenceMap?: Record<string, string>;
    title?: string;
    summary?: string;
    entities: string[];
    topics: string[];
    embedding: number[];
    salience: number;
    timestamp?: string;
    sessionId?: string;
    ttl?: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}
export interface RecallOptions {
    types?: MemoryType[];
    entities?: string[];
    topics?: string[];
    limit?: number;
    timeRange?: {
        start: Date | string;
        end: Date | string;
    };
    sessionId?: string;
    last?: string;
    recentTurns?: Array<{
        text: string;
        speaker?: string;
    }>;
    enableSpreading?: boolean;
    enableTemporalDecay?: boolean;
    temporalHalfLifeDays?: number;
}
export interface Procedure {
    id: string;
    title: string;
    description?: string;
    steps: ProcedureStep[];
    version: number;
    success_count: number;
    failure_count: number;
    is_reliable: boolean;
    evolution_log: EvolutionEvent[];
    created_at: string;
    updated_at: string;
}
export interface ProcedureStep {
    id: string;
    order: number;
    description: string;
    expected_outcome?: string;
}
export interface EvolutionEvent {
    version: number;
    trigger: 'failure' | 'success_pattern' | 'manual';
    change: string;
    timestamp: string;
}
export interface Entity {
    name: string;
    memory_count: number;
    last_seen: string;
}
export interface MemoryEdge {
    id: string;
    source_id: string;
    target_id: string;
    relationship: string;
    created_at: string;
}
export interface VaultStats {
    total: number;
    byType: Record<MemoryType, number>;
    entities: number;
    edges: number;
    procedures: number;
}
export declare function generateEmbedding(text: string): Promise<number[]>;
export declare class MemoryStore {
    private db;
    private entityStore;
    private relationshipStore;
    constructor(dbPath?: string);
    /**
     * Get the entity store for direct access
     */
    getEntityStore(): EntityStore;
    /**
     * Get the relationship store for direct access
     */
    getRelationshipStore(): RelationshipStore;
    private init;
    remember(content: string, type?: MemoryType, options?: {
        title?: string;
        summary?: string;
        entities?: string[];
        topics?: string[];
        salience?: number;
        timestamp?: string;
        sessionId?: string;
        ttl?: number;
        sessionDate?: Date | string;
    }): Promise<Memory>;
}
//# sourceMappingURL=index.d.ts.map