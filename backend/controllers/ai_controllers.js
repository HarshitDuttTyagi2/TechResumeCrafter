import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function openai_call(req, res) {
  try {
    const { userMessage } = req.body;  // Extract user message from the request

    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apikey = process.env.OPENAI_API_KEY;
    const client = new OpenAI({ apiKey: apikey });

    const response = await client.chat.completions.create({
      messages: [{ role: 'user', content: userMessage }],
      model: 'gpt-4o-mini',
    });

    res.status(200).json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calling OpenAI API' });
  }
}

export { openai_call };
