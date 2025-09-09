import { getPineconeIndex } from '../config/pinecone'
import {Embeddings} from "../types/Embeddings";
import {VectorPinecone} from "../types/VectorPinecone";



export const upsertEmbeddings = async (embeddings: Embeddings[]) => {

    const index = await getPineconeIndex()

    const vector: VectorPinecone[] = embeddings.map((embedding) => {
        return {
            id: embedding.id,
            values: embedding.embedding,
            metadata: {
                text: embedding.text,
                ...embedding.metadata
            }
        }
    })
    await index.upsert(vector)

}