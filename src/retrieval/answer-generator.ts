/**
 * LLM Answer Generator for LOCOMO Benchmark
 * 
 * Generates concise answers from retrieved memories using Ollama
 * Optimized for speed with minimal context
 */

import MemoryStore, { Memory } from '../storage/index.js';

// Try to import ollama, fall back to fetch if not available
let ollama: any = null;
try {
  ollama = require('ollama');
} catch {
  // Use fetch instead
}

/**
 * Generate concise answer from retrieved memories using LLM
 * Optimized for speed: uses minimal context and small response
 */
export async function generateAnswer(
  query: string,
  memories: Memory[],
  options?: { maxTokens?: number; model?: string }
): Promise<string> {
  // Edge case: no memories
  if (!memories || memories.length === 0) {
    return "I don't have information about that.";
  }

  // Use only top 2 memories, truncate to first 300 chars each
  const context = memories
    .slice(0, 2)
    .map(m => m.content.slice(0, 300))
    .join('\n');

  // Concise prompt for fast generation
  const prompt = `Q: ${query}
Context: ${context}
Give a short direct answer:`;

  const model = options?.model || 'qwen2.5:1.5b';
  const maxTokens = options?.maxTokens || 50; // Small response

  try {
    // Try ollama module first
    if (ollama) {
      const response = await ollama.generate({
        model,
        prompt,
        options: {
          num_predict: maxTokens,
          temperature: 0.1,
        }
      });
      return response.response.trim();
    }
    
    // Fallback to fetch
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature: 0.1,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as { response: string };
    return data.response.trim();
  } catch (error) {
    console.error('LLM generation failed:', error);
    // Fallback: extract relevant sentence from first memory
    const content = memories[0]?.content || '';
    // Simple extraction: return first sentence that might be relevant
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
    return sentences[0]?.trim() + '.' || "I don't have information about that.";
  }
}

/**
 * Check if generated answer matches expected answer using LLM
 */
export async function checkAnswerWithLLM(
  generated: string,
  expected: string,
  question: string,
  options?: { model?: string }
): Promise<boolean> {
  const prompt = `Is the generated answer correct for the given question?

Question: ${question}
Expected Answer: ${expected}
Generated Answer: ${generated}

Answer only "CORRECT" or "WRONG":`;

  const model = options?.model || 'qwen2.5:1.5b';

  try {
    let responseText: string;
    
    if (ollama) {
      const response = await ollama.generate({
        model,
        prompt,
        options: {
          num_predict: 10,
          temperature: 0,
        }
      });
      responseText = response.response.trim();
    } else {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            num_predict: 10,
            temperature: 0,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json() as { response: string };
      responseText = data.response.trim();
    }

    return responseText.toUpperCase() === 'CORRECT';
  } catch (error) {
    console.error('LLM check failed:', error);
    // Fallback to substring matching
    const generatedLower = generated.toLowerCase();
    const expectedLower = expected.toLowerCase();
    return generatedLower.includes(expectedLower) ||
           expectedLower.split(', ').some(e => generatedLower.includes(e.toLowerCase()));
  }
}

// Simple cache for LLM responses
const answerCache = new Map<string, { answer: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate answer with caching
 */
export async function generateAnswerWithCache(
  query: string,
  memories: Memory[],
  options?: { maxTokens?: number; model?: string }
): Promise<string> {
  const cacheKey = `${query}:${memories.map(m => m.id).join(',')}`;
  
  const cached = answerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.answer;
  }

  const answer = await generateAnswer(query, memories, options);
  answerCache.set(cacheKey, { answer, timestamp: Date.now() });
  
  return answer;
}

/**
 * Check answer with caching
 */
export async function checkAnswerWithCache(
  generated: string,
  expected: string,
  question: string,
  options?: { model?: string }
): Promise<boolean> {
  const cacheKey = `check:${question}:${generated.slice(0, 50)}`;
  
  const cached = answerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.answer === 'true';
  }

  const result = await checkAnswerWithLLM(generated, expected, question, options);
  answerCache.set(cacheKey, { answer: String(result), timestamp: Date.now() });
  
  return result;
}
