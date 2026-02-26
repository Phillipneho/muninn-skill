/**
 * Graph Traversal for Knowledge Graph
 * BFS for multi-hop connections with path ranking
 */

import { RelationshipStore, Relationship, RelationshipType } from '../storage/relationship-store.js';
import { EntityStore, Entity } from '../storage/entity-store.js';

export interface Path {
  entities: string[];      // Entity IDs in path
  relationships: string[]; // Relationship IDs in path
  hops: number;
  relevance: number;
}

export interface GraphTraversalOptions {
  maxHops?: number;
  includeSuperseded?: boolean; // Include superseded relationships
  relationshipTypes?: RelationshipType[]; // Filter by types
}

/**
 * Find all paths between two entities using BFS
 */
export function findPaths(
  entityStore: EntityStore,
  relationshipStore: RelationshipStore,
  fromEntityName: string,
  toEntityName: string,
  options: GraphTraversalOptions = {}
): Path[] {
  const maxHops = options.maxHops || 3;
  const includeSuperseded = options.includeSuperseded ?? false;
  
  const fromEntity = entityStore.findEntity(fromEntityName);
  const toEntity = entityStore.findEntity(toEntityName);
  
  if (!fromEntity || !toEntity) {
    return [];
  }
  
  const paths: Path[] = [];
  const visited = new Set<string>();
  
  // BFS queue: { entityId, path, relPath }
  interface BFSNode {
    entityId: string;
    path: string[];
    relPath: string[];
  }
  
  const queue: BFSNode[] = [{
    entityId: fromEntity.id,
    path: [fromEntity.id],
    relPath: []
  }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Check if we reached the target
    if (current.entityId === toEntity.id && current.path.length > 1) {
      paths.push({
        entities: current.path,
        relationships: current.relPath,
        hops: current.path.length - 1,
        relevance: calculatePathRelevance(current.path, current.relPath, relationshipStore)
      });
      continue;
    }
    
    // Stop if max hops reached
    if (current.path.length >= maxHops + 1) continue;
    
    // Get neighbors (outgoing relationships)
    const relationships = relationshipStore.getBySource(current.entityId);
    
    // Filter relationships
    const filtered = relationships.filter(r => {
      if (!includeSuperseded && r.supersededBy) return false;
      if (options.relationshipTypes && !options.relationshipTypes.includes(r.type)) return false;
      return true;
    });
    
    for (const rel of filtered) {
      if (!visited.has(rel.target)) {
        queue.push({
          entityId: rel.target,
          path: [...current.path, rel.target],
          relPath: [...current.relPath, rel.id]
        });
      }
    }
    
    // Also check incoming relationships
    const incoming = relationshipStore.getByTarget(current.entityId);
    const filteredIncoming = incoming.filter(r => {
      if (!includeSuperseded && r.supersededBy) return false;
      if (options.relationshipTypes && !options.relationshipTypes.includes(r.type)) return false;
      return true;
    });
    
    for (const rel of filteredIncoming) {
      if (!visited.has(rel.source)) {
        queue.push({
          entityId: rel.source,
          path: [...current.path, rel.source],
          relPath: [...current.relPath, rel.id]
        });
      }
    }
  }
  
  // Sort by relevance (shorter paths with higher confidence first)
  paths.sort((a, b) => {
    if (a.hops !== b.hops) return a.hops - b.hops;
    return b.relevance - a.relevance;
  });
  
  return paths.slice(0, 10); // Return top 10 paths
}

/**
 * Calculate path relevance score
 */
function calculatePathRelevance(
  entityPath: string[],
  relationshipPath: string[],
  relationshipStore: RelationshipStore
): number {
  if (relationshipPath.length === 0) return 0;
  
  let totalConfidence = 0;
  for (const relId of relationshipPath) {
    const rel = relationshipStore.getById(relId);
    if (rel) {
      totalConfidence += rel.confidence;
    }
  }
  
  const avgConfidence = totalConfidence / relationshipPath.length;
  
  // Prefer shorter paths
  const hopPenalty = entityPath.length * 0.1;
  
  return Math.max(0, avgConfidence - hopPenalty);
}

/**
 * Get all entities connected to a given entity
 */
export function getConnectedEntities(
  entityStore: EntityStore,
  relationshipStore: RelationshipStore,
  entityName: string,
  options: GraphTraversalOptions = {}
): Entity[] {
  const entity = entityStore.findEntity(entityName);
  if (!entity) return [];
  
  const connectedIds = new Set<string>();
  
  // Get outgoing
  const outgoing = relationshipStore.getBySource(entity.id);
  for (const rel of outgoing) {
    if (!rel.supersededBy || options.includeSuperseded) {
      connectedIds.add(rel.target);
    }
  }
  
  // Get incoming
  const incoming = relationshipStore.getByTarget(entity.id);
  for (const rel of incoming) {
    if (!rel.supersededBy || options.includeSuperseded) {
      connectedIds.add(rel.source);
    }
  }
  
  // Convert IDs to entities
  const connected: Entity[] = [];
  for (const id of connectedIds) {
    const e = entityStore.getById(id);
    if (e) connected.push(e);
  }
  
  return connected;
}

/**
 * Get all relationships for an entity (both as source and target)
 */
export function getEntityRelationships(
  entityStore: EntityStore,
  relationshipStore: RelationshipStore,
  entityName: string,
  options: GraphTraversalOptions = {}
): Relationship[] {
  const entity = entityStore.findEntity(entityName);
  if (!entity) return [];
  
  const relationships: Relationship[] = [];
  
  // Get outgoing
  const outgoing = relationshipStore.getBySource(entity.id);
  for (const rel of outgoing) {
    if (!rel.supersededBy || options.includeSuperseded) {
      relationships.push(rel);
    }
  }
  
  // Get incoming
  const incoming = relationshipStore.getByTarget(entity.id);
  for (const rel of incoming) {
    if (!rel.supersededBy || options.includeSuperseded) {
      relationships.push(rel);
    }
  }
  
  return relationships;
}

/**
 * Find entities by relationship pattern
 */
export function findEntitiesByRelationship(
  entityStore: EntityStore,
  relationshipStore: RelationshipStore,
  relationshipType: RelationshipType,
  value?: string
): Entity[] {
  const relationships = value 
    ? relationshipStore.getByType(relationshipType).filter(r => r.value === value)
    : relationshipStore.getByType(relationshipType);
  
  const entityIds = new Set<string>();
  for (const rel of relationships) {
    if (!rel.supersededBy) {
      entityIds.add(rel.source);
    }
  }
  
  const entities: Entity[] = [];
  for (const id of entityIds) {
    const entity = entityStore.getById(id);
    if (entity) entities.push(entity);
  }
  
  return entities;
}

/**
 * Get timeline of an entity's relationships
 */
export function getEntityTimeline(
  entityStore: EntityStore,
  relationshipStore: RelationshipStore,
  entityName: string,
  relationshipType?: RelationshipType
): { relationship: Relationship; entity: Entity }[] {
  const entity = entityStore.findEntity(entityName);
  if (!entity) return [];
  
  // Get all relationships ordered by timestamp
  const history = relationshipStore.getHistory(entity.id, relationshipType);
  
  const timeline: { relationship: Relationship; entity: Entity }[] = [];
  
  for (const rel of history) {
    // Get the other entity in the relationship
    const otherId = rel.source === entity.id ? rel.target : rel.source;
    const otherEntity = entityStore.getById(otherId);
    
    if (otherEntity) {
      timeline.push({
        relationship: rel,
        entity: otherEntity
      });
    }
  }
  
  return timeline;
}
