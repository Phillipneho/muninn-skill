/**
 * BM25 Retrieval Implementation
 *
 * Sparse retrieval using Okapi BM25 ranking function.
 * Complements dense (semantic) search with exact term matching.
 */
import type { Memory } from '../storage/index.js';
export interface BM25Options {
    /** BM25 k1 parameter (term frequency saturation) */
    k1?: number;
    /** BM25 b parameter (document length normalization) */
    b?: number;
    /** Average document length for corpus */
    avgDocLen?: number;
}
/**
 * BM25 Scorer class
 */
export declare class BM25Scorer {
    private k1;
    private b;
    private avgDocLen;
    private idf;
    private docLengths;
    private docTermFreqs;
    constructor(options?: BM25Options);
    /**
     * Index a corpus of documents
     */
    index(documents: Memory[]): void;
    /**
     * Tokenize text into terms
     */
    private tokenize;
    /**
     * Calculate BM25 score for a single document
     */
    private scoreDocument;
    /**
     * Search documents using BM25
     */
    search(query: string, documents: Memory[], k?: number): Memory[];
}
/**
 * Simple BM25 search function (convenience wrapper)
 */
export declare function bm25Search(query: string, documents: Memory[], options?: {
    k?: number;
    k1?: number;
    b?: number;
}): Memory[];
//# sourceMappingURL=bm25.d.ts.map