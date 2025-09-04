# MCP CV & Email (Server + Optional Next.js Playground)

This repo contains:
- `mcp-server/` — TypeScript MCP server exposing:
  - Resource: `cv://me` (your CV JSON)
  - Tools: `chat_cv`, `send_email`
  - HTTP: `/mcp` (Streamable HTTP), `/rest/chat`, `/rest/send-email`, `/health`
- `next-playground/` — A tiny Next.js UI that calls the REST wrappers for quick manual testing

## Quick Start

```bash
# 1) Server
cd mcp-server
cp .env.example .env
# fill SMTP + CORS_ORIGINS
npm i
npm run dev  # http://localhost:8787

# 2) Playground (optional)
cd ../next-playground
cp .env.local.example .env.local
npm i
npm run dev  # http://localhost:3000
```

## Deploy

- **Render**: create a Web Service pointing to `mcp-server`, Node 18+, build `npm install && npm run build`, start `npm run start`, port `8787`. Add env vars.
- **Docker**: `docker build -t mcp-cv-email ./mcp-server && docker run -p 8787:8787 --env-file mcp-server/.env mcp-cv-email`

Then update `NEXT_PUBLIC_SERVER_URL` for the playground.

## Notes

- The MCP server uses **Streamable HTTP** per official SDK and is compatible with clients that support it.
- For production, add rate limiting and better parsing for CV Q&A.
