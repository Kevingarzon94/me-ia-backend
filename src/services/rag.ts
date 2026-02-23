import { searchChunks } from "./searchChunks"
import { getGroqChatCompletion } from "./llm"

export const handleUserQuery = async (query: string): Promise<string> => {

    const relevantChunks = await searchChunks(query, 15)
    const context = relevantChunks
        .filter((chunk) => (chunk.score || 0) >= 0.7) // Filtrar chunks poco relevantes
        .map((chunk, index) => {
            const text = chunk.metadata?.text || '';
            const type = chunk.metadata?.type || 'info';
            return `[${(type as string).toUpperCase()}] ${text}`;
        })
        .join('\n\n');

    return await getGroqChatCompletion(query, context)
}