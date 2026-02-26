/**
 * Relationship Store for Knowledge Graph
 * Stores relationships with timestamps, sessionId, and contradiction tracking
 */
import { v4 as uuidv4 } from 'uuid';
export class RelationshipStore {
    db;
    constructor(db) {
        this.db = db;
        this.createTables();
    }
    createTables() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS kg_relationships (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        type TEXT NOT NULL,
        value TEXT,
        timestamp TEXT NOT NULL,
        session_id TEXT,
        confidence REAL DEFAULT 1.0,
        superseded_by TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_kg_rel_source ON kg_relationships(source);
      CREATE INDEX IF NOT EXISTS idx_kg_rel_target ON kg_relationships(target);
      CREATE INDEX IF NOT EXISTS idx_kg_rel_type ON kg_relationships(type);
      CREATE INDEX IF NOT EXISTS idx_kg_rel_timestamp ON kg_relationships(timestamp);
    `);
    }
    /**
     * Add a relationship
     * Returns the relationship and any superseded relationship
     */
    addRelationship(rel) {
        const id = `rel_${uuidv4().slice(0, 8)}`;
        // Check for contradictions (same source, type, different value, not already superseded)
        const conflicting = this.findContradiction(rel.source, rel.type, rel.value);
        let supersededBy;
        let supersededRel;
        if (conflicting) {
            // Mark the old relationship as superseded
            const updateStmt = this.db.prepare(`
        UPDATE kg_relationships SET superseded_by = ? WHERE id = ?
      `);
            updateStmt.run(id, conflicting.id);
            supersededBy = id;
            supersededRel = conflicting;
        }
        // Insert new relationship
        const stmt = this.db.prepare(`
      INSERT INTO kg_relationships (id, source, target, type, value, timestamp, session_id, confidence, superseded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, rel.source, rel.target, rel.type, rel.value || null, rel.timestamp, rel.sessionId || null, rel.confidence, supersededBy || null);
        return {
            relationship: this.getById(id),
            superseded: supersededRel
        };
    }
    /**
     * Find contradiction (same source, same type, different value, not superseded)
     */
    findContradiction(source, type, value) {
        if (!value)
            return null;
        const stmt = this.db.prepare(`
      SELECT * FROM kg_relationships 
      WHERE source = ? AND type = ? AND value != ? AND superseded_by IS NULL
      ORDER BY timestamp DESC
      LIMIT 1
    `);
        const row = stmt.get(source, type, value);
        if (!row)
            return null;
        return this.rowToRelationship(row);
    }
    /**
     * Get relationship by ID
     */
    getById(id) {
        const stmt = this.db.prepare('SELECT * FROM kg_relationships WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            return null;
        return this.rowToRelationship(row);
    }
    /**
     * Get relationships from a source entity
     */
    getBySource(sourceId) {
        const stmt = this.db.prepare('SELECT * FROM kg_relationships WHERE source = ? ORDER BY timestamp DESC');
        const rows = stmt.all(sourceId);
        return rows.map(row => this.rowToRelationship(row));
    }
    /**
     * Get relationships to a target entity
     */
    getByTarget(targetId) {
        const stmt = this.db.prepare('SELECT * FROM kg_relationships WHERE target = ? ORDER BY timestamp DESC');
        const rows = stmt.all(targetId);
        return rows.map(row => this.rowToRelationship(row));
    }
    /**
     * Get relationships by type
     */
    getByType(type) {
        const stmt = this.db.prepare('SELECT * FROM kg_relationships WHERE type = ? ORDER BY timestamp DESC');
        const rows = stmt.all(type);
        return rows.map(row => this.rowToRelationship(row));
    }
    /**
     * Get temporal history for an entity and relationship type
     * Returns all versions ordered chronologically
     */
    getHistory(sourceId, type) {
        let query = 'SELECT * FROM kg_relationships WHERE source = ?';
        const params = [sourceId];
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        query += ' ORDER BY timestamp ASC'; // Chronological order
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => this.rowToRelationship(row));
    }
    /**
     * Get current (non-superseded) relationship for entity + type
     */
    getCurrent(sourceId, type) {
        const stmt = this.db.prepare(`
      SELECT * FROM kg_relationships 
      WHERE source = ? AND type = ? AND superseded_by IS NULL
      ORDER BY timestamp DESC
      LIMIT 1
    `);
        const row = stmt.get(sourceId, type);
        if (!row)
            return null;
        return this.rowToRelationship(row);
    }
    /**
     * Get all relationships
     */
    getAll() {
        const stmt = this.db.prepare('SELECT * FROM kg_relationships ORDER BY timestamp DESC');
        const rows = stmt.all();
        return rows.map(row => this.rowToRelationship(row));
    }
    /**
     * Get relationships by session
     */
    getBySession(sessionId) {
        const stmt = this.db.prepare('SELECT * FROM kg_relationships WHERE session_id = ? ORDER BY timestamp DESC');
        const rows = stmt.all(sessionId);
        return rows.map(row => this.rowToRelationship(row));
    }
    /**
     * Find all active contradictions (relationships that have been superseded)
     */
    getContradictions() {
        const stmt = this.db.prepare(`
      SELECT r.*, s.value as superseded_value
      FROM kg_relationships r
      LEFT JOIN kg_relationships s ON r.superseded_by = s.id
      WHERE r.superseded_by IS NOT NULL
      ORDER BY r.timestamp DESC
    `);
        const rows = stmt.all();
        const contradictions = [];
        for (const row of rows) {
            const current = this.rowToRelationship(row);
            if (row.superseded_by) {
                const superseded = this.getById(row.superseded_by);
                if (superseded) {
                    contradictions.push({ current, superseded });
                }
            }
        }
        return contradictions;
    }
    /**
     * Get all superseded relationships
     */
    getSuperseded() {
        const stmt = this.db.prepare('SELECT * FROM kg_relationships WHERE superseded_by IS NOT NULL ORDER BY timestamp DESC');
        const rows = stmt.all();
        return rows.map(row => this.rowToRelationship(row));
    }
    rowToRelationship(row) {
        return {
            id: row.id,
            source: row.source,
            target: row.target,
            type: row.type,
            value: row.value,
            timestamp: row.timestamp,
            sessionId: row.session_id,
            confidence: row.confidence,
            supersededBy: row.superseded_by
        };
    }
}
//# sourceMappingURL=relationship-store.js.map