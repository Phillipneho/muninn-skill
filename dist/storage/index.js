/**
 * OpenClaw Memory System v1
 * Storage Layer - SQLite + Vector Search
 *
 * Local-first, Ollama-compatible memory system
 * Forked from Engram patterns, optimized for OpenClaw
 */
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { createAliasStore } from '../extractors/normalize.js';
import { EntityStore } from './entity-store.js';
import { RelationshipStore } from './relationship-store.js';
// Alias store for spelling variants and entity aliases
let aliasStore = null;
function getAliasStore() {
    if (!aliasStore) {
        aliasStore = createAliasStore();
    }
    return aliasStore;
}
// ============================================================================
// ENTITY EXTRACTION (simple version for storage)
// ============================================================================
function extractEntitiesFromText(text) {
    const entities = [];
    // Hardcoded patterns for known entities
    const patterns = [
        'Phillip', 'KakāpōHiko', 'Kakāpō', 'Hiko',
        'Elev8Advisory', 'BrandForge', 'Muninn', 'OpenClaw',
        'Sammy Clemens', 'Charlie Babbage', 'Donna Paulsen',
        'Brisbane', 'Australia', 'React', 'Node.js', 'PostgreSQL',
        'SQLite', 'Ollama', 'Stripe', 'LGBTQ'
    ];
    for (const p of patterns) {
        if (text.toLowerCase().includes(p.toLowerCase())) {
            entities.push(p);
        }
    }
    // Common words to exclude
    const excludeWords = new Set([
        'The', 'This', 'That', 'It', 'He', 'She', 'They', 'We', 'I', 'You',
        'What', 'When', 'Where', 'Why', 'How', 'Is', 'Are', 'Was', 'Were',
        'Have', 'Has', 'Had', 'Do', 'Does', 'Did', 'Can', 'Could', 'Would',
        'Should', 'Will', 'Going', 'Yes', 'No', 'Okay', 'Ok', 'So', 'But',
        'And', 'Or', 'If', 'Then', 'Now', 'Just', 'Well', 'Oh', 'Hi', 'Hello',
        'Hey', 'Thanks', 'Thank', 'Wow', 'Good', 'Bad', 'Nice', 'Great', 'Cool',
        'Yeah', 'Yep', 'Nope', 'Sure', 'Right', 'Left', 'First', 'Second', 'Third',
        'Last', 'Next', 'Other', 'Another', 'Same', 'Different', 'New', 'Old',
        'Big', 'Small', 'Long', 'Short', 'High', 'Low', 'Early', 'Late',
        'Today', 'Tomorrow', 'Yesterday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday', 'Sunday', 'Taking', 'Anything', 'Mel'
    ]);
    // Pattern 1: Names at start of sentence or followed by colon (dialogue)
    // "Caroline: I went..." or "Caroline went to..."
    const nameAtStart = /(?:^|[.!?]\s+)([A-Z][a-z]{2,})(?:\s*:|\s+[a-z])/gm;
    let match;
    while ((match = nameAtStart.exec(text)) !== null) {
        if (!excludeWords.has(match[1])) {
            entities.push(match[1]);
        }
    }
    // Pattern 2: Names after prepositions (with, by, from, to)
    const afterPrep = /(?:with|by|from|to)\s+([A-Z][a-z]{2,})\b/gi;
    while ((match = afterPrep.exec(text)) !== null) {
        if (!excludeWords.has(match[1])) {
            entities.push(match[1]);
        }
    }
    // Pattern 3: Names in direct address (", Name" or "Name,")
    const directAddress = /,\s*([A-Z][a-z]{2,})\b|\b([A-Z][a-z]{2,})\s*,/g;
    while ((match = directAddress.exec(text)) !== null) {
        const name = match[1] || match[2];
        if (name && !excludeWords.has(name)) {
            entities.push(name);
        }
    }
    // Pattern 4: Names before relationship verbs
    const beforeVerb = /\b([A-Z][a-z]{2,})\s+(?:went|is|knows|likes|works|plans|has|said|told|asked|called|visited|met)\b/gi;
    while ((match = beforeVerb.exec(text)) !== null) {
        if (!excludeWords.has(match[1])) {
            entities.push(match[1]);
        }
    }
    // Deduplicate
    return [...new Set(entities)];
}
// ============================================================================
// TEMPORAL QUERY PARSER
// ============================================================================
/**
 * Parse natural language time references into date ranges
 * Supports: "yesterday", "last Tuesday", "last week", "this morning", etc.
 */
