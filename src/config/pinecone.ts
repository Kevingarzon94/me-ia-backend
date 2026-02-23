import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';

dotenv.config()

let pineconeClient: Pinecone | null = null;

export const initPineconeClient = async () => {
    if (!pineconeClient) {
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY || '',
        });
    }
    return pineconeClient;
};

export const getPineconeIndex = async () => {
    const client = await initPineconeClient();
    return client.index(process.env.PINECONE_INDEX || '');
};