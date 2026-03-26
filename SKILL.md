---
name: muninn-skill
description: Memory layer for AI agents. Local SQLite (free) or Cloud PostgreSQL with BYOK ($10/mo). Knowledge graph, temporal reasoning, multi-hop retrieval.
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["node"] },
        "install":
          [
            {
              "id": "ollama-pull",
              "kind": "command",
              "command": "ollama pull nomic-embed-text",
              "label": "Pull embedding model (local only)",
              "optional": true,
            },
          ],
      },
  }
---

# Muninn Memory System

**Persistent memory for AI agents.** Knowledge graph with temporal reasoning, entity extraction, and multi-hop retrieval.

## Two Modes

| Mode | Storage | Embeddings | Cost |
|------|---------|------------|------|
| **Local** | SQLite | Ollama (nomic-embed-text) | Free |
| **Cloud** | PostgreSQL | Gemini / OpenAI (BYOK) | $10/mo |

### Local Mode (Free)

Runs entirely on your machine. No API keys required.

```bash
# Install
clawhub install muninn-skill

# Pull embedding model (required for local)
ollama pull nomic-embed-text

# Start MCP server
cd ~/.openclaw/workspace/skills/muninn-skill
npm install
npm run mcp
```

### Cloud Mode (Paid)

Hosted PostgreSQL with vector search. Use your own API keys (BYOK).

```bash
# Get API key at https://muninn.au/dashboard
export MUNINN_API_KEY=muninn_xxx

# For Gemini embeddings (sleep cycle)
export EMBEDDING_MODE=gemini
export GEMINI_API_KEY=your-gemini-api-key

# For OpenAI embeddings
export EMBEDDING_MODE=openai
export OPENAI_API_KEY=sk-proj-xxx

# Cloud mode is automatic when API key is set
# Falls back to local if not configured
```

### Gemini Embeddings (Recommended for Sleep Cycle)

Best for sleep cycle consolidation — free tier includes 100 requests/day.

```bash
# Get free API key at https://aistudio.google.com/app/apikey
export EMBEDDING_MODE=gemini
export GEMINI_API_KEY=your-key

# Uses text-embedding-004 model (768 dimensions)
```

## Features

- **Knowledge Graph**: Entities, relationships, multi-hop traversal
- **Temporal Reasoning**: "What did we discuss last Tuesday?" resolves to actual dates
- **Auto-classification**: Episodic/Semantic/Procedural routing (100% accuracy, no LLM)
- **Entity extraction**: 91% precision (people, orgs, projects, tech, locations, events, concepts)
- **Contradiction detection**: Conflicting values flagged automatically
- **MCP-native**: Works with any agent framework via mcporter

## Quick Start

```bash
# Install skill
clawhub install muninn-skill

# For local: pull embedding model
ollama pull nomic-embed-text

# Start MCP server
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
              Local: SQLite + VSS    Cloud: PostgreSQL + pgvector
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

### Local
- **Storage**: SQLite with vector similarity
- **Embeddings**: Ollama (`nomic-embed-text`)
- **Compression**: TurboQuant (5x reduction, 94% similarity)
- **Server**: MCP SDK

### Cloud
- **Storage**: PostgreSQL + pgvector (Supabase)
- **Embeddings**: BYOK (OpenAI/Anthropic) or our keys
- **Compression**: TurboQuant (5x reduction, 94% similarity)
- **Server**: MCP SDK + REST API

### TurboQuant Compression

Optional compression for 5x storage reduction:

```bash
# Install dependencies (local only)
pip install torch scipy numpy

# Start compression server
cd ~/.openclaw/workspace/skills/muninn-skill/src/storage
python3 turboquant-server.py &

# Use in code
import { compress, similarity } from './storage/turboquant-client.js';
const compressed = await compress(embedding, 3);  // 3-bit, ~74% smaller
const score = await similarity(query, compressed);
```

**Performance:**
- Compression ratio: 3.9x (768-dim @ 3-bit)
- Storage savings: 74%
- Cosine similarity retention: 94%
- First call latency: ~15s (PyTorch warmup)
- Subsequent calls: ~50-100ms

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Core** | Free | Local SQLite, Ollama embeddings |
| **Pro** | $10/mo | Cloud PostgreSQL, BYOK, 50K API calls |
| **Enterprise** | $79/mo | Dedicated infrastructure, teams, unlimited |

## Version History

### v5.3 (Current)
- Audit trail for memory operations
- Lessons learned extraction
- Cloud API support with BYOK
- Unified local/cloud mode detection
- **TurboQuant compression** — 5x storage reduction, 94% similarity

### v5.2
- BFS path finding between entity pairs
- Coreference resolution (pronoun → antecedent)
- Path relevance ranking
- +13% on custom LOCOMO-style benchmark

## License

AGPL-3.0

## Links

- **Cloud Dashboard**: [muninn.au](https://muninn.au)
- **GitHub**: [github.com/Phillipneho/muninn](https://github.com/Phillipneho/muninn)
- **Skill Package**: [github.com/Phillipneho/muninn-skill](https://github.com/Phillipneho/muninn-skill)