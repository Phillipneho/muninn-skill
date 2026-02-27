/**
 * Hybrid Retrieval using Reciprocal Rank Fusion (RRF)
 *
 * Combines dense (semantic/embedding) and sparse (BM25) retrieval
 * to get the best of both worlds: semantic understanding + exact term matching.
 */
import { generateEmbedding } from '../storage/index.js';
import { bm25Search } from './bm25.js';
import { TemporalDecayScorer, applyTemporalDecayWithContradictions } from './temporal-decay.js';
/**
 * Cosine similarity (inline to avoid import issues)
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length || a.length === 0)
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
/**
 * Default options
 */
const DEFAULT_RRF_K = 60;
const DEFAULT_K = 25; // P8.1: Increased from 10 to 25 (Engram's proven setting)
/**
 * Hybrid retrieval combining semantic and BM25 search
 *
 * @param query - Search query
 * @param documents - All documents to search
 * @param options - Configuration options
 * @returns Combined and ranked results
 */
export async function hybridSearch(query, documents, options = {}) {
    const k = options.k || DEFAULT_K;
    const rrfK = options.rrfK || DEFAULT_RRF_K;
    // Always do semantic ranking, even with few documents
    // 1. Dense (semantic) retrieval
    const denseResults = await denseSearch(query, documents, k * 2);
    // 2. Sparse (BM25) retrieval
    const sparseResults = sparseSearch(query, documents, k * 2);
    // 3. Reciprocal Rank Fusion (with query for entity boosting)
    const fused = reciprocalRankFusion(denseResults, sparseResults, rrfK, query);
    // 4. P7.2: Apply temporal decay with contradiction handling
    let results = fused.slice(0, k);
    if (options.enableTemporalDecay) {
        const scorer = new TemporalDecayScorer({
            halfLifeDays: options.temporalHalfLifeDays || 30
        });
        // Build base scores map
        const baseScores = new Map();
        for (const mem of results) {
            baseScores.set(mem.id, mem._finalScore || (mem.salience || 0.5));
        }
        // Apply temporal decay with contradictions
        if (options.entityStore && options.relationshipStore) {
            results = applyTemporalDecayWithContradictions(results, baseScores, options.entityStore, options.relationshipStore, { halfLifeDays: options.temporalHalfLifeDays || 30 });
        }
        else {
            // Just apply temporal decay without contradiction handling
            const scored = scorer.applyDecay(results);
            scored.sort((a, b) => b._combinedScore - a._combinedScore);
            results = scored;
        }
    }
    return results;
}
/**
 * Dense retrieval using embeddings
 */
async function denseSearch(query, documents, k) {
    const queryEmbedding = await generateEmbedding(query);
    const scored = documents.map(doc => {
        const sim = doc.embedding?.length
            ? cosineSimilarity(queryEmbedding, doc.embedding)
            : 0;
        return { doc, sim };
    });
    // Sort by similarity
    scored.sort((a, b) => b.sim - a.sim);
    // Return with rank
    return scored.slice(0, k).map((item, rank) => ({
        doc: item.doc,
        rank: rank + 1,
        score: item.sim
    }));
}
/**
 * Sparse retrieval using BM25
 */
function sparseSearch(query, documents, k) {
    const results = bm25Search(query, documents, { k });
    return results.map((doc, rank) => ({
        doc: doc,
        rank: rank + 1,
        score: doc._bm25Score || 0
    }));
}
/**
 * Deduplicate results based on content similarity
 * Removes near-duplicate memories before final scoring
 */
function deduplicateResults(memories, threshold = 0.85) {
    if (memories.length <= 1)
        return memories;
    const unique = [];
    const seenContent = new Set();
    for (const m of memories) {
        // Normalize content for comparison
        const normalized = m.content.toLowerCase().replace(/\s+/g, ' ').trim();
        // Check for exact duplicate
        if (seenContent.has(normalized)) {
            continue;
        }
        // Check for near-duplicate (high similarity to existing)
        let isDuplicate = false;
        for (const existing of unique) {
            const existingNorm = existing.content.toLowerCase().replace(/\s+/g, ' ').trim();
            const similarity = calculateSimilarity(normalized, existingNorm);
            if (similarity >= threshold) {
                // Keep the one with higher salience
                if ((m.salience || 0.5) > (existing.salience || 0.5)) {
                    // Replace the existing one
                    const idx = unique.indexOf(existing);
                    unique[idx] = m;
                }
                isDuplicate = true;
                break;
            }
        }
        if (!isDuplicate) {
            unique.push(m);
            seenContent.add(normalized);
        }
    }
    return unique;
}
/**
 * Simple word overlap similarity
 */
