import cors from "cors";
import express from "express";
import cv from "../cv.json" with { type: "json" };
import { sendEmail } from "./email.js";

export function makeRestApp() {
  const app = express();
  app.use(express.json());

  // CORS for optional Next.js playground
  const origins = (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  
  // Always enable CORS for development
  const corsOptions = {
    origin: origins.length > 0 ? origins : ["https://mcp-cv-praser-j81a.vercel.app/"],
    allowedHeaders: ["Content-Type", "Mcp-Session-Id"],
    exposedHeaders: ["Mcp-Session-Id"],
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  };
  
  app.use(cors(corsOptions));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Very small CV Q&A for demo purposes
  app.post("/rest/chat", (req, res) => {
    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: "Missing question" });

    const q = question.toLowerCase();

    if (q.includes("last position") || q.includes("most recent role") || q.includes("current role")) {
      const last = cv.experience[0];
      return res.json({ answer: `Your last position was ${last.role} at ${last.company} (${last.period}).` });
    }
    if (q.includes("skills")) {
      return res.json({ answer: `Skills: ${cv.skills.join(", ")}.` });
    }
    if (q.includes("experience") || q.includes("work history")) {
      const lines = cv.experience.map((e) => `${e.role} @ ${e.company} (${e.period})`).join(" | ");
      return res.json({ answer: lines });
    }

    return res.json({ answer: "I can answer about your last position, skills, and experience. Try asking 'What role did I have at my last position?'" });
  });

  app.post("/rest/send-email", async (req, res) => {
    try {
      const { recipient, subject, body } = req.body || {};
      if (!recipient || !subject || !body) {
        return res.status(400).json({ error: "recipient, subject and body are required" });
      }
      const result = await sendEmail({ recipient, subject, body });
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error("Email error:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return app;
}