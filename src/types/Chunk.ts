export interface Chunk {
    text: string;
    metadata: {
        [key: string]: string | number | string[] | undefined | boolean;
    }
}