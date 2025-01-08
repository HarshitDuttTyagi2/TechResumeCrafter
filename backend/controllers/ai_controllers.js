import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function openai_call(req, res){
    try {
        console.log(process.env.OPENAI_API_KEY)
        const apikey = process.env.OPENAI_API_KEY;
        const client = new OpenAI({ apiKey: apikey });

        const response = await client.chat.completions.create({
            messages: [{ role: 'user', content: 'hi my name is harshit' }],
            model: 'gpt-4o-mini'
        });

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error calling OpenAI API' });
    }
}

export { openai_call }