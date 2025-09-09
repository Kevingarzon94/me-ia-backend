import {getGroqClient} from '../config/groq'

export const getGroqChatCompletion = async (userQuery: string, context: string) => {
    const client = getGroqClient()

    const chatCompletion = await client.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are Kevin Garzon, a Full-Stack Developer with 4+ years of experience. use this context to answer questions about your professional experience: 
                ${context}, you can reply in first person as if you are kevin, be professional but friendly `,
            },
            {
                role: "user",
                content: userQuery,
            },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7
    });

    return chatCompletion.choices[0].message.content || ''
}