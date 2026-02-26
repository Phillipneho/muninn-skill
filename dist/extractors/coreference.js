/**
 * Coreference Resolution for Muninn Memory System
 *
 * Resolves pronouns, aliases, and references to canonical entity names
 * BEFORE memory storage to prevent entity fragmentation.
 *
 * This fixes the LOCOMO benchmark gap where "Phillip", "him", and
 * "the Program Manager" were seen as 3 different entities.
 *
 * Uses LLM-based entity linking via local Ollama.
 */
import { extractEntities } from './entities.js';
// Pronoun patterns to resolve
const PRONOUN_PATTERNS = /\b(he|she|him|her|his|hers|they|them|their|theirs|it|its|this|that|these|those)\b/gi;
// Possessive determiners
const POSSESSIVE_PATTERNS = /\b(my|your|his|her|its|our|their)\b/gi;
// ============================================
// ENTITY CACHE (from memory store)
// ============================================
let entityCache = new Map();
/**
 * Initialize entity cache from memory store
 * Should be called when memory system starts
 */
export async function initEntityCache(store) {
    try {
        // Get all entities from knowledge graph
        const kgEntities = store.getEntityStore().getAll();
        for (const ent of kgEntities) {
            const aliases = [
                ent.name,
                ...ent.aliases
            ];
            entityCache.set(ent.name.toLowerCase(), {
                canonical: ent.name,
                aliases: aliases,
                type: ent.type
            });
        }
        console.log(`📇 Coreference: Initialized with ${entityCache.size} known entities`);
    }
    catch (error) {
        console.warn('Coreference: Failed to initialize entity cache:', error);
    }
}
/**
 * Add a new entity to the cache
 */
export function addToEntityCache(canonical, aliases, type) {
    const existing = entityCache.get(canonical.toLowerCase());
    if (existing) {
        // Merge aliases
        const mergedAliases = [...new Set([...existing.aliases, ...aliases])];
        entityCache.set(canonical.toLowerCase(), {
            canonical,
            aliases: mergedAliases,
            type
        });
    }
    else {
        entityCache.set(canonical.toLowerCase(), {
            canonical,
            aliases: [...aliases, canonical],
            type
        });
    }
}
/**
 * Get canonical name for a pronoun or alias
 */
export function resolveEntity(mention) {
    const lower = mention.toLowerCase();
    // Check if it's a known alias
    for (const [_, entity] of entityCache) {
        if (entity.aliases.some(a => a.toLowerCase() === lower)) {
            return entity.canonical;
        }
    }
    // Check if it's the canonical name itself
    if (entityCache.has(lower)) {
        return entityCache.get(lower).canonical;
    }
    return null;
}
/**
 * Clear entity cache (for testing)
 */
export function clearEntityCache() {
    entityCache.clear();
}
// ============================================
// LLM-BASED COREFERENCE RESOLUTION
// ============================================
/**
 * Call Ollama for coreference resolution
 * Uses a focused prompt to rewrite text with resolved entities
 *
 * Example:
 * Raw: "Met with Caroline regarding the BHP MSP. She is worried about the rollout. It needs to be delayed."
 * Resolved: "Met with Caroline regarding the BHP MSP. Caroline is worried about the BHP MSP rollout. The BHP MSP rollout needs to be delayed."
 */
