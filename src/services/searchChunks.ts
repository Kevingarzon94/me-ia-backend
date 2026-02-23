import { getPineconeIndex } from '../config/pinecone'
import { generateEmbeddings } from '../config/embeddings'

export const searchChunks = async (query: string, topK = 15) => {
    const index = await getPineconeIndex()
    const queryEmbeddings = await generateEmbeddings(query)

    const results = await index.query({
        vector: queryEmbeddings,
        topK,
        includeMetadata: true,
    })

    return results.matches
}