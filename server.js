require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple knowledge base for prompt
const wzatcoKnowledge = `
WZATCO Projectors — Basic Info:

1. Models: WZATCO S6, WZATCO X1 Pro, WZATCO Alpha, WZATCO DLP series.
2. Features: Native 1080p, 4K support, 600–900 ANSI lumens, Android 9.0, Wi-Fi, Bluetooth.
3. Common Issues:
   - No sound: Check HDMI cable, input source, projector volume.
   - Remote not working: Try replacing batteries, line of sight.
   - Blurry image: Adjust focus ring and keystone settings.
4. Warranty: 1-year service warranty from purchase date. Keep invoice for claims.
5. Return policy: 7 days for replacement on manufacturing defects (varies by seller).

Support Tips:
- For Wi-Fi issues: Restart router or reset projector network settings.
- For casting: Use "Wireless Display" or Miracast options from Android or Windows.
- For firmware updates: Go to Settings > Update or use USB with firmware file from support team.
`;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Message is required" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a support assistant for WZATCO projectors. Only use the info below to answer. If not known, say you’ll escalate.

          ${wzatcoKnowledge}`
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const answer = completion.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Bot failed" });
  }
});

app.listen(PORT, () => {
  console.log(`UNODOER bot running at http://localhost:${PORT}`);
});
