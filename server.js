require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
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
const FAQ_SHEET_URL = process.env.FAQ_SHEET_URL;
const TICKET_SHEET_URL = process.env.TICKET_SHEET_URL;
const FEEDBACK_SHEET_URL = process.env.FEEDBACK_SHEET_URL;

// Chat Endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Message is required" });

  try {
    // 1. Try match from FAQ Sheet
    const { data: faqData } = await axios.get(FAQ_SHEET_URL);
    const matched = faqData.find((row) => row.Question?.toLowerCase().trim() === userMessage.toLowerCase().trim());

    if (matched && matched.Answer) {
      return res.json({ answer: matched.Answer });
    }

    // 2. Fallback to GPT
    const gptPrompt = `You are a helpful support assistant for UNODOER customers. Reply clearly using only the product knowledge shared with you. User question: "${userMessage}"`;

    console.log("Sending to GPT:", gptPrompt);

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

// Ticket Endpoint
app.post("/ticket", async (req, res) => {
  const { name, email, issue, product, message, fileUrl } = req.body;
  if (!name || !email || !issue || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const ticketId = uuidv4().slice(0, 8).toUpperCase();
    const submissionTime = new Date().toISOString();

    const row = {
      Timestamp: submissionTime,
      TicketID: ticketId,
      Name: name,
      Email: email,
      Product: product || "",
      Issue: issue,
      Message: message,
      FileURL: fileUrl || "",
      Status: "Open"
    };

    await axios.post(TICKET_SHEET_URL, row);
    res.json({ success: true, ticketId });
  } catch (err) {
    console.error("Ticket error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Ticket submission failed" });
  }
});

// Feedback Endpoint
app.post("/feedback", async (req, res) => {
  const { ticketId, rating, comment } = req.body;
  if (!ticketId || !rating) {
    return res.status(400).json({ error: "Ticket ID and rating required" });
  }

  try {
    const feedbackRow = {
      Timestamp: new Date().toISOString(),
      TicketID: ticketId,
      Rating: rating,
      Comment: comment || ""
    };

    await axios.post(FEEDBACK_SHEET_URL, feedbackRow);
    res.json({ success: true });
  } catch (err) {
    console.error("Feedback error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Feedback submission failed" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`UNODOER bot running on http://localhost:${PORT}`);
});