function parseTemporalQuery(last) {
    const now = new Date();
    const lower = last.toLowerCase().trim();
    // Get day of week (0 = Sunday)
    const dayOfWeek = now.getDay();
    switch (lower) {
        case 'yesterday': {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            const endOfYesterday = new Date(yesterday);
            endOfYesterday.setHours(23, 59, 59, 999);
            return { start: yesterday, end: endOfYesterday };
        }
        case 'today': {
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date(now);
            return { start: startOfToday, end: endOfToday };
        }
        case 'this morning': {
            const startOfMorning = new Date(now);
            startOfMorning.setHours(0, 0, 0, 0);
            const endOfMorning = new Date(now);
            endOfMorning.setHours(12, 0, 0, 0);
            return { start: startOfMorning, end: endOfMorning };
        }
        case 'this afternoon': {
            const startOfAfternoon = new Date(now);
            startOfAfternoon.setHours(12, 0, 0, 0);
            const endOfAfternoon = new Date(now);
            endOfAfternoon.setHours(18, 0, 0, 0);
            return { start: startOfAfternoon, end: endOfAfternoon };
        }
        case 'this week': {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);
            return { start: startOfWeek, end: now };
        }
        case 'last week': {
            const startOfLastWeek = new Date(now);
            startOfLastWeek.setDate(now.getDate() - dayOfWeek - 7);
            startOfLastWeek.setHours(0, 0, 0, 0);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            endOfLastWeek.setHours(23, 59, 59, 999);
            return { start: startOfLastWeek, end: endOfLastWeek };
        }
        case 'this month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: startOfMonth, end: now };
        }
        case 'last month': {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return { start: startOfLastMonth, end: endOfLastMonth };
        }
        default: {
            // Handle "last Tuesday", "last Friday", etc.
            const dayMatch = lower.match(/^last\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
            if (dayMatch) {
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const targetDay = dayNames.indexOf(dayMatch[1]);
                // Calculate days ago to reach target day
                let daysAgo = dayOfWeek - targetDay;
                if (daysAgo <= 0)
                    daysAgo += 7; // Go back one week if today or in future
                const targetDate = new Date(now);
                targetDate.setDate(now.getDate() - daysAgo);
                targetDate.setHours(0, 0, 0, 0);
                const endOfTarget = new Date(targetDate);
                endOfTarget.setHours(23, 59, 59, 999);
                return { start: targetDate, end: endOfTarget };
            }
            // Handle "X days ago"
            const daysAgoMatch = lower.match(/^(\d+)\s+days?\s+ago$/);
            if (daysAgoMatch) {
                const days = parseInt(daysAgoMatch[1]);
                const start = new Date(now);
                start.setDate(now.getDate() - days);
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setHours(23, 59, 59, 999);
                return { start, end };
            }
            // Handle "X weeks ago"
            const weeksAgoMatch = lower.match(/^(\d+)\s+weeks?\s+ago$/);
            if (weeksAgoMatch) {
                const weeks = parseInt(weeksAgoMatch[1]);
                const start = new Date(now);
                start.setDate(now.getDate() - (weeks * 7));
                start.setHours(0, 0, 0, 0);
                return { start, end: now };
            }
            // Could not parse
            console.warn(`Could not parse temporal query: "${last}"`);
            return null;
        }
    }
}
/**
 * Expand query with spelling variants (UK↔US English)
 */
