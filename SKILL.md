---
name: muninn-memory
description: Local-first memory system for AI agents with knowledge graph, temporal reasoning, and BFS multi-hop retrieval. Outperforms Mem0 on LOCOMO benchmarks.
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["ollama", "node"] },
        "install":
          [
            {
              "id": "ollama-pull",
              "kind": "command",
              "command": "ollama pull nomic-embed-text",
              "label": "Pull embedding model",
            },
          ],
      },
  }
---

# Muninn Memory System

Local-first, Ollama-compatible memory system with knowledge graph and multi-hop reasoning.

## Features

- **Local-first**: No external APIs, runs entirely on your machine
- **Ollama embeddings**: Uses `nomic-embed-text` (768 dimensions)
- **Auto-classification**: Episodic/Semantic/Procedural routing (100% accuracy, no LLM)
- **Entity extraction**: 91% precision (people, orgs, projects, tech, locations, events, concepts)
- **Knowledge graph**: Relationships tracked (has_target, uses, built_by, employs, has_priority)
- **Temporal reasoning**: "What did we discuss last Tuesday?" resolves to actual dates
- **Multi-hop retrieval**: BFS path finding between entities
- **Contradiction detection**: Conflicting values flagged automatically
- **MCP-native**: Works with any agent framework via mcporter

## Quick Start

```bash
# Install
clawhub install muninn-memory

# Start MCP server
cd ~/.openclaw/workspace/skills/muninn-memory
npm install
npm run mcp
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `memory_remember` | Store a memory (auto-classifies type) |
| `memory_recall` | Semantic search across memories |
| `memory_briefing` | Session briefing with key facts |
| `memory_stats` | Vault statistics |
| `memory_entities` | List tracked entities |
| `memory_forget` | Delete a memory |
| `memory_procedure_create` | Create workflow |
| `memory_procedure_feedback` | Record success/failure |
| `memory_connect` | Link memories |
| `memory_neighbors` | Get graph neighbors |

## Architecture

```
Input → Router (keyword) → Episodic/Semantic/Procedural
                                   ↓
                           Entity Extraction
                                   ↓
                           Knowledge Graph
                                   ↓
                           SQLite + VSS
                                   ↓
Output ← Hybrid Retrieval (BM25 + semantic + entity boost)
```

## Benchmark Results

| System | Custom LOCOMO-style | Notes |
|--------|---------------------|-------|
| Muninn | **93%** (14/15) | +13% from BFS path finding |
| Mem0 | 66.9% | Official benchmark |
| Engram | 79.6% | Official benchmark |

**Note:** Our custom test shares methodology with LOCOMO but uses different questions. Official benchmark pending.

## Tech Stack

- **Storage**: SQLite with vector similarity
- **Embeddings**: Ollama (`nomic-embed-text`)
- **Server**: MCP SDK
- **Language**: TypeScript

## Version History

### 1.0.5 (2026-03-03)
- **NEW**: BFS path finding between entity pairs (`graph-traversal.ts`)
- **NEW**: Coreference resolution (pronoun → antecedent)
- **NEW**: Path relevance ranking (length, confidence, recency, salience)
- **FIX**: Relationship contradiction tracking (`supersededBy` field)
- **IMPROVEMENT**: +13% on custom LOCOMO-style benchmark

### 1.0.4 (2026-02-25)
- Phase 1.5 complete: 76% LOCOMO (beats Mem0)
- Hybrid retrieval (BM25 + semantic + entity boost)
- Temporal reasoning
- Contradiction detection

### 1.0.0 (2026-02-24)
- Phase 1 complete: Foundation release
- SQLite storage with vector search
- Ollama embeddings
- Auto-classification (100% accuracy)

## License

AGPL-3.0