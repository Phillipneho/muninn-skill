/**
 * Graph Traversal - BFS Path Finding for Multi-Hop Queries
 *
 * Implements BFS to find paths between entity pairs in the knowledge graph.
 * Used for answering multi-hop questions like "What is the connection between A and B?"
 *
 * Based on: Muninn Multi-Hop Improvements Spec (2026-03-03)
 */
const DEFAULT_OPTIONS = {
    maxHops: 3,
    maxPaths: 10,
    entityStore: undefined
};
/**
 * Find all paths between two entities using BFS
 *
 * This is the core algorithm for multi-hop queries. It finds all paths
 * from sourceEntity to targetEntity up to maxHops, skipping any relationships
 * that have been superseded (contradicted).
 *
 * @param sourceEntityId - Source entity ID or name
 * @param targetEntityId - Target entity ID or name
 * @param relationshipStore - The relationship store for graph traversal
 * @param options - Configuration options
 * @returns Array of paths found, sorted by length (shortest first)
 */
export function findPaths(sourceEntityId, targetEntityId, relationshipStore, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { maxHops, maxPaths } = opts;
    const paths = [];
    const queue = [
        { entityId: sourceEntityId, path: [] }
    ];
    // Track visited to avoid cycles (but allow different paths to same node)
    // Use visited set per depth level to prevent infinite loops
    const visited = new Set();
    while (queue.length > 0 && paths.length < maxPaths) {
        const current = queue.shift();
        const { entityId: currentEntityId, path: currentPath } = current;
        // Skip if we've exceeded max hops
        if (currentPath.length >= maxHops)
            continue;
        // Skip if already visited at this path length (prevent cycles)
        const visitKey = `${currentEntityId}:${currentPath.length}`;
        if (visited.has(visitKey))
            continue;
        visited.add(visitKey);
        // Get all outgoing relationships from current entity
        const relationships = relationshipStore.getBySource(currentEntityId);
        for (const rel of relationships) {
            // Skip contradicted relationships (where supersededBy is set)
            if (rel.supersededBy) {
                continue;
            }
            // Create new path segment
            const newSegment = {
                source: rel.source,
                target: rel.target,
                type: rel.type,
                value: rel.value
            };
            const newPath = [...currentPath, newSegment];
            // Check if we reached the target
            if (rel.target === targetEntityId && newPath.length > 0) {
                paths.push({
                    segments: newPath,
                    length: newPath.length
                });
                // Don't continue from found paths, just get more from queue
                continue;
            }
            // Add to queue for further traversal (if not exceeded max hops)
            if (newPath.length < maxHops) {
                queue.push({
                    entityId: rel.target,
                    path: newPath
                });
            }
        }
        // Also check incoming relationships (target -> source)
        // This finds paths where the relationship is reversed
        const incomingRelationships = relationshipStore.getByTarget(currentEntityId);
        for (const rel of incomingRelationships) {
            // Skip contradicted relationships
            if (rel.supersededBy) {
                continue;
            }
            // Create new path segment (reversed direction for display)
            const newSegment = {
                source: rel.source,
                target: rel.target,
                type: rel.type,
                value: rel.value
            };
            const newPath = [...currentPath, newSegment];
            // Check if we reached the target
            if (rel.source === targetEntityId && newPath.length > 0) {
                paths.push({
                    segments: newPath,
                    length: newPath.length
                });
                continue;
            }
            // Add to queue for further traversal
            if (newPath.length < maxHops) {
                queue.push({
                    entityId: rel.source,
                    path: newPath
                });
            }
        }
    }
    // Sort by path length (shorter = more direct = better)
    paths.sort((a, b) => a.length - b.length);
    return paths;
}
/**
 * Find paths between two entities by name (looks up IDs first)
 *
 * @param sourceName - Source entity name
 * @param targetName - Target entity name
 * @param entityStore - Entity store for name -> ID lookup
 * @param relationshipStore - Relationship store for graph
 * @param options - Configuration options
 * @returns Array of paths found
 */
