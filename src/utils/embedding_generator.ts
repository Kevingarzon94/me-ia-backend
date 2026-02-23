import { pipeline } from "@xenova/transformers";
import { Chunk } from "../types/Chunk";
import crypto from 'crypto';

// ==================== TIPOS ====================

interface EmbeddingResult {
    id: string;
    text: string;
    embedding: number[];
    metadata: Record<string, any>;
}

interface EmbeddingProgress {
    processed: number;
    total: number;
    percentage: number;
}

// ==================== CONFIGURACIÓN ====================

const EMBEDDING_CONFIG = {
    model: 'Xenova/all-MiniLM-L6-v2',
    dimension: 384, // Dimensión del modelo all-MiniLM-L6-v2
    pooling: 'mean' as const,
    normalize: true,
    batchSize: 10, // Procesar en batches para mejor performance
    maxRetries: 3
};

// ==================== CACHE DEL GENERADOR ====================

let cachedGenerator: any = null;

/**
 * Obtiene o crea el generador de embeddings (singleton)
 * Esto evita recargar el modelo en cada llamada
 */
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

// ==================== GENERACIÓN DE IDs ÚNICOS ====================

/**
 * Genera un ID único y descriptivo para cada chunk
 * Formato: {type}_{section}_{hash}
 * Ejemplo: "faq_technical_a1b2c3d4"
 */
const generateChunkId = (chunk: Chunk, index: number): string => {
    const metadata = chunk.metadata;

    // Si ya tiene un ID en metadata, usarlo como base
    if (metadata.id) {
        return `${metadata.id}_${generateHash(chunk.text, 8)}`;
    }

    // Construir ID descriptivo
    const parts: string[] = [];

    // Tipo
    if (metadata.type) {
        parts.push(metadata.type as string);
    }

    // Sección o contexto adicional
    if (metadata.section) {
        parts.push(metadata.section as string);
    } else if (metadata.company) {
        parts.push((metadata.company as string).replace(/\s+/g, '_').toLowerCase());
    } else if (metadata.category) {
        parts.push(metadata.category as string);
    }

    // Hash del contenido para unicidad
    const hash = generateHash(chunk.text, 8);
    parts.push(hash);

    // Fallback: usar índice si no hay suficiente info
    if (parts.length === 1) {
        parts.push(`idx_${index}`);
    }

    return parts.join('_');
};

/**
 * Genera un hash corto del texto para unicidad
 */
const generateHash = (text: string, length: number = 8): string => {
    const hash = crypto
        .createHash('md5')
        .update(text)
        .digest('hex');
    return hash.substring(0, length);
};

// ==================== GENERACIÓN DE EMBEDDINGS ====================

/**
 * Genera embedding para un texto individual
 */
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

        // Validar dimensión
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

/**
 * Genera embeddings para un array de chunks
 * Procesa en batches para mejor rendimiento
 */
export const generateEmbeddings = async (
    chunks: Chunk[],
    onProgress?: (progress: EmbeddingProgress) => void
): Promise<EmbeddingResult[]> => {
    console.log(`Generating embeddings for ${chunks.length} chunks...`);

    const embeddings: EmbeddingResult[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    // Procesar en batches
    for (let i = 0; i < chunks.length; i += EMBEDDING_CONFIG.batchSize) {
        const batch = chunks.slice(i, i + EMBEDDING_CONFIG.batchSize);

        // Procesar batch en paralelo
        const batchPromises = batch.map(async (chunk, batchIndex) => {
            const globalIndex = i + batchIndex;

            try {
                // Validar que el chunk tenga texto
                if (!chunk.text || chunk.text.trim().length === 0) {
                    throw new Error('Chunk has empty text');
                }

                // Generar embedding
                const embedding = await generateSingleEmbedding(chunk.text);

                // Generar ID único
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

        // Esperar a que termine el batch
        const batchResults = await Promise.all(batchPromises);

        // Agregar resultados exitosos
        batchResults.forEach(result => {
            if (result) {
                embeddings.push(result);
            }
        });

        // Reportar progreso
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

    // Reporte final
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

/**
 * Genera un solo embedding para testing o consultas
 */
export const generateQueryEmbedding = async (query: string): Promise<number[]> => {
    if (!query || query.trim().length === 0) {
        throw new Error('Query cannot be empty');
    }

    return generateSingleEmbedding(query);
};

/**
 * Valida que los embeddings generados sean correctos
 */
export const validateEmbeddings = (embeddings: EmbeddingResult[]): {
    valid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];
    const seenIds = new Set<string>();

    embeddings.forEach((emb, index) => {
        // Validar ID único
        if (seenIds.has(emb.id)) {
            errors.push(`Duplicate ID found: ${emb.id}`);
        }
        seenIds.add(emb.id);

        // Validar embedding
        if (!emb.embedding || emb.embedding.length !== EMBEDDING_CONFIG.dimension) {
            errors.push(
                `Invalid embedding dimension at index ${index}: ${emb.embedding?.length}`
            );
        }

        // Validar que el embedding tenga valores numéricos
        if (emb.embedding.some(val => typeof val !== 'number' || isNaN(val))) {
            errors.push(`Invalid embedding values at index ${index}`);
        }

        // Validar metadata
        if (!emb.metadata || !emb.metadata.type) {
            errors.push(`Missing metadata.type at index ${index}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Obtiene estadísticas de los embeddings generados
 */
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
        // Contar por tipo
        const type = emb.metadata.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Longitud de texto
        totalTextLength += emb.text.length;

        // Norma del embedding (debería ser ~1 si está normalizado)
        const norm = Math.sqrt(
            emb.embedding.reduce((sum, val) => sum + val * val, 0)
        );
        totalNorm += norm;
    });

    stats.avgTextLength = Math.round(totalTextLength / embeddings.length);
    stats.avgEmbeddingNorm = totalNorm / embeddings.length;

    return stats;
};

// ==================== UTILIDADES ====================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exportar configuración
export { EMBEDDING_CONFIG, EmbeddingResult, EmbeddingProgress };