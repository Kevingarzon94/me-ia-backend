import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userChatRouter from "./routes/userChat.route";

dotenv.config()

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];

app.set('trust proxy', 1);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}))

const PORT = Number(process.env.PORT) || 8080;

app.use(express.json())

app.use(userChatRouter)

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port: ${PORT}`);
});