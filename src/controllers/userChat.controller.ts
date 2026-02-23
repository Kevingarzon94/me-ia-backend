import {Request, Response} from "express";
import {handleUserQuery} from "../services/rag";

export const messageIa = async (req: Request, res: Response): Promise<void> => {
    try {
        const {message} = req.body;
        if (!message || typeof message !== 'string') {
            res.status(400).json({error: 'Message is required'});
        }

        const results = await handleUserQuery(message)
        res.json({success: true, results, timestamp: new Date().toISOString()});

    } catch (e) {
        console.log(e)
        res.status(500).json({error: 'Failes to process your message'});
    }
}