export function findPathsByName(sourceName, targetName, entityStore, relationshipStore, options = {}) {
    // Look up entity IDs
    const sourceEntity = entityStore.findEntity(sourceName);
    const targetEntity = entityStore.findEntity(targetName);
    if (!sourceEntity) {
        console.warn(`[GraphTraversal] Source entity not found: ${sourceName}`);
        return [];
    }
    if (!targetEntity) {
        console.warn(`[GraphTraversal] Target entity not found: ${targetName}`);
        return [];
    }
    return findPaths(sourceEntity.id, targetEntity.id, relationshipStore, options);
}
/**
 * Get path description for answer synthesis
 *
 * Converts a path into human-readable text using entity names.
 *
 * @param path - The path to describe
 * @param entityStore - Entity store for name lookup
 * @returns Human-readable path description
 */
export function getPathDescription(path, entityStore) {
    if (path.segments.length === 0) {
        return "No connection found";
    }
    const parts = [];
    for (const segment of path.segments) {
        const sourceName = entityStore.getById(segment.source)?.name || segment.source;
        const targetName = entityStore.getById(segment.target)?.name || segment.target;
        const relationship = segment.type.replace(/_/g, ' ');
        parts.push(`${sourceName} ${relationship} ${targetName}`);
    }
    return parts.join(' → ');
}
/**
 * Get all paths between multiple entity pairs
 *
 * Useful for queries with multiple entities like "What connects A, B, and C?"
 *
 * @param entityNames - Array of entity names to find connections between
 * @param entityStore - Entity store
 * @param relationshipStore - Relationship store
 * @param options - Configuration options
 * @returns Map of entity pair -> paths
 */
export function findConnectionsBetweenEntities(entityNames, entityStore, relationshipStore, options = {}) {
    const connections = new Map();
    // Find paths between all pairs
    for (let i = 0; i < entityNames.length; i++) {
        for (let j = i + 1; j < entityNames.length; j++) {
            const sourceName = entityNames[i];
            const targetName = entityNames[j];
            const pairKey = `${sourceName} ↔ ${targetName}`;
            const paths = findPathsByName(sourceName, targetName, entityStore, relationshipStore, options);
            if (paths.length > 0) {
                connections.set(pairKey, paths);
            }
        }
    }
    return connections;
}
/**
 * Score a path by relevance
 *
 * Higher scores = more relevant paths.
 * Considers:
 * - Path length (shorter = better)
 * - Relationship confidence
 * - Entity mentions
 *
 * @param path - Path to score
 * @param relationshipStore - Relationship store for confidence lookup
 * @param entityStore - Entity store for mention lookup
 * @returns Score (higher = better)
 */
export function scorePath(path, relationshipStore, entityStore) {
    let score = 1.0;
    // 1. Path length penalty (exponential decay)
    // Shorter paths are more direct and better
    score *= Math.pow(0.7, path.length - 1);
    // 2. Relationship confidence
    for (const segment of path.segments) {
        const rels = relationshipStore.getBySource(segment.source);
        const matchingRel = rels.find(r => r.target === segment.target &&
            r.type === segment.type &&
            !r.supersededBy);
        if (matchingRel) {
            score *= matchingRel.confidence;
        }
    }
    // 3. Entity salience (average mentions)
    const entityIds = new Set();
    path.segments.forEach(s => {
        entityIds.add(s.source);
        entityIds.add(s.target);
    });
    let totalMentions = 0;
    for (const entityId of entityIds) {
        const entity = entityStore.getById(entityId);
        if (entity) {
            totalMentions += entity.mentions;
        }
    }
    // Logarithmic boost for more mentioned entities
    if (entityIds.size > 0) {
        const avgMentions = totalMentions / entityIds.size;
        score *= (Math.log10(avgMentions + 1) + 1);
    }
    return score;
}
/**
 * Sort paths by score (descending)
 *
 * @param paths - Paths to sort
 * @param relationshipStore - Relationship store
 * @param entityStore - Entity store
 * @returns Sorted paths (best first)
 */
export function rankPaths(paths, relationshipStore, entityStore) {
    return [...paths].sort((a, b) => {
        const scoreA = scorePath(a, relationshipStore, entityStore);
        const scoreB = scorePath(b, relationshipStore, entityStore);
        return scoreB - scoreA;
    });
}
//# sourceMappingURL=graph-traversal.js.map