async function resolveWithLLM(text, knownEntities, entityAliases) {
    // Build entity context with aliases
    let entityContext = '';
    if (entityAliases && entityAliases.size > 0) {
        const entries = [];
        for (const [canonical, aliases] of entityAliases) {
            entries.push(`${canonical} (aliases: ${aliases.join(', ')})`);
        }
        entityContext = `\n\nKnown entities with aliases:\n${entries.join('\n')}`;
    }
    else if (knownEntities.length > 0) {
        entityContext = `\n\nKnown entities: ${knownEntities.join(', ')}`;
    }
    const prompt = `You are a Coreference Resolution Engine. Rewrite the provided user note by replacing all pronouns (he, she, they, it, his, her, their, the project, the client) with the specific entities they refer to based on the immediate context.

Rules:
1. Maintain the original tone and substance
2. Replace pronouns with the actual entity name
3. Replace vague references (the project, the client, the program) with specific names
4. If an entity is ambiguous, keep the pronoun but append the most likely identity in brackets
5. Do NOT change any other words
${entityContext}

Input: "${text}"

Output the rewritten text with coreferences resolved. Output ONLY the resolved text, nothing else:`;
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2.5:1.5b',
                prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 512
                }
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.statusText}`);
        }
        const data = await response.json();
        // Cloud models (minimax, glm) use 'thinking' field, local models use 'response'
        const resolvedText = (data.response || data.thinking || '').trim();
        // Extract entity mappings by comparing original vs resolved
        const entityMap = extractEntityMap(text, resolvedText);
        return { resolvedText, entityMap };
    }
    catch (error) {
        console.warn('Coreference LLM resolution failed:', error);
        return { resolvedText: text, entityMap: new Map() };
    }
}
/**
 * Extract entity mappings by comparing original and resolved text
 */
function extractEntityMap(original, resolved) {
    const map = new Map();
    // Find pronouns in original
    const pronouns = original.match(PRONOUN_PATTERNS) || [];
    // Look for entity names in brackets in resolved text
    const bracketPattern = /\[([^\]]+)\]/g;
    let match;
    while ((match = bracketPattern.exec(resolved)) !== null) {
        // Find corresponding pronoun (approximate)
        const entityName = match[1];
        for (const pronoun of pronouns) {
            if (!map.has(pronoun.toLowerCase())) {
                map.set(pronoun.toLowerCase(), entityName);
                break;
            }
        }
    }
    return map;
}
// ============================================
// MAIN COREFERENCE RESOLUTION
// ============================================
/**
 * Resolve coreferences in text
 *
 * @param text - Raw input text
 * @param knownEntities - Optional list of known entities (from memory store)
 * @param useLLM - Whether to use LLM for resolution (default: true)
 * @returns CoreferenceResult with resolved text and entity mappings
 */
export async function resolveCoreferences(text, knownEntities, useLLM = true) {
    const originalText = text;
    const entityMap = new Map();
    const newEntitiesFound = [];
    // Step 1: Extract entities from the current text
    const extractedEntities = extractEntities(text);
    const currentEntities = extractedEntities
        .filter(e => e.type === 'person')
        .map(e => e.text);
    // Step 2: Build comprehensive entity list
    let allEntities = [...currentEntities];
    // Add entities from cache
    for (const [_, entity] of entityCache) {
        if (!allEntities.includes(entity.canonical)) {
            allEntities.push(entity.canonical);
        }
    }
    // Add provided known entities
    if (knownEntities) {
        for (const e of knownEntities) {
            if (!allEntities.includes(e)) {
                allEntities.push(e);
            }
        }
    }
    // Step 3: Use LLM to resolve pronouns
    let resolvedText = text;
    if (useLLM && allEntities.length > 0) {
        // Build entity aliases map from cache
        const entityAliases = new Map();
        for (const [_, entity] of entityCache) {
            entityAliases.set(entity.canonical, entity.aliases);
        }
        const llmResult = await resolveWithLLM(text, allEntities, entityAliases);
        resolvedText = llmResult.resolvedText;
        // Merge LLM entity map
        for (const [pronoun, canonical] of llmResult.entityMap) {
            entityMap.set(pronoun.toLowerCase(), canonical);
        }
    }
    // Step 4: Also do simple pattern-based resolution as backup
    // Find "the X" patterns (e.g., "the Program Manager")
    const definitePattern = /the\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    let match;
    while ((match = definitePattern.exec(text)) !== null) {
        const phrase = match[1];
        const resolved = resolveEntity(phrase);
        if (resolved) {
            entityMap.set(phrase.toLowerCase(), resolved);
        }
    }
    // Step 5: Apply pattern-based resolutions to resolved text (if LLM didn't already)
    // Sort by length (longest first) to avoid partial replacements
    const sortedMappings = [...entityMap.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [mention, canonical] of sortedMappings) {
        // Create regex for the mention (case-insensitive, whole word)
        const regex = new RegExp(`\\b${mention}\\b`, 'gi');
        resolvedText = resolvedText.replace(regex, `[${canonical}]`);
    }
    // Step 6: Add any new entities found to cache
    for (const entity of currentEntities) {
        if (!entityCache.has(entity.toLowerCase())) {
            newEntitiesFound.push(entity);
            addToEntityCache(entity, [], 'person');
        }
    }
    return {
        originalText,
        resolvedText,
        entityMap,
        newEntitiesFound
    };
}
/**
 * Simple coreference resolution without LLM
 * Uses pattern matching and entity cache only
 */
export function resolveCoreferencesSimple(text, knownEntities) {
    const originalText = text;
    const entityMap = new Map();
    const newEntitiesFound = [];
    // Extract entities from text
    const extractedEntities = extractEntities(text);
    // Add extracted entities to cache if new
    for (const entity of extractedEntities) {
        if (entity.type === 'person' && !entityCache.has(entity.text.toLowerCase())) {
            newEntitiesFound.push(entity.text);
            addToEntityCache(entity.text, [], entity.type);
        }
    }
    // Add known entities to cache
    if (knownEntities) {
        for (const e of knownEntities) {
            if (!entityCache.has(e.toLowerCase())) {
                addToEntityCache(e, [], 'unknown');
            }
        }
    }
    // Resolve pronouns using cache
    const pronouns = text.match(PRONOUN_PATTERNS) || [];
    for (const pronoun of pronouns) {
        const resolved = resolveEntity(pronoun);
        if (resolved) {
            entityMap.set(pronoun.toLowerCase(), resolved);
        }
    }
    // Resolve definite noun phrases
    const definitePattern = /the\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    let match;
    while ((match = definitePattern.exec(text)) !== null) {
        const phrase = match[1];
        const resolved = resolveEntity(phrase);
        if (resolved) {
            entityMap.set(phrase.toLowerCase(), resolved);
        }
    }
    // Build resolved text
    let resolvedText = text;
    const sortedMappings = [...entityMap.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [mention, canonical] of sortedMappings) {
        const regex = new RegExp(`\\b${mention}\\b`, 'gi');
        resolvedText = resolvedText.replace(regex, `[${canonical}]`);
    }
    return {
        originalText,
        resolvedText,
        entityMap,
        newEntitiesFound
    };
}
/**
 * Pre-process content before memory storage
 */
export async function preprocessForMemory(content, store) {
    // Get known entities from store if available
    let knownEntities = [];
    if (store) {
        const entities = store.getEntities();
        knownEntities = entities.map(e => e.name);
    }
    // Resolve coreferences
    const result = await resolveCoreferences(content, knownEntities, true);
    return {
        originalContent: result.originalText,
        resolvedContent: result.resolvedText,
        coreferenceMap: Object.fromEntries(result.entityMap),
        newEntities: result.newEntitiesFound
    };
}
/**
 * Simple version without LLM (faster, for batch processing)
 */
export function preprocessForMemorySimple(content, store) {
    let knownEntities = [];
    if (store) {
        const entities = store.getEntities();
        knownEntities = entities.map(e => e.name);
    }
    const result = resolveCoreferencesSimple(content, knownEntities);
    return {
        originalContent: result.originalText,
        resolvedContent: result.resolvedText,
        coreferenceMap: Object.fromEntries(result.entityMap),
        newEntities: result.newEntitiesFound
    };
}
//# sourceMappingURL=coreference.js.map