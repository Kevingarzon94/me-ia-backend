import { TokenTextSplitter } from '@langchain/textsplitters'
import {Chunk} from "../types/Chunk";

const splitter = new TokenTextSplitter({
    encodingName: 'gpt2',
    chunkSize: 200,
    chunkOverlap: 30,
    keepSeparator: true
})

export const processChunks = async (originalChunks: Chunk[]) => {
    const processedChunk: Chunk[] = []

    for (const chunk of originalChunks) {
        if (chunk.text.length < 400) {
            processedChunk.push(chunk)
            continue
        }

        const splitTexts = await splitter.splitText(chunk.text)

        splitTexts.forEach((text, index) => {
            processedChunk.push({
                text,
                metadata: {
                    ...chunk.metadata,
                    chunk: index.toString(),
                    parentChunk: chunk.metadata.type
                }
            })
        })
    }

    return processedChunk
}