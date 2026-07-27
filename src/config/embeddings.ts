import {FeatureExtractionPipeline, pipeline} from "@xenova/transformers";

let embedder: FeatureExtractionPipeline | null = null

export const getEmbedder = async () => {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    }
    return embedder
}

export const generateEmbeddings = async (text: string) => {
    const embedder = await getEmbedder()
    const output = await embedder(text, {pooling: 'mean', normalize: true})
    console.log(`RAM tras cargar modelo: ${process.memoryUsage().rss / 1024 / 1024} MB`)
    return Array.from(output.data) as number[]
}