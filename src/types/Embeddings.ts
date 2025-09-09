export interface Embeddings {
    id: string,
    text: string,
    embedding: number[],
    metadata: {
        [key: string]: string | number | boolean | string[] | number[] | boolean[]
    }
}