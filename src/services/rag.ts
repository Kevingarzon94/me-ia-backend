import {searchChunks} from "./searchChunks"
import {getGroqChatCompletion} from "./llm"

export const handleUserQuery = async (query: string): Promise<string> => {

    const relevantChunks = await searchChunks(query, 3)
    const context = relevantChunks
        .map((chunk) => chunk.metadata?.text || '')
        .join('\n')

    return await getGroqChatCompletion(query, context)
}