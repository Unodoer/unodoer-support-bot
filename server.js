require("dotenv").config();
const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

let data = [];

// Load CSV content on server start
fs.createReadStream("wzatco_full_scrape.csv")
  .pipe(csv())
  .on("data", (row) => {
    data.push({
      title: row["Page Title"],
      url: row["URL"],
      text: row["Extracted Text"]
    });
  })
  .on("end", () => {
    console.log("✅ Data loaded from wzatco_full_scrape.csv");
  });

// Search endpoint
app.get("/search", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";
  if (!query) return res.status(400).json({ error: "Missing search query." });

  const results = data.filter((entry) =>
    entry.text.toLowerCase().includes(query)
  );

  res.json(results.slice(0, 10)); // return top 10
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
