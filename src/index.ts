import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userChatRouter from "./routes/userChat.route";

dotenv.config()

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(cors())
app.use(express.json())

app.use(userChatRouter)

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port: ${PORT}`);
});