function calculateSimilarity(a, b) {
    const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0)
        return 0;
    let intersection = 0;
    for (const w of wordsA) {
        if (wordsB.has(w))
            intersection++;
    }
    return intersection / Math.min(wordsA.size, wordsB.size);
}
/**
 * Extract entities from query
 */
function extractQueryEntities(query) {
    const entities = [];
    // Known entities to look for
    const knownEntities = [
        'Phillip', 'KakāpōHiko', 'Kakāpō', 'Hiko',
        'Elev8Advisory', 'BrandForge', 'Muninn', 'OpenClaw',
        'Sammy Clemens', 'Charlie Babbage', 'Donna Paulsen',
        'Brisbane', 'Australia', 'React', 'Node.js', 'PostgreSQL',
        'SQLite', 'Ollama', 'Stripe', 'gateway', 'port',
        'priority', 'revenue', 'team', 'agents', 'projects'
    ];
    const lowerQuery = query.toLowerCase();
    for (const e of knownEntities) {
        if (lowerQuery.includes(e.toLowerCase())) {
            entities.push(e);
        }
    }
    return entities;
}
/**
 * Reciprocal Rank Fusion
 *
 * Combines rankings from multiple retrieval methods.
 * RRF score = sum(1 / (k + rank)) for each ranking where item appears
 */
function reciprocalRankFusion(denseResults, sparseResults, k = 60, query = '') {
    // Map doc ID to accumulated RRF score
    const rrfScores = new Map();
    // Extract entities from query for boosting
    const queryEntities = extractQueryEntities(query);
    const useEntityBoost = queryEntities.length > 0;
    // Add dense scores
    for (const { doc, rank } of denseResults) {
        const rrfScore = 1 / (k + rank);
        const existing = rrfScores.get(doc.id);
        if (existing) {
            existing.score += rrfScore;
        }
        else {
            rrfScores.set(doc.id, { doc, score: rrfScore });
        }
    }
    // Add sparse scores
    for (const { doc, rank } of sparseResults) {
        const rrfScore = 1 / (k + rank);
        const existing = rrfScores.get(doc.id);
        if (existing) {
            existing.score += rrfScore;
        }
        else {
            rrfScores.set(doc.id, { doc, score: rrfScore });
        }
    }
    // Convert to array and apply boosts
    let sorted = [...rrfScores.values()].sort((a, b) => b.score - a.score);
    // Apply entity-based boosting
    if (useEntityBoost) {
        sorted = sorted.map(s => {
            const docEntities = s.doc.entities || [];
            let entityBoost = 0;
            for (const qe of queryEntities) {
                for (const de of docEntities) {
                    if (de.toLowerCase().includes(qe.toLowerCase()) ||
                        qe.toLowerCase().includes(de.toLowerCase())) {
                        entityBoost += 0.3; // 30% boost per matching entity
                        break;
                    }
                }
            }
            return {
                ...s,
                score: s.score * (1 + entityBoost)
            };
        });
        // Re-sort after entity boost
        sorted.sort((a, b) => b.score - a.score);
    }
    // Apply salience boost
    const boosted = sorted.map(s => {
        const salience = s.doc.salience || 0.5;
        const boostFactor = salience * 2; // 0.8 → 1.6, 0.5 → 1.0, 0.3 → 0.6
        return {
            ...s.doc,
            _rrfScore: s.score,
            _finalScore: s.score * boostFactor
        };
    });
    // Sort by final score
    boosted.sort((a, b) => (b._finalScore || 0) - (a._finalScore || 0));
    // Deduplicate results
    const deduplicated = deduplicateResults(boosted);
    return deduplicated;
}
/**
 * Get retrieval scores breakdown for debugging
 */
export async function getRetrievalBreakdown(query, documents, k = 5) {
    const denseResults = await denseSearch(query, documents, k * 2);
    const sparseResults = sparseSearch(query, documents, k * 2);
    const fusedResults = reciprocalRankFusion(denseResults, sparseResults, 60, query);
    return {
        query,
        dense: denseResults.map(d => ({
            id: d.doc.id,
            content: d.doc.content.substring(0, 50) + '...',
            similarity: d.score,
            rank: d.rank
        })),
        sparse: sparseResults.map(s => ({
            id: s.doc.id,
            content: s.doc.content.substring(0, 50) + '...',
            bm25: s.score,
            rank: s.rank
        })),
        fused: fusedResults.slice(0, k).map(f => {
            const denseRank = denseResults.findIndex(d => d.doc.id === f.id);
            const sparseRank = sparseResults.findIndex(s => s.doc.id === f.id);
            return {
                id: f.id,
                content: f.content.substring(0, 50) + '...',
                rrfScore: (denseRank >= 0 ? 1 / (60 + denseRank + 1) : 0) +
                    (sparseRank >= 0 ? 1 / (60 + sparseRank + 1) : 0)
            };
        })
    };
}
//# sourceMappingURL=hybrid.js.map