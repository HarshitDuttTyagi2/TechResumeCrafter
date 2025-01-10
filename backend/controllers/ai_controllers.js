import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function openai_call(req, res) {
  try {
    const { userMessage, messages } = req.body; // Extract userMessage and messages (history) from the request

    // Debugging: Log incoming request data
    console.log("Received userMessage at backend:", userMessage);
    console.log("Received messages (history) at backend:", messages);

    if (!userMessage && (!messages || messages.length === 0)) {
      console.error("Error: No userMessage or history provided");
      return res.status(400).json({ error: 'Message or history is required' });
    }

    const apikey = process.env.OPENAI_API_KEY;
    const client = new OpenAI({ apiKey: apikey });

    // Prepare the messages payload for OpenAI API
    const requestMessages = messages || []; // Use the history if provided
    if (userMessage) {
      requestMessages.push({ role: 'user', content: userMessage }); // Append the new user message
    }

    // Debugging: Log the payload being sent to OpenAI
    console.log("Sending the following messages to OpenAI API:", requestMessages);

    const response = await client.chat.completions.create({
      messages: requestMessages,
      model: 'gpt-4o-mini',
    });

    // Debugging: Log the response from OpenAI
    console.log("OpenAI API response received:", response);

    res.status(200).json({ response: response.choices[0].message.content });
  } catch (error) {
    // Debugging: Log the error details
    console.error("Error in OpenAI API call:", error);
    res.status(500).json({ error: 'Error calling OpenAI API' });
  }
}

export { openai_call };
