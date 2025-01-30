import userChats from "../models/userChats.js"

async function SavePrompt(req, res){
    try {
        const userId = 'user_2rLnLrqIUFIUTFLT6x44Xeig0Cy' || req.auth.userId;
        const { prompt } = req?.body;
        await userChats.updateOne(
            { userId: userId },
            { $set: { additional_prompt: prompt } }
        );
        res.status(200).send({success : true,  updatedPrompt: prompt });
    } catch (error) {
        console.error("Error saving prompt:", error);
        res.status(500).send("Error saving prompt.");
    }
}

export { SavePrompt };