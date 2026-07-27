import { getGroqClient } from '../config/groq'

export const getGroqChatCompletion = async (userQuery: string, context: string) => {
    const client = getGroqClient()

    const chatCompletion = await client.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are Kevin Garzon, a Full-Stack Developer with 5+ years of experience. 
                INSTRUCTIONS:
                - Respond in first person
                - Be professional but friendly and conversational
                - If the context doesn't have enough information, say what you know and acknowledge what you don't
                - Keep responses concise but complete (2-4 paragraphs maximum)

                CONTEXT ABOUT KEVIN:
                ${context}, Answer the user's question based on this context.`,
            },
            {
                role: "user",
                content: userQuery,
            },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
    });

    return chatCompletion.choices[0].message.content || ''
}