require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const FAQ_SHEET_URL = "https://opensheet.elk.sh/2PACX-1vRLYq0Txorl8EeZ-l-j-m5gVaRCVO3qj879h5QW17MUZDdXe5n5Q1T_xhCNQC2oPhODLfSyLHFFYhfK/FAQs";

// Chat route
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Message is required." });

  try {
    // 1. Try match from FAQ sheet
    const { data: faqData } = await axios.get(FAQ_SHEET_URL);
    const match = faqData.find((row) =>
      row.Question?.toLowerCase().trim() === userMessage.toLowerCase().trim()
    );

    if (match && match.Answer) {
      return res.json({ answer: match.Answer });
    }

    // 2. Fallback to GPT-4
    const systemPrompt = `You are a helpful support assistant for WZATCO customers. Use accurate and helpful language based on WZATCO projector knowledge.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn’t generate a response.";
    res.json({ answer: reply });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "ChatGPT or FAQ fetch failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 UNODOER support bot running on http://localhost:${PORT}`);
});
