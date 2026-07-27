import { getPineconeIndex } from '../config/pinecone'
import type { RecordMetadata } from '@pinecone-database/pinecone';

// ==================== TIPOS ====================

interface Embeddings {
    id: string;
    text: string;
    embedding: number[];
    metadata: Record<string, any>;
}

interface VectorPinecone {
    id: string;
    values: number[];
    metadata: RecordMetadata;
}

interface UpsertProgress {
    processed: number;
    total: number;
    percentage: number;
    currentBatch: number;
    totalBatches: number;
}

interface UpsertResult {
    success: boolean;
    totalVectors: number;
    successfulVectors: number;
    failedVectors: number;
    errors: Array<{ batchIndex: number; error: string }>;
}

// ==================== CONFIGURACIÓN ====================

const UPSERT_CONFIG = {
    // Pinecone recomienda batches de 100 vectores
    batchSize: 100,

    // Límite de metadata en Pinecone: 40KB por vector
    // Truncar texto si es muy largo
    maxMetadataTextLength: 2000, // caracteres

    // Reintentos en caso de error
    maxRetries: 3,

    // Delay entre batches para evitar rate limits
    delayBetweenBatches: 100, // ms
};

// ==================== UTILIDADES ====================

/**
 * Trunca el texto si excede el límite de metadata
 */
const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
};

/**
 * Limpia y optimiza metadata para Pinecone
 */
const cleanMetadata = (
    text: string,
    metadata: Record<string, any>
): RecordMetadata => {
    const cleaned: Record<string, any> = {
        // Texto truncado para búsqueda
        text: truncateText(text, UPSERT_CONFIG.maxMetadataTextLength),

        // Longitud original del texto
        originalTextLength: text.length,
    };

    // Copiar metadata útil, convirtiendo a tipos compatibles con Pinecone
    for (const [key, value] of Object.entries(metadata)) {
        // Pinecone soporta: string, number, boolean, string[]
        if (value === null || value === undefined) {
            continue;
        }

        if (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean') {
            cleaned[key] = value;
        } else if (Array.isArray(value)) {
            // Solo arrays de strings
            if (value.every(item => typeof item === 'string')) {
                cleaned[key] = value;
            } else {
                // Convertir a strings
                cleaned[key] = value.map(String);
            }
        } else if (typeof value === 'object') {
            // Serializar objetos complejos como JSON string
            cleaned[key] = JSON.stringify(value);
        }
    }

    return cleaned as RecordMetadata;
};

/**
 * Divide el array en batches
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

/**
 * Sleep utility
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Convierte embeddings a formato de Pinecone con metadata optimizada
 */
const prepareVectorsForPinecone = (embeddings: Embeddings[]): VectorPinecone[] => {
    return embeddings.map((embedding) => {
        return {
            id: embedding.id,
            values: embedding.embedding,
            metadata: cleanMetadata(embedding.text, embedding.metadata)
        };
    });
};

/**
 * Inserta un batch de vectores con reintentos
 */
const upsertBatchWithRetry = async (
    index: any,
    vectors: VectorPinecone[],
    batchIndex: number,
    retries: number = 0
): Promise<void> => {
    try {
        await index.upsert(vectors);
    } catch (error) {
        if (retries < UPSERT_CONFIG.maxRetries) {
            const delay = Math.pow(2, retries) * 1000; // Backoff exponencial
            console.warn(
                `Batch ${batchIndex} failed, retrying in ${delay}ms (attempt ${retries + 1}/${UPSERT_CONFIG.maxRetries})...`
            );
            await sleep(delay);
            return upsertBatchWithRetry(index, vectors, batchIndex, retries + 1);
        }
        throw error;
    }
};

/**
 * Inserta embeddings en Pinecone con batching, reintentos y progreso
 */
export const upsertEmbeddings = async (
    embeddings: Embeddings[],
    onProgress?: (progress: UpsertProgress) => void
): Promise<UpsertResult> => {
    console.log(`\nStarting upsert of ${embeddings.length} vectors to Pinecone...`);

    const result: UpsertResult = {
        success: false,
        totalVectors: embeddings.length,
        successfulVectors: 0,
        failedVectors: 0,
        errors: []
    };

    try {
        // Validar que hay embeddings
        if (!embeddings || embeddings.length === 0) {
            throw new Error('No embeddings to upsert');
        }

        // Obtener índice de Pinecone
        const index = await getPineconeIndex();

        // Preparar vectores
        console.log('Preparing vectors for Pinecone...');
        const vectors = prepareVectorsForPinecone(embeddings);

        // Validar vectores
        validateVectors(vectors);

        // Dividir en batches
        const batches = chunkArray(vectors, UPSERT_CONFIG.batchSize);
        console.log(`Split into ${batches.length} batches of ${UPSERT_CONFIG.batchSize} vectors`);

        // Procesar cada batch
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];

            try {
                // Insertar batch con reintentos
                await upsertBatchWithRetry(index, batch, i);

                result.successfulVectors += batch.length;

                // Progreso
                const progress: UpsertProgress = {
                    processed: Math.min((i + 1) * UPSERT_CONFIG.batchSize, embeddings.length),
                    total: embeddings.length,
                    percentage: Math.round(((i + 1) / batches.length) * 100),
                    currentBatch: i + 1,
                    totalBatches: batches.length
                };

                console.log(
                    `Progress: Batch ${progress.currentBatch}/${progress.totalBatches} ` +
                    `(${progress.processed}/${progress.total} vectors, ${progress.percentage}%)`
                );

                if (onProgress) {
                    onProgress(progress);
                }

                // Delay entre batches para evitar rate limits
                if (i < batches.length - 1) {
                    await sleep(UPSERT_CONFIG.delayBetweenBatches);
                }

            } catch (error) {
                console.error(`Failed to upsert batch ${i}:`, error);
                result.failedVectors += batch.length;
                result.errors.push({
                    batchIndex: i,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        // Resultado final
        result.success = result.failedVectors === 0;

        console.log('\n=== Upsert Summary ===');
        console.log(`Total vectors: ${result.totalVectors}`);
        console.log(`Successful: ${result.successfulVectors}`);
        console.log(`Failed: ${result.failedVectors}`);

        if (result.errors.length > 0) {
            console.error('\nErrors encountered:');
            result.errors.forEach(({ batchIndex, error }) => {
                console.error(`  Batch ${batchIndex}: ${error}`);
            });
        }

        return result;

    } catch (error) {
        console.error('Fatal error during upsert:', error);
        result.success = false;
        result.failedVectors = embeddings.length;
        result.errors.push({
            batchIndex: -1,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return result;
    }
};

/**
 * Valida vectores antes de insertar en Pinecone
 */
const validateVectors = (vectors: VectorPinecone[]): void => {
    const errors: string[] = [];
    const seenIds = new Set<string>();

    vectors.forEach((vector, index) => {
        // Validar ID
        if (!vector.id || typeof vector.id !== 'string') {
            errors.push(`Vector ${index}: Invalid ID`);
        }

        // Validar IDs duplicados
        if (seenIds.has(vector.id)) {
            errors.push(`Vector ${index}: Duplicate ID "${vector.id}"`);
        }
        seenIds.add(vector.id);

        // Validar values
        if (!Array.isArray(vector.values) || vector.values.length === 0) {
            errors.push(`Vector ${index}: Invalid or empty values array`);
        }

        // Validar que todos los values sean números
        if (vector.values.some(val => typeof val !== 'number' || isNaN(val))) {
            errors.push(`Vector ${index}: values contains non-numeric or NaN values`);
        }

        // Validar metadata
        if (!vector.metadata) {
            errors.push(`Vector ${index}: Missing metadata`);
        }

        // Validar que metadata.text exista
        if (!vector.metadata?.text) {
            errors.push(`Vector ${index}: Missing metadata.text`);
        }
    });

    if (errors.length > 0) {
        throw new Error(
            `Vector validation failed:\n${errors.slice(0, 10).join('\n')}` +
            (errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : '')
        );
    }
};

// ==================== EXPORTACIONES ====================

export {
    UPSERT_CONFIG,
    UpsertProgress,
    UpsertResult,
    Embeddings,
    VectorPinecone
};