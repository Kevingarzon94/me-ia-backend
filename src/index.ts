import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userChatRouter from "./routes/userChat.route";

dotenv.config()

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json())

app.use(userChatRouter)

app.listen(PORT, ()=>{
    console.log(`Server is running on port: ${PORT}`)
})