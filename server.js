require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve frontend

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Message is required." });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // ✅ GPT-4 here
      messages: [{ role: "user", content: userMessage }],
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    res.json({ answer: reply });
  } catch (err) {
    console.error("❌ GPT error:", err);
    res.status(500).json({ error: "GPT-4 API call failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 UNODOER bot (GPT-4) running on http://localhost:${PORT}`);
});
