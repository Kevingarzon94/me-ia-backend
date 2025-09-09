import {pipeline} from "@xenova/transformers";
import {Chunk} from "../types/Chunk";

const generatorEmbedding = async (text: string) => {
    const generator = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    const output = await generator(text, {pooling: 'mean', normalize: true})
    return Array.from(output.data)
}

export const generateEmbeddings = async (chunk: Chunk[]) => {

    const embeddings = []

    for (let i = 0; i < chunk.length; i++) {

        const vector = await generatorEmbedding(chunk[i].text)

        embeddings.push({
            id: `chunk_${i}`,
            text: chunk[i].text,
            embedding: vector,
            metadata: chunk[i].metadata
        })
    }

    return embeddings
}