require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Config
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat Endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Message is required" });

  try {
    const gptPrompt = `You are a helpful support assistant for UNODOER customers. Respond clearly and politely. Question: "${userMessage}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: gptPrompt }],
    });

    const gptReply = completion.choices[0]?.message?.content || "Sorry, I couldn’t generate a response.";
    res.json({ answer: gptReply });
  } catch (err) {
    console.error("Chatbot error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Bot failed" });
  }
});

// Optional: Keep ticket & feedback endpoints if needed
app.listen(PORT, () => {
  console.log(`UNODOER bot running at http://localhost:${PORT}`);
});
