require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Chat Endpoint
app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message received' });

  try {
    const faqRes = await axios.get(process.env.FAQ_SHEET_URL);
    const faqs = faqRes.data;
    const match = faqs.find(faq =>
      message.toLowerCase().includes(faq.Question.toLowerCase())
    );

    if (match) {
      return res.json({ source: 'faq', answer: match.Answer });
    }

    // GPT fallback
    const gptRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful support assistant for UNODOER. Only use information from the company knowledge base.',
          },
          { role: 'user', content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = gptRes.data.choices[0].message.content;
    res.json({ source: 'gpt', answer: reply });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(500).json({ error: 'Bot failed' });
  }
});

// Ticket Endpoint
app.post('/ticket', async (req, res) => {
  const { name, contact, product, issue, history, attachment } = req.body;
  const ticketId = `TKT-${Date.now()}`;

  try {
    await axios.post(process.env.TICKET_SHEET_URL, {
      'Ticket ID': ticketId,
      'Name': name,
      'Contact': contact,
      'Product': product,
      'Issue Summary': issue,
      'Status': 'Open',
      'Assigned To': '',
      'Created At': new Date().toISOString(),
      'Chat History': history || '',
      'Attachment Link': attachment || '',
      'SLA Breach?': 'No',
    });

    res.json({ success: true, ticketId });
  } catch (error) {
    console.error('Ticket creation failed:', error.message);
    res.status(500).json({ error: 'Failed to raise ticket' });
  }
});

// Feedback Endpoint
app.post('/feedback', async (req, res) => {
  const { ticketId, rating, comment } = req.body;

  try {
    await axios.post(process.env.FEEDBACK_SHEET_URL, {
      'Ticket ID': ticketId,
      'Rating (1–5)': rating,
      'Comment': comment,
      'Submitted At': new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Feedback failed:', error.message);
    res.status(500).json({ error: 'Feedback error' });
  }
});

app.listen(PORT, () =>
  console.log(`✅ UNODOER bot running on port ${PORT}`)
);