function expandQueryWithVariants(query) {
    const expandedQueries = [query];
    // Common spelling variants to check
    const variantPairs = [
        ['colour', 'color'],
        ['flavour', 'flavor'],
        ['honour', 'honor'],
        ['organise', 'organize'],
        ['realise', 'realize'],
        ['recognise', 'recognize'],
        ['analyse', 'analyze'],
        ['centre', 'center'],
        ['theatre', 'theater'],
        ['defence', 'defense'],
        ['offence', 'offense'],
        ['licence', 'license'],
        ['programme', 'program'],
        ['behaviour', 'behavior'],
    ];
    for (const [uk, us] of variantPairs) {
        // If query contains UK form, add US version
        if (query.toLowerCase().includes(uk)) {
            expandedQueries.push(query.replace(new RegExp(uk, 'gi'), us));
        }
        // If query contains US form, add UK version  
        if (query.toLowerCase().includes(us)) {
            expandedQueries.push(query.replace(new RegExp(us, 'gi'), uk));
        }
    }
    return [...new Set(expandedQueries)];
}
// Embedding function using Ollama (all-minilm for speed)
export async function generateEmbedding(text) {
    const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'all-minilm',
            prompt: text
        })
    });
    if (!response.ok) {
        throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.embedding;
}
// Cosine similarity
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
export class MemoryStore {
    db;
    entityStore;
    relationshipStore;
    constructor(dbPath) {
        const defaultPath = path.join(process.cwd(), 'openclaw-memory.db');
        this.db = new Database(dbPath || defaultPath);
        this.entityStore = new EntityStore(this.db);
        this.relationshipStore = new RelationshipStore(this.db);
        this.init();
    }
    /**
     * Get the entity store for direct access
     */
    getEntityStore() {
        return this.entityStore;
    }
    /**
     * Get the relationship store for direct access
     */
    getRelationshipStore() {
        return this.relationshipStore;
    }
    init() {
        // Enable vector similarity search using simple implementation
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('episodic', 'semantic', 'procedural')),
        content TEXT NOT NULL,
        resolved_content TEXT,
        coreference_map TEXT,
        title TEXT,
        summary TEXT,
        entities TEXT DEFAULT '[]',
        topics TEXT DEFAULT '[]',
        embedding BLOB,
        salience REAL DEFAULT 0.5,
        timestamp TEXT,
        session_id TEXT,
        ttl INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      );
      
      CREATE TABLE IF NOT EXISTS entities (
        name TEXT PRIMARY KEY,
        memory_count INTEGER DEFAULT 0,
        last_seen TEXT DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS edges (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relationship TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (source_id) REFERENCES memories(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES memories(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS procedures (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        steps TEXT DEFAULT '[]',
        version INTEGER DEFAULT 1,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        is_reliable INTEGER DEFAULT 0,
        evolution_log TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
      CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);
      CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
      CREATE INDEX IF NOT EXISTS idx_memories_deleted ON memories(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
      CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
    `);
        console.log('📦 Memory database initialized');
    }
    // Memory CRUD
    async remember(content, type = 'semantic', options = {}) {
        const id = `m_${uuidv4().slice(0, 8) `;
    const now = new Date().toISOString();
    // Use provided timestamp or default to now
    const timestamp = options.timestamp || now;
    
    // ========================================================================
    // PHASE 1.6: TEMPORAL RESOLUTION
    // Resolve relative dates (yesterday, next week, etc.) using session date
    // ========================================================================
    
    let resolvedContent = content;
    let temporalMeta: TemporalMetadata | null = null;
    
    // Extract temporal metadata using session date as reference
    temporalMeta = extractTemporalMetadata(content, options.sessionDate || timestamp);
    
    // If we resolved a date, enrich the content for better retrieval
    if (temporalMeta?.eventTime && temporalMeta.confidence > 0.5) {
      // Replace relative expressions with ISO dates in a natural way
      // "yesterday I went..." → "On 2023-05-07 I went..."
      const relativePatterns = [
        /\byesterday\b/gi,
        /\btoday\b/gi,
        /\btomorrow\b/gi,
        /last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year)/gi,
        /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year)/gi,
        /in\s+(?:a\s+)?(?:\d+\s+)?(?:day|days|week|weeks|month|months|year|years|fortnight)/gi,
        /(?:\d+\s+)?(?:day|days|week|weeks|month|months|year|years)\s+(?:ago|from now)/gi
      ];
      
      // Prepend resolved date for retrieval (keep original for context)
      for (const pattern of relativePatterns) {
        if (pattern.test(content)) {
          resolvedContent = '[' + temporalMeta.eventTime + '] ' + content;
          break;
        }
      }
    }
    
    // Generate embedding from resolved content (better for semantic search)
    const embedding = await generateEmbedding(resolvedContent);
    
    // ========================================================================
    // PHASE 1.4: ENTITY NORMALIZATION
    // ========================================================================
    
    // Extract entities if not provided
    const extractedEntities = options.entities || extractEntitiesFromText(content);
    
    // Create properly typed entities for normalization
    const entitiesForNormalization = extractedEntities.map(e => ({
      text: e,
      type: 'concept' as const,
      confidence: 0.8,
      context: '',
    }));
    
    // Normalize entities and store aliases
    const normalized = await normalizeEntities(content, entitiesForNormalization);
    
    // Store aliases for retrieval
    const aliasStore = getAliasStore();
    for (const norm of normalized) {
      for (const alias of norm.aliases) {
        aliasStore.addAlias(norm.canonical, alias);
      }
    }
    
    // Get canonical entity names
    const canonicalEntities = [...new Set(normalized.map(n => n.canonical))];
    
    // Add normalized entities to coreference cache (for query-time resolution)
    for (const norm of normalized) {
      addToEntityCache(norm.canonical, norm.aliases, 'person');
    }
    
    // NOTE: Coreference resolution moved to query-time (see recallWithExpansion)
    // This avoids LLM calls during storage, making ingestion instant
    
    // Convert embedding to base64 for storage
    const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
    
    const sql = 'INSERT INTO memories (id, type, content, resolved_content, title, summary, entities, topics, embedding, salience, timestamp, session_id, ttl, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const stmt = this.db.prepare(sql);
    
    stmt.run(
      id,
      type,
      content,
      resolvedContent !== content ? resolvedContent : null,  // Store resolved content if different
      options.title || null,
      options.summary || null,
      JSON.stringify(canonicalEntities),
      JSON.stringify(options.topics || []),
      embeddingBuffer,
      options.salience || 0.5,
      timestamp,
      options.sessionId || null,
      options.ttl || null,
      now,
      now
    );
    
    // Update entity counts (use canonical names)
    if (canonicalEntities.length) {
      const entityStmt = this.db.prepare(`;
        INSERT;
        INTO;
        entities(name, memory_count, last_seen);
        VALUES(1);
        ON;
        CONFLICT(name);
        DO;
        UPDATE;
        SET;
        memory_count = memory_count + 1,
            last_seen =  ?
                `);
      
      for (const entity of canonicalEntities) {
        entityStmt.run(entity, now, now);
      }
    }
    
    // ========================================================================
    // PHASE 1.5: KNOWLEDGE GRAPH - Extract and store relationships
    // ========================================================================
    
    // Infer entity types and add to knowledge graph
    for (const entityName of canonicalEntities) {
      const entityType = inferEntityType(entityName);
      this.entityStore.addEntity({
        name: entityName,
        type: entityType as EntityType,
        aliases: normalized
          .find(n => n.canonical === entityName)
          ?.aliases.filter(a => a !== entityName) || []
      });
    }
    
    // Extract relationships from content
    const extractedRels = extractRelationships(content, new Map());
    
    // Store extracted relationships
    for (const rel of extractedRels) {
      // Resolve source entity
      const sourceEntity = this.entityStore.findEntity(rel.source);
      
      if (sourceEntity) {
        // For value-based relationships (has_target, has_customer), 
        // use the value as the target identifier
        const targetId = rel.value ? ` : ;
        value_$;
        {
            rel.value.replace(/[^a-z0-9]/gi, '_');
        }
        ` : rel.target;
        
        this.relationshipStore.addRelationship({
          source: sourceEntity.id,
          target: targetId,
          type: rel.type as RelationshipType,
          value: rel.value,
          timestamp: timestamp,
          sessionId: options.sessionId || '',
          confidence: rel.confidence
        });
      }
    }
    
    return this.getMemory(id)!;
  }
  
  getMemory(id: string): Memory | null {
    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ? AND deleted_at IS NULL');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      ...row,
      resolvedContent: row.resolved_content,
      coreferenceMap: JSON.parse(row.coreference_map || '{}'),
      entities: JSON.parse(row.entities || '[]'),
      topics: JSON.parse(row.topics || '[]'),
      embedding: Array.from(new Float32Array(row.embedding?.buffer || new ArrayBuffer(0)))
    };
  }
  
  async recall(
    context: string,
    options: RecallOptions = {}
  ): Promise<Memory[]> {
    const limit = options.limit || 10;
    
    // ========================================================================
    // QUERY-TIME EXPANSION: Resolve pronouns from conversation context
    // ========================================================================
    
    let expandedContext = context;
    let expandedEntities: string[] = [];
    
    if (options.recentTurns && options.recentTurns.length > 0) {
      // Build context from recent turns
      const contextText = options.recentTurns.map((t: { text: string; speaker?: string }) => t.text).join(' ');
      const contextEntities = extractEntitiesFromText(contextText);
      
      // Try to resolve pronouns in the query
      const pronouns = ['he', 'she', 'they', 'it', 'him', 'her', 'them', 'his', 'hers', 'their'];
      const lowerContext = context.toLowerCase();
      const foundPronouns = pronouns.filter(p => lowerContext.includes(p));
      
      // Get aliases for entities found in context
      const aliasStore = getAliasStore();
      for (const entity of contextEntities) {
        const aliases = aliasStore.getAliases(entity);
        if (aliases.length > 0) {
          expandedEntities.push(entity, ...aliases);
        }
      }
      
      // If pronouns found, expand search terms
      if (foundPronouns.length > 0 && contextEntities.length > 0) {
        // Use first entity as most likely referent (simple heuristic)
        // TODO: Use LLM for more accurate resolution
        const likelyEntity = contextEntities[0];
        expandedEntities.push(likelyEntity);
        expandedContext = `;
        $;
        {
            context;
        }
        $;
        {
            likelyEntity;
        }
        `;
      }
    }
    
    // Get all non-deleted memories
    let memories = this.db.prepare(`;
        SELECT * FROM;
        memories;
        WHERE;
        deleted_at;
        IS;
        NULL `).all() as any[];
    
    // Parse stored fields
    memories = memories.map(row => ({
      ...row,
      entities: JSON.parse(row.entities || '[]'),
      topics: JSON.parse(row.topics || '[]'),
      embedding: Array.from(new Float32Array(row.embedding?.buffer || new ArrayBuffer(0))),
      sessionId: row.session_id // Map DB column to camelCase
    }));
    
    // Filter by type
    if (options.types?.length) {
      memories = memories.filter(m => options.types!.includes(m.type));
    }
    
    // Filter by entities
    if (options.entities?.length) {
      memories = memories.filter(m => 
        options.entities!.some(e => m.entities.includes(e))
      );
    }
    
    // ========================================================================
    // PHASE 1.5: TEMPORAL FILTERING - Only apply when explicitly requested
    // ========================================================================
    
    let timeRange = options.timeRange;
    let sessionId = options.sessionId;
    
    // Parse natural language time references if provided
    if (options.last) {
      const parsed = parseTemporalQuery(options.last);
      if (parsed) {
        timeRange = parsed;
      }
    }
    
    // Filter by session ID if requested
    if (sessionId) {
      memories = memories.filter(m => m.sessionId === sessionId);
    }
    
    // Filter by time range if explicitly requested
    if (timeRange) {
      const start = new Date(timeRange.start).getTime();
      const end = new Date(timeRange.end).getTime();
      memories = memories.filter(m => {
        const memTime = m.timestamp ? new Date(m.timestamp).getTime() : new Date(m.created_at).getTime();
        return memTime >= start && memTime <= end;
      });
    }
    
    // If too few memories, fall back to simple similarity
    if (memories.length < 3) {
      return this.simpleRecall(context, limit);
    }
    
    // ========================================================================
    // PHASE 1.4: HYBRID RETRIEVAL + TYPE-AWARE FILTERING
    // ========================================================================
    
    // Detect temporal/contradiction queries and auto-augment with KG
    const isTemporalQuery = /change|over time|history|evolve|previous|earlier|originally|started|reduced|increased|updated/i.test(context);
    const isContradictionQuery = /current|now|latest|was|changed|rebalanced|updated|previously|target/i.test(context);
    
    let kgContext = '';
    if (isTemporalQuery || isContradictionQuery) {
      const queryEntities = extractEntitiesFromText(context);
      
      // Detect relationship type from query
      let relType: RelationshipType | undefined;
      if (/revenue|target|goal/i.test(context)) {
        relType = 'has_target';
      } else if (/customer|paying/i.test(context)) {
        relType = 'has_customer';
      } else if (/priority|focus/i.test(context)) {
        relType = 'has_priority';
      }
      
      for (const entityName of queryEntities) {
        const entity = this.entityStore.findEntity(entityName);
        if (entity) {
          const history = getValueWithHistory(this.relationshipStore, this.entityStore, entityName, relType);
          if (history.history.length > 0) {
            const timeline = history.history.map(h => {
              const when = new Date(h.timestamp).toLocaleDateString();
              const status = h.superseded ? '(was)' : '(current)';
              return `;
        $;
        {
            when;
        }
        $;
        {
            h.value;
        }
        $;
        {
            status;
        }
        `;
            }).join('\n');
            kgContext += `;
        n[KG];
        $;
        {
            entityName;
        }
        n$;
        {
            timeline;
        }
        n `;
          }
        }
      }
    }
    
    try {
      // Detect factual questions that should prioritize semantic memories
      // Expanded keyword list for better detection
      const isFactualQuery = /^(what|who|which|when|where|how (does|do|is|did|can|was|were)|why|whose)/i.test(context) ||
        /name|called|mean|stand for|relationship|port|model|database|stack|agents?|team|projects?|revenue|target|priority|embedding|spelling/i.test(context);
      
      // For factual questions, prioritize semantic memories first
      if (isFactualQuery && !options.types) {
        const semanticOnly = memories.filter(m => m.type === 'semantic' && (m.salience || 0.5) >= 0.5);
        if (semanticOnly.length > 0) {
          let semanticResults = await this.recallInternal(context, semanticOnly, limit, options);
          
          // Augment with KG context if available
          if (kgContext && semanticResults.length > 0) {
            // Add KG context to the first memory's content
            semanticResults = semanticResults.map((m, i) => ({
              ...m,
              content: i === 0 ? m.content + kgContext : m.content
            }));
          }
          
          // If we got good results from semantic, return them
          if (semanticResults.length > 0) {
            return semanticResults;
          }
        }
        // Fallback: if semantic returned nothing, try all memories with hybrid
        // Don't return empty - try the full set
      }
      
      let results = await this.recallInternal(context, memories, limit, options);
      
      // Augment with KG context
      if (kgContext && results.length > 0) {
        results = results.map((m, i) => ({
          ...m,
          content: i === 0 ? m.content + kgContext : m.content
        }));
      }
      
      // ========================================================================
      // P7.1: SPREADING ACTIVATION - Expand results via knowledge graph
      // ========================================================================
      if (options.enableSpreading && results.length > 0) {
        try {
          results = await spreadActivation(
            results,
            this.relationshipStore,
            this.entityStore,
            memories,
            { maxHops: 2, decayFactor: 0.5, maxNeighbors: 10, minActivation: 0.25 }
          );
        } catch (error) {
          console.warn('[SpreadingActivation] Failed, using initial results:', error);
        }
      }
      
      return results;
    } catch (error) {
      console.warn('Hybrid retrieval failed, using fallback:', error);
      return this.simpleRecall(context, limit);
    }
  }
  
  /**
   * Enhanced recall with knowledge graph for temporal and contradiction queries
   */
  async enhancedRecall(
    context: string,
    options: RecallOptions = {}
  ): Promise<{ memories: Memory[]; temporalContext?: string }> {
    // First do regular recall
    const memories = await this.recall(context, options);
    
    // Check if this is a temporal or contradiction question
    const isTemporalQuery = /change|over time|history|evolve|previous|earlier|originally|started|reduced|increased|updated/i.test(context);
    const isContradictionQuery = /current|now|latest|was|changed|rebalanced|updated|previously/i.test(context);
    
    let temporalContext: string | undefined;
    
    if (isTemporalQuery || isContradictionQuery) {
      // Extract entity from query (simplified - look for known entities)
      const queryEntities = extractEntitiesFromText(context);
      
      for (const entityName of queryEntities) {
        const entity = this.entityStore.findEntity(entityName);
        if (entity) {
          // Get full temporal history
          const history = this.getEntityHistory(entityName);
          
          if (history.length > 0) {
            // Format the timeline
            const timeline = history.map(h => {
              const when = new Date(h.timestamp).toLocaleDateString();
              const status = h.superseded ? '(superseded)' : '(current)';
              return `;
        $;
        {
            when;
        }
        $;
        {
            h.value;
        }
        $;
        {
            status;
        }
        `;
            }).join('\n');
            
            temporalContext = `;
        Knowledge;
        Graph;
        History;
        for ($; { entityName }; )
            : ;
        n$;
        {
            timeline;
        }
        `;
          }
        }
      }
    }
    
    return { memories, temporalContext };
  }
  
  /**
   * Internal recall with hybrid search
   */
  private async recallInternal(context: string, memories: Memory[], limit: number, options: RecallOptions = {}): Promise<Memory[]> {
    try {
      // 1. Expand query with spelling variants (UK↔US)
      const expandedQueries = expandQueryWithVariants(context);
      
      // 2. Extract entities from query for boosting
      const queryEntities = extractEntitiesFromText(context);
      
      // 3. Run hybrid search with BM25 + semantic
      let candidates = await hybridSearch(context, memories, { 
        k: limit * 3,
        enableLLMFilter: false,
        enableTemporalDecay: options.enableTemporalDecay,
        temporalHalfLifeDays: options.temporalHalfLifeDays,
        entityStore: this.entityStore,
        relationshipStore: this.relationshipStore
      });
      
      // 4. Also search with expanded queries and merge results
      for (const expandedQuery of expandedQueries.slice(1)) {
        const expandedResults = await hybridSearch(expandedQuery, memories, { 
          k: limit * 2,
          enableLLMFilter: false,
          enableTemporalDecay: options.enableTemporalDecay,
          temporalHalfLifeDays: options.temporalHalfLifeDays,
          entityStore: this.entityStore,
          relationshipStore: this.relationshipStore
        });
        
        // Merge unique results
        const existingIds = new Set(candidates.map(m => m.id));
        for (const m of expandedResults) {
          if (!existingIds.has(m.id)) {
            candidates.push(m);
          }
        }
      }
      
      // 5. Boost by entity overlap
      if (queryEntities.length > 0) {
        for (const c of candidates) {
          const memoryEntities = c.entities || [];
          const overlap = memoryEntities.filter((e: string) => 
            queryEntities.some((qe: string) => e.toLowerCase() === qe.toLowerCase())
          );
          if (overlap.length > 0) {
            (c as any)._entityBoost = 1 + (overlap.length * 0.5); // 50% boost per matching entity
          }
        }
      }
      
      // 6. Re-sort with entity boost
      candidates.sort((a, b) => {
        const scoreA = (a as any)._finalScore || (a as any)._rrfScore || 0;
        const scoreB = (b as any)._finalScore || (b as any)._rrfScore || 0;
        const boostA = (a as any)._entityBoost || 1;
        const boostB = (b as any)._entityBoost || 1;
        return (scoreB * boostB) - (scoreA * boostA);
      });
      
      // 7. Apply question-type specific scoring (temporal/contradiction handling)
      const scored = scoreForQuestionType(candidates.slice(0, limit), context);
      
      return scored;
    } catch (error) {
      console.warn('Recall internal failed:', error);
      return [];
    }
  }
  
  /**
   * Simple semantic recall fallback
   */
  private async simpleRecall(context: string, limit: number): Promise<Memory[]> {
    const queryEmbedding = await generateEmbedding(context);
    
    let memories = this.db.prepare(`;
        SELECT * FROM;
        memories;
        WHERE;
        deleted_at;
        IS;
        NULL `).all() as any[];
    
    memories = memories.map(row => ({
      ...row,
      entities: JSON.parse(row.entities || '[]'),
      topics: JSON.parse(row.topics || '[]'),
      embedding: Array.from(new Float32Array(row.embedding?.buffer || new ArrayBuffer(0)))
    }));
    
    const scored = memories.map(m => ({
      ...m,
      _similarity: m.embedding.length > 0 ? cosineSimilarity(queryEmbedding, m.embedding) : 0
    }));
    
    scored.sort((a, b) => b._similarity - a._similarity);
    
    return scored.slice(0, limit).map(({ _similarity, ...m }) => m as Memory);
  }
  
  forget(id: string, hard: boolean = false): boolean {
    if (hard) {
      const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?');
      return stmt.run(id).changes > 0;
    } else {
      const stmt = this.db.prepare("UPDATE memories SET deleted_at = datetime('now') WHERE id = ?");
      return stmt.run(id).changes > 0;
    }
  }
  
  // Entity management
  getEntities(): Entity[] {
    return this.db.prepare('SELECT * FROM entities ORDER BY memory_count DESC').all() as Entity[];
  }
  
  // Graph edges
  connect(sourceId: string, targetId: string, relationship: string): MemoryEdge {
    const id = `;
        e_$;
        {
            uuidv4().slice(0, 8);
        }
        `;
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`;
        INSERT;
        INTO;
        edges(id, source_id, target_id, relationship, created_at);
        VALUES() `);
    
    stmt.run(id, sourceId, targetId, relationship, now);
    
    return { id, source_id: sourceId, target_id: targetId, relationship, created_at: now };
  }
  
  getNeighbors(memoryId: string, depth: number = 1): Memory[] {
    const neighbors: Set<string> = new Set([memoryId]);
    const result: Memory[] = [];
    
    for (let i = 0; i < depth; i++) {
      const ids = Array.from(neighbors);
      if (ids.length === 0) break;
      
      const rows = this.db.prepare(`;
        SELECT;
        DISTINCT;
        target_id;
        FROM;
        edges;
        WHERE;
        source_id;
        IN($, { ids, : .map(() => '?').join(',') }) `).all(...ids) as { target_id: string }[];
      
      for (const row of rows) {
        if (!neighbors.has(row.target_id)) {
          neighbors.add(row.target_id);
        }
      }
    }
    
    const memStmt = this.db.prepare(`;
        SELECT * FROM;
        memories;
        WHERE;
        id;
        IN($, { Array, : .from(neighbors).map(() => '?').join(',') }) `);
    const rows = memStmt.all(...Array.from(neighbors)) as any[];
    
    return rows.map(row => ({
      ...row,
      entities: JSON.parse(row.entities || '[]'),
      topics: JSON.parse(row.topics || '[]'),
      embedding: Array.from(new Float32Array(row.embedding?.buffer || new ArrayBuffer(0)))
    }));
  }
  
  // Stats
  getStats(): VaultStats {
    const total = (this.db.prepare('SELECT COUNT(*) as count FROM memories WHERE deleted_at IS NULL').get() as any).count;
    
    const byType: Record<MemoryType, number> = {
      episodic: (this.db.prepare("SELECT COUNT(*) as count FROM memories WHERE type = 'episodic' AND deleted_at IS NULL").get() as any).count,
      semantic: (this.db.prepare("SELECT COUNT(*) as count FROM memories WHERE type = 'semantic' AND deleted_at IS NULL").get() as any).count,
      procedural: (this.db.prepare("SELECT COUNT(*) as count FROM memories WHERE type = 'procedural' AND deleted_at IS NULL").get() as any).count
    };
    
    const entities = (this.db.prepare('SELECT COUNT(*) as count FROM entities').get() as any).count;
    const edges = (this.db.prepare('SELECT COUNT(*) as count FROM edges').get() as any).count;
    const procedures = (this.db.prepare('SELECT COUNT(*) as count FROM procedures').get() as any).count;
    
    return { total, byType, entities, edges, procedures };
  }
  
  // ============================================================================
  // PHASE 1.5: KNOWLEDGE GRAPH API
  // ============================================================================
  
  /**
   * Get temporal history for an entity's relationships
   * Useful for contradiction and temporal questions
   */
  getEntityHistory(
    entityName: string,
    relationshipType?: string
  ): { value?: string; timestamp: string; superseded: boolean }[] {
    const result = getValueWithHistory(
      this.relationshipStore,
      this.entityStore,
      entityName,
      relationshipType as RelationshipType | undefined
    );
    
    return result.history;
  }
  
  /**
   * Get all contradictions involving an entity
   */
  getEntityContradictions(entityName: string): { current: any; superseded: any; timestamp: string }[] {
    const { getEntityContradictions } = require('../reasoning/contradiction.js');
    return getEntityContradictions(this.relationshipStore, this.entityStore, entityName);
  }
  
  /**
   * Get current value for an entity relationship
   */
  getCurrentValue(entityName: string, relationshipType: string): string | undefined {
    const result = getValueWithHistory(
      this.relationshipStore,
      this.entityStore,
      entityName,
      relationshipType as RelationshipType | undefined
    );
    return result.current;
  }
  
  // Procedure management
  async createProcedure(
    title: string,
    steps: string[],
    description?: string
  ): Promise<Procedure> {
    const id = `;
        proc_$;
        {
            uuidv4().slice(0, 8);
        }
        `;
    const now = new Date().toISOString();
    
    const procedureSteps: ProcedureStep[] = steps.map((desc, i) => ({
      id: `;
        step_$;
        {
            uuidv4().slice(0, 8);
        }
        `,
      order: i + 1,
      description: desc
    }));
    
    const stmt = this.db.prepare(`;
        INSERT;
        INTO;
        procedures(id, title, description, steps, version, success_count, failure_count, is_reliable, evolution_log, created_at, updated_at);
        VALUES(1, 0, 0, 0, '[]') `);
    
    stmt.run(id, title, description || null, JSON.stringify(procedureSteps), now, now);
    
    return this.getProcedure(id)!;
  }
  
  getProcedure(id: string): Procedure | null {
    const stmt = this.db.prepare('SELECT * FROM procedures WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      ...row,
      steps: JSON.parse(row.steps || '[]'),
      evolution_log: JSON.parse(row.evolution_log || '[]'),
      is_reliable: Boolean(row.is_reliable)
    };
  }
  
  getAllProcedures(): Procedure[] {
    const rows = this.db.prepare('SELECT * FROM procedures ORDER BY updated_at DESC').all() as any[];
    
    return rows.map(row => ({
      ...row,
      steps: JSON.parse(row.steps || '[]'),
      evolution_log: JSON.parse(row.evolution_log || '[]'),
      is_reliable: Boolean(row.is_reliable)
    }));
  }
  
  async procedureFeedback(
    procedureId: string,
    success: boolean,
    failedAtStep?: number,
    context?: string
  ): Promise<Procedure> {
    const proc = this.getProcedure(procedureId);
    if (!proc) throw new Error('Procedure not found');
    
    const now = new Date().toISOString();
    const newVersion = proc.version + 1;
    
    if (success) {
      const newCount = proc.success_count + 1;
      const isReliable = newCount >= 3 && !proc.is_reliable;
      
      const evolutionEvent: EvolutionEvent = {
        version: newVersion,
        trigger: 'success_pattern',
        change: `;
        Success;
        count: $;
        {
            newCount;
        }
        $;
        {
            isReliable ? 'Promoted to reliable workflow.' : '';
        }
        `,
        timestamp: now
      };
      
      this.db.prepare(`;
        UPDATE;
        procedures;
        SET;
        success_count =  ?  : ,
            is_reliable =  ?  : ,
            evolution_log =  ?  : ,
            updated_at =  ?
                WHERE : ;
        id =  ?
            `).run(newCount, isReliable ? 1 : 0, JSON.stringify([...proc.evolution_log, evolutionEvent]), now, procedureId);
    } else {
      // On failure, create new version with modified step if provided
      let newSteps = proc.steps;
      if (failedAtStep) {
        newSteps = proc.steps.map((step, i) => {
          if (i + 1 === failedAtStep) {
            return {
              ...step,
              description: ` : ;
        $;
        {
            step.description;
        }
        [RETRY, add, error, handling] `
            };
          }
          return step;
        });
      }
      
      const evolutionEvent: EvolutionEvent = {
        version: newVersion,
        trigger: 'failure',
        change: `;
        Failed;
        at;
        step;
        $;
        {
            failedAtStep || 'unknown';
        }
        $;
        {
            context || '';
        }
        New;
        version;
        created. `,
        timestamp: now
      };
      
      this.db.prepare(`;
        UPDATE;
        procedures;
        SET;
        version =  ?  : ,
            failure_count = failure_count + 1,
            steps =  ?  : ,
            evolution_log =  ?  : ,
            updated_at =  ?
                WHERE : ;
        id =  ?
            `).run(newVersion, JSON.stringify(newSteps), JSON.stringify([...proc.evolution_log, evolutionEvent]), now, procedureId);
    }
    
    return this.getProcedure(procedureId)!;
  }
  
  close(): void {
    this.db.close();
  }
}

// Default export
export default MemoryStore;
         : ;
    }
}
//# sourceMappingURL=index.js.map