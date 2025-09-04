import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import cv from "../cv.json" with { type: "json" };
import { sendEmail } from "./email.js";
import { makeRestApp } from "./rest.js";

// Create MCP server
const server = new McpServer({
  name: "cv-email-mcp",
  version: "1.0.0",
});

// Resource: expose CV as a resource
server.registerResource(
  "cv",
  "cv://me",
  {
    title: "Candidate CV",
    description: "Parsed CV data for Q&A",
    mimeType: "application/json"
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(cv, null, 2)
    }]
  })
);

// Tool: chat over CV (simple heuristics for demo)
server.registerTool(
  "chat_cv",
  {
    title: "Chat About CV",
    description: "Answer a question about the CV",
    inputSchema: { question: z.string().describe("User question about the CV") }
  },
  async ({ question }) => {
    const q = question.toLowerCase();

    if (q.includes("last position") || q.includes("most recent role") || q.includes("current role")) {
      const last = cv.experience[0];
      return { content: [{ type: "text", text: `Your last position was ${last.role} at ${last.company} (${last.period}).` }] };
    }
    if (q.includes("skills")) {
      return { content: [{ type: "text", text: `Skills: ${cv.skills.join(", ")}.` }] };
    }
    if (q.includes("experience") || q.includes("work history")) {
      const lines = cv.experience.map((e) => `${e.role} @ ${e.company} (${e.period})`).join(" | ");
      return { content: [{ type: "text", text: lines }] };
    }

    return { content: [{ type: "text", text: "I can answer about your last position, skills, and experience. Try asking 'What role did I have at my last position?'" }] };
  }
);

// Tool: send email
server.registerTool(
  "send_email",
  {
    title: "Send Email",
    description: "Send an email using SMTP",
    inputSchema: {
      recipient: z.string().email().describe("Email recipient"),
      subject: z.string().min(1),
      body: z.string().min(1)
    }
  },
  async ({ recipient, subject, body }) => {
    const result = await sendEmail({ recipient, subject, body });
    return {
      content: [{
        type: "text",
        text: `Sent email ${result.messageId}: ${result.response}`
      }]
    };
  }
);

// Optional: Prompt for guided queries
server.registerPrompt(
  "ask-about-last-role",
  {
    title: "Ask About Last Role",
    description: "Prompt template to ask about last position",
    argsSchema: { }
  },
  () => ({
    messages: [{
      role: "user",
      content: { type: "text", text: "What role did I have at my last position?" }
    }]
  })
);

// Express app + MCP Streamable HTTP endpoint
const app = makeRestApp();

// Session map for MCP Streamable HTTP
const transports = {};

app.post("/mcp", async (req, res) => {
  const sessionId = req.header("Mcp-Session-Id");
  let transport;

  if (!sessionId || !transports[sessionId]) {
    // New session
    transport = new StreamableHTTPServerTransport();
    transports[transport.sessionId] = transport;
    await server.connect(transport);
  } else {
    transport = transports[sessionId];
  }

  // Route the incoming message to the transport
  await transport.handlePostMessage(req, res, req.body);

  // If this is an initialize request, expose the session header for browser clients
  if (isInitializeRequest(req.body)) {
    res.setHeader("Mcp-Session-Id", transport.sessionId);
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
  }
});

// Optional endpoint to end a session
app.delete("/mcp", async (req, res) => {
  const sessionId = req.header("Mcp-Session-Id");
  if (sessionId && transports[sessionId]) {
    await transports[sessionId].close();
    delete transports[sessionId];
  }
  res.status(204).end();
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.error(`MCP HTTP server listening on :${port}`);
});