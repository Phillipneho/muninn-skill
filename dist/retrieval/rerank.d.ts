/**
 * Cross-Encoder Reranking
 *
 * Uses a cross-encoder model to rerank retrieval results
 * for better precision. Cross-encoders jointly encode query+document,
 * providing more accurate relevance scores than separate encoding.
 */
/**
 * Rerank documents using cross-encoder
 *
 * @param query - Search query
 * @param documents - Documents to rerank
 * @param topK - Number of top results to return
 * @returns Reranked documents with scores
 */
export declare function rerankWithCrossEncoder<T extends {
    content: string;
    id: string;
}>(query: string, documents: T[], topK?: number): Promise<Array<{
    doc: T;
    score: number;
}>>;
/**
 * Lightweight reranking using simpler method
 * Useful when cross-encoder is too slow
 */
export declare function lightweightRerank<T extends {
    content: string;
    id: string;
}>(query: string, documents: T[], topK?: number): Array<{
    doc: T;
    score: number;
}>;
/**
 * Set custom reranker model
 */
export declare function setRerankerModel(model: string): void;
//# sourceMappingURL=rerank.d.ts.map