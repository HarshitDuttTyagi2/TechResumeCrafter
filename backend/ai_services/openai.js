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

    // Request for streaming completion
    const stream = await client.chat.completions.create({
      messages: [{ role: 'user', content: userMessage }],
      model: 'gpt-4o-mini',
      stream: true, // Enable streaming
    });

    let accumulatedText = "";
    
    // Iterate over the streamed response chunks
    for await (const chunk of stream) {
      // Accumulate the response and send it to the client progressively
      const chunkText = chunk.choices[0]?.delta?.content || "";
      accumulatedText += chunkText;

      // You can optionally send the partial response to the client in real-time
      res.write(chunkText); // Streaming the response back to the client
    }

    // Once streaming is done, end the response
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calling OpenAI API' });
  }
}

export { openai_call };
