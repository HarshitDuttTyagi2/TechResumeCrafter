import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function openai_call(req, res) {
  try {
    const { userMessage, messages } = req.body; // Extract `userMessage` and `messages` from the request body

    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Log the user message and the history
    console.log("User message received at backend:", userMessage);
    console.log("Chat history received at backend:", messages);

    const apikey = process.env.OPENAI_API_KEY;
    const client = new OpenAI({ apiKey: apikey });

    // Log a checkpoint before making the OpenAI call
    console.log("Making OpenAI API call with history:", messages);

    // Request for streaming completion
    const stream = await client.chat.completions.create({
      messages: [{ role: 'user', content: userMessage }, ...messages], // Pass the user message and history to OpenAI
      model: 'gpt-4o-mini',
      stream: true, // Enable streaming
    });

    let accumulatedText = "";

    // Log a checkpoint after receiving the response
    console.log("OpenAI API streaming response started");

    // Iterate over the streamed response chunks
    for await (const chunk of stream) {
      // Accumulate the response and send it to the client progressively
      const chunkText = chunk.choices[0]?.delta?.content || "";
      accumulatedText += chunkText;

      // Log each chunk received
      console.log("Streamed chunk received:", chunkText);

      // You can optionally send the partial response to the client in real-time
      res.write(chunkText); // Streaming the response back to the client
    }

    // Log the final accumulated response
    console.log("Final response accumulated:", accumulatedText);

    // Once streaming is done, end the response
    res.end();
  } catch (error) {
    console.error("Error in OpenAI API call:", error);
    res.status(500).json({ error: 'Error calling OpenAI API' });
  }
}

export { openai_call };
