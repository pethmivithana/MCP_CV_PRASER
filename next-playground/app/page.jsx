"use client"
import { useState } from "react"
import './globals.css'

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL || "https://mcp-cv-praser-3.onrender.com"

export default function Page() {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState(null)
  const [email, setEmail] = useState({ recipient: "", subject: "", body: "" })
  const [status, setStatus] = useState(null)

  async function ask() {
    setAnswer(null)
    const res = await fetch(`${SERVER}/rest/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    })
    const data = await res.json()
    setAnswer(data.answer ?? JSON.stringify(data))
  }

  async function sendEmail() {
    setStatus(null)
    const res = await fetch(`${SERVER}/rest/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email)
    })
    const data = await res.json()
    setStatus(data.ok ? "Email sent ✅" : `Failed: ${data.error}`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-10">
      <section className="bg-white shadow rounded-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">
          CV Chat (REST wrapper to MCP tool)
        </h1>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask e.g. What role did I have at my last position?"
            className="flex-1 border rounded-xl px-3 py-2"
          />
          <button
            onClick={ask}
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            Ask
          </button>
        </div>
        {answer && <p className="text-sm text-gray-700">{answer}</p>}
      </section>

      <section className="bg-white shadow rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Send Email</h2>
        <div className="grid gap-2">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Recipient"
            value={email.recipient}
            onChange={e => setEmail({ ...email, recipient: e.target.value })}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Subject"
            value={email.subject}
            onChange={e => setEmail({ ...email, subject: e.target.value })}
          />
          <textarea
            className="border rounded-xl px-3 py-2"
            placeholder="Body"
            rows={5}
            value={email.body}
            onChange={e => setEmail({ ...email, body: e.target.value })}
          />
          <button
            onClick={sendEmail}
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            Send
          </button>
          {status && <p className="text-sm">{status}</p>}
        </div>
      </section>

      <p className="text-xs text-gray-500">
        Point NEXT_PUBLIC_SERVER_URL to your deployed MCP server.
      </p>
    </main>
  )
}
