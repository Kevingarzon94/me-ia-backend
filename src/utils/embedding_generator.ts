import { FeatureExtractionPipeline, pipeline } from "@xenova/transformers";
import { Chunk } from "../types/Chunk";
import crypto from 'crypto';

interface EmbeddingMetadata {
    textLength: number;
    embeddingDimension: number;
    generatedAt: string;
    chunkIndex: number;
    type?: string;
}

interface EmbeddingResult {
    id: string;
    text: string;
    embedding: number[];
    metadata: EmbeddingMetadata;
}

interface EmbeddingProgress {
    processed: number;
    total: number;
    percentage: number;
}


const EMBEDDING_CONFIG = {
    model: 'Xenova/all-MiniLM-L6-v2',
    dimension: 384,
    pooling: 'mean' as const,
    normalize: true,
    batchSize: 10,
    maxRetries: 3
};

let cachedGenerator: FeatureExtractionPipeline | null = null;

const getEmbeddingGenerator = async () => {
    if (!cachedGenerator) {
        console.log('Loading embedding model...');
        cachedGenerator = await pipeline(
            'feature-extraction',
            EMBEDDING_CONFIG.model
        );
        console.log('Embedding model loaded successfully');
    }
    return cachedGenerator;
};

const generateChunkId = (chunk: Chunk, index: number): string => {
    const metadata = chunk.metadata;

    if (metadata.id) {
        return `${metadata.id}_${generateHash(chunk.text, 8)}`;
    }

    const parts: string[] = [];

    if (metadata.type) {
        parts.push(metadata.type as string);
    }

    if (metadata.section) {
        parts.push(metadata.section as string);
    } else if (metadata.company) {
        parts.push((metadata.company as string).replace(/\s+/g, '_').toLowerCase());
    } else if (metadata.category) {
        parts.push(metadata.category as string);
    }

    const hash = generateHash(chunk.text, 8);
    parts.push(hash);

    if (parts.length === 1) {
        parts.push(`idx_${index}`);
    }

    return parts.join('_');
};

const generateHash = (text: string, length: number = 8): string => {
    const hash = crypto
        .createHash('md5')
        .update(text)
        .digest('hex');
    return hash.substring(0, length);
};

const generateSingleEmbedding = async (
    text: string,
    retries: number = 0
): Promise<number[]> => {
    try {
        const generator = await getEmbeddingGenerator();
        const output = await generator(text, {
            pooling: EMBEDDING_CONFIG.pooling,
            normalize: EMBEDDING_CONFIG.normalize
        });

        const embedding = Array.from(output.data) as number[];

        if (embedding.length !== EMBEDDING_CONFIG.dimension) {
            throw new Error(
                `Unexpected embedding dimension: ${embedding.length} (expected ${EMBEDDING_CONFIG.dimension})`
            );
        }

        return embedding;
    } catch (error) {
        if (retries < EMBEDDING_CONFIG.maxRetries) {
            console.warn(
                `Retrying embedding generation (attempt ${retries + 1}/${EMBEDDING_CONFIG.maxRetries})`
            );
            await sleep(1000 * (retries + 1)); // Backoff exponencial
            return generateSingleEmbedding(text, retries + 1);
        }
        throw error;
    }
};

export const generateEmbeddings = async (
    chunks: Chunk[],
    onProgress?: (progress: EmbeddingProgress) => void
): Promise<EmbeddingResult[]> => {
    console.log(`Generating embeddings for ${chunks.length} chunks...`);

    const embeddings: EmbeddingResult[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    for (let i = 0; i < chunks.length; i += EMBEDDING_CONFIG.batchSize) {
        const batch = chunks.slice(i, i + EMBEDDING_CONFIG.batchSize);

        const batchPromises = batch.map(async (chunk, batchIndex) => {
            const globalIndex = i + batchIndex;

            try {
                if (!chunk.text || chunk.text.trim().length === 0) {
                    throw new Error('Chunk has empty text');
                }

                const embedding = await generateSingleEmbedding(chunk.text);

                const id = generateChunkId(chunk, globalIndex);

                return {
                    id,
                    text: chunk.text,
                    embedding,
                    metadata: {
                        ...chunk.metadata,
                        // Agregar metadata adicional útil
                        textLength: chunk.text.length,
                        embeddingDimension: embedding.length,
                        generatedAt: new Date().toISOString(),
                        chunkIndex: globalIndex
                    }
                };
            } catch (error) {
                console.error(
                    `Error generating embedding for chunk ${globalIndex}:`,
                    error
                );
                errors.push({
                    index: globalIndex,
                    error: error as Error
                });
                return null;
            }
        });

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach(result => {
            if (result) {
                embeddings.push(result);
            }
        });

        const progress: EmbeddingProgress = {
            processed: Math.min(i + EMBEDDING_CONFIG.batchSize, chunks.length),
            total: chunks.length,
            percentage: Math.round(
                (Math.min(i + EMBEDDING_CONFIG.batchSize, chunks.length) / chunks.length) * 100
            )
        };

        console.log(
            `Progress: ${progress.processed}/${progress.total} (${progress.percentage}%)`
        );

        if (onProgress) {
            onProgress(progress);
        }
    }

    console.log(`\nEmbedding generation completed:`);
    console.log(`- Successful: ${embeddings.length}`);
    console.log(`- Failed: ${errors.length}`);

    if (errors.length > 0) {
        console.error('\nErrors encountered:');
        errors.forEach(({ index, error }) => {
            console.error(`  Chunk ${index}: ${error.message}`);
        });
    }

    return embeddings;
};

export const generateQueryEmbedding = async (query: string): Promise<number[]> => {
    if (!query || query.trim().length === 0) {
        throw new Error('Query cannot be empty');
    }

    return generateSingleEmbedding(query);
};


export const validateEmbeddings = (embeddings: EmbeddingResult[]): {
    valid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];
    const seenIds = new Set<string>();

    embeddings.forEach((emb, index) => {
        if (seenIds.has(emb.id)) {
            errors.push(`Duplicate ID found: ${emb.id}`);
        }
        seenIds.add(emb.id);

        if (!emb.embedding || emb.embedding.length !== EMBEDDING_CONFIG.dimension) {
            errors.push(
                `Invalid embedding dimension at index ${index}: ${emb.embedding?.length}`
            );
        }

        if (emb.embedding.some(val => typeof val !== 'number' || isNaN(val))) {
            errors.push(`Invalid embedding values at index ${index}`);
        }

        if (!emb.metadata || !emb.metadata.type) {
            errors.push(`Missing metadata.type at index ${index}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

export const getEmbeddingStats = (embeddings: EmbeddingResult[]) => {
    const stats = {
        total: embeddings.length,
        byType: {} as Record<string, number>,
        avgTextLength: 0,
        avgEmbeddingNorm: 0,
        uniqueIds: new Set(embeddings.map(e => e.id)).size
    };

    let totalTextLength = 0;
    let totalNorm = 0;

    embeddings.forEach(emb => {
        const type = emb.metadata.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        totalTextLength += emb.text.length;

        const norm = Math.sqrt(
            emb.embedding.reduce((sum, val) => sum + val * val, 0)
        );
        totalNorm += norm;
    });

    stats.avgTextLength = Math.round(totalTextLength / embeddings.length);
    stats.avgEmbeddingNorm = totalNorm / embeddings.length;

    return stats;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export { EMBEDDING_CONFIG, EmbeddingResult, EmbeddingProgress };