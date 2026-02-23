import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config()

let groqClient: Groq | null = null

export const getGroqClient = () => {
    if (!groqClient) {
        groqClient = new Groq({
            apiKey: process.env.GROQ_API_KEY
        })
    }

    return groqClient
}