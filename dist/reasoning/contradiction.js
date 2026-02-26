/**
 * Contradiction Detection and Temporal Reasoning
 * Detects when new information contradicts old, tracks temporal history
 */
/**
 * Check if a new relationship contradicts existing ones
 */
export function detectContradiction(relationshipStore, sourceEntityId, type, newValue) {
    // Get current (non-superseded) relationship
    const current = relationshipStore.getCurrent(sourceEntityId, type);
    if (!current)
        return null;
    // Check if values differ
    if (newValue && current.value !== newValue) {
        return current;
    }
    return null;
}
/**
 * Get all contradictions involving an entity
 */
export function getEntityContradictions(relationshipStore, entityStore, entityName) {
    const entity = entityStore.findEntity(entityName);
    if (!entity)
        return [];
    const contradictions = relationshipStore.getContradictions();
    return contradictions
        .filter(c => c.superseded.source === entity.id || c.superseded.target === entity.id)
        .map(c => ({
        current: c.current,
        superseded: c.superseded,
        timestamp: c.current.timestamp,
        sessionId: c.current.sessionId
    }));
}
/**
 * Get temporal history for an entity's relationship
 * Returns chronological list of all changes
 */
export function getTemporalHistory(relationshipStore, entityStore, entityName, relationshipType) {
    const entity = entityStore.findEntity(entityName);
    if (!entity)
        return [];
    const history = relationshipStore.getHistory(entity.id, relationshipType);
    const changes = [];
    let previousValue;
    for (const rel of history) {
        // Get the target entity name for context
        const targetEntity = entityStore.getById(rel.target);
        const targetName = targetEntity?.name || rel.target;
        if (rel.value !== previousValue) {
            changes.push({
                entity: targetName,
                relationshipType: rel.type,
                oldValue: previousValue,
                newValue: rel.value,
                timestamp: rel.timestamp,
                sessionId: rel.sessionId
            });
        }
        previousValue = rel.value;
    }
    return changes;
}
/**
 * Synthesize a temporal answer for a question about an entity
 */
export async function synthesizeTemporalAnswer(relationshipStore, entityStore, entityName, relationshipType) {
    const history = getTemporalHistory(relationshipStore, entityStore, entityName, relationshipType);
    if (history.length === 0) {
        return `No temporal history found for ${entityName}`;
    }
    // Format the timeline
    const timeline = history.map(h => {
        const when = new Date(h.timestamp).toLocaleDateString();
        const change = h.oldValue
            ? `changed from ${h.oldValue} to ${h.newValue}`
            : `set to ${h.newValue}`;
        return `- ${when} (${h.sessionId}): ${change}`;
    }).join('\n');
    return `Timeline for ${entityName}:\n${timeline}`;
}
/**
 * Synthesize a contradiction-aware answer
 */
export function synthesizeContradictionAnswer(relationshipStore, entityStore, entityName, question) {
    const entity = entityStore.findEntity(entityName);
    if (!entity) {
        return `Entity not found: ${entityName}`;
    }
    // Get current value
    const relationships = relationshipStore.getBySource(entity.id);
    const current = relationships.find(r => !r.supersededBy);
    if (!current) {
        return `No current relationship found for ${entityName}`;
    }
    // Get contradictions
    const contradictions = getEntityContradictions(relationshipStore, entityStore, entityName);
    const targetEntity = entityStore.getById(current.target);
    const targetName = targetEntity?.name || current.target;
    let answer = `Current value for ${entityName}: ${current.type} ${targetName}`;
    if (current.value) {
        answer += ` = ${current.value}`;
    }
    if (contradictions.length > 0) {
        answer += `\n\nHistorical changes:`;
        for (const c of contradictions) {
            const supersededTarget = entityStore.getById(c.superseded.target);
            answer += `\n- Previously: ${c.superseded.type} ${supersededTarget?.name || c.superseded.target}`;
            if (c.superseded.value) {
                answer += ` = ${c.superseded.value}`;
            }
            answer += ` (${new Date(c.superseded.timestamp).toLocaleDateString()})`;
        }
    }
    return answer;
}
/**
 * Get all superseded relationships for an entity
 */
export function getSupersededRelationships(relationshipStore, entityStore, entityName) {
    const entity = entityStore.findEntity(entityName);
    if (!entity)
        return [];
    const all = relationshipStore.getBySource(entity.id);
    return all.filter(r => r.supersededBy !== undefined);
}
/**
 * Check if a specific value is current (not superseded)
 */
export function isCurrentValue(relationshipStore, entityStore, entityName, relationshipType, value) {
    const entity = entityStore.findEntity(entityName);
    if (!entity)
        return false;
    const current = relationshipStore.getCurrent(entity.id, relationshipType);
    return current?.value === value;
}
/**
 * Get latest value with history
 */
export function getValueWithHistory(relationshipStore, entityStore, entityName, relationshipType) {
    const entity = entityStore.findEntity(entityName);
    if (!entity) {
        return { history: [] };
    }
    const history = relationshipStore.getHistory(entity.id, relationshipType);
    const result = {
        history: []
    };
    for (const rel of history) {
        if (rel.value) {
            result.history.push({
                value: rel.value,
                timestamp: rel.timestamp,
                superseded: rel.supersededBy !== undefined
            });
            if (!rel.supersededBy) {
                result.current = rel.value;
            }
        }
    }
    return result;
}
//# sourceMappingURL=contradiction.js.map