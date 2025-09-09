import express from "express";
import {messageIa} from "../controllers/userChat.controller";
import {limiter} from "../middleware/rateLimiter";

const router = express.Router()

router.post('/api/ia-me', limiter ,messageIa)

export default router