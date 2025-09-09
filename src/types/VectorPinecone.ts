export interface VectorPinecone {
    id: string
    values: number[]
    metadata?: {
        [key: string]: string
    }
}