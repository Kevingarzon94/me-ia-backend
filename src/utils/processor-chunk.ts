import { TokenTextSplitter } from '@langchain/textsplitters'
import { Chunk } from "../types/Chunk";
import { get_encoding } from "tiktoken";

const CHUNK_CONFIG = {
    encodingName: 'cl100k_base' as const,
    chunkSize: 512,
    chunkOverlap: 50,
    keepSeparator: true,
}
const CHARACTER_THRESHOLD = 1500;

const tokencount = get_encoding("cl100k_base")

const splitter = new TokenTextSplitter({
    encodingName: CHUNK_CONFIG.encodingName,
    chunkSize: CHUNK_CONFIG.chunkSize,
    chunkOverlap: CHUNK_CONFIG.chunkOverlap,
    keepSeparator: CHUNK_CONFIG.keepSeparator
});

export const processChunks = async (originalChunks: Chunk[]): Promise<Chunk[]> => {
    const processedChunks: Chunk[] = []

    for (const chunk of originalChunks) {
        try {
            if (chunk.text.length < CHARACTER_THRESHOLD) {
                processedChunks.push({
                    ...chunk,
                    metadata: {
                        ...chunk.metadata,
                        originalLength: chunk.text.length.toString(),
                        wasSplit: 'false',
                        tokenCount: countTokens(chunk.text)
                    }
                })
                continue
            }

            const splitTexts = await splitter.splitText(chunk.text)

            if (splitTexts.length === 1) {
                processedChunks.push({
                    ...chunk,
                    metadata: {
                        ...chunk.metadata,
                        originalLength: chunk.text.length.toString(),
                        wasSplit: 'false',
                        tokenCount: countTokens(chunk.text)
                    }
                })
                continue
            }

            for (let index = 0; index < splitTexts.length; index++) {
                const text = splitTexts[index];
                processedChunks.push({
                    text,
                    metadata: {
                        ...chunk.metadata,
                        originalLength: chunk.text.length,
                        wasSplit: 'true',
                        chunkIndex: index,
                        totalChunks: splitTexts.length,
                        parentType: chunk.metadata.type || 'unknown',
                        parentId: chunk.metadata.id || 'unknown',
                        tokenCount: countTokens(text),
                        isFirstChunk: index === 0,
                        isLastChunk: index === splitTexts.length - 1
                    }
                });
            }

        } catch (error) {
            console.error(`Error processing chunk of type ${chunk.metadata.type}:`, error)
            processedChunks.push({
                ...chunk,
                metadata: {
                    ...chunk.metadata,
                    processingError: 'true',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    wasSplit: 'false'
                }
            })
        }
    }

    return processedChunks
}

const countTokens = (text: string): number => {
    const count = tokencount.encode(text).length
    console.log(count)
    return count
};