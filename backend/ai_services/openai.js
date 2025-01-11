import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function openai_call(req, res) {
  try {
    const { messages } = req.body; // Extract `messages` from the request body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required and should be a non-empty array' });
    }

    // Log the received messages
    console.log("Chat history received at backend:", messages);

    const apikey = process.env.OPENAI_API_KEY;
    const client = new OpenAI({ apiKey: apikey });

    // Log a checkpoint before making the OpenAI call
    console.log("Making OpenAI API call with history:", messages);

    // Request for streaming completion
    const stream = await client.chat.completions.create({
      messages: messages.map((msg) => ({
        role: msg.role || 'user',
        content: msg.parts?.[0]?.text || msg.text || '',
      })),
      model: 'gpt-4', // Adjust the model if needed
      stream: true, // Enable streaming
    });

    let accumulatedText = "";

    // Log a checkpoint after receiving the response
    console.log("OpenAI API streaming response started");

    // Set headers to indicate streaming response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Stream response to client
    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || "";
      accumulatedText += chunkText;

      // Log each chunk received
      console.log("Streamed chunk received:", chunkText);

      // Write the chunk to the response as JSON
      res.write(JSON.stringify({ text: chunkText }));
    }

    // Log the final accumulated response
    console.log("Final response accumulated:", accumulatedText);

    // End the response once streaming is complete
    res.end();
  } catch (error) {
    console.error("Error in OpenAI API call:", error);

    // Ensure the response is properly ended on error
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error calling OpenAI API', details: error.message });
    } else {
      res.end();
    }
  }
}

export { openai_call };
