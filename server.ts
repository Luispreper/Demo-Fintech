import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Proxy for CoinGecko Prices
  app.get("/api/crypto/prices", async (req, res) => {
    const { ids } = req.query;
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("CoinGecko Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from CoinGecko" });
    }
  });

  // Proxy for CoinGecko Market Chart (Historical)
  app.get("/api/crypto/market_chart", async (req, res) => {
    const { id, days } = req.query;
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("CoinGecko History Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch history from CoinGecko" });
    }
  });

  // Proxy for Yahoo Finance Search
  app.get("/api/yahoo/search", async (req, res) => {
    const { q } = req.query;
    try {
      // Must include a User-Agent to prevent Yahoo from blocking the request occasionally
      const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${q}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Yahoo Search Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from Yahoo Search" });
    }
  });

  // Proxy for Yahoo Finance Chart / Quote
  app.get("/api/yahoo/chart", async (req, res) => {
    const { ticker, range, interval } = req.query;
    let url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    if (range && interval) {
      url += `?range=${range}&interval=${interval}`;
    }
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Yahoo Chart Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from Yahoo Chart" });
    }
  });

  // Vite middleware or static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
