'use client';

import { useState } from 'react';
import { Button, Card, SectionTitle } from '@/components/ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const next = [...messages, { role: 'user' as const, content: input }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages([...next, { role: 'assistant', content: data.reply ?? data.error }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">AI Tutor</h1>
        <p className="text-sm text-muted">
          Still spørsmål om fagene dine. Når dokumenter er lastet opp i Library, svarer AI-en
          basert på dem og viser kilder.
        </p>
      </header>

      <Card className="flex h-[60vh] flex-col">
        <SectionTitle>Samtale</SectionTitle>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-muted">
              Prøv: «Hva burde jeg lese før forelesningen i morgen?»
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === 'user' ? 'text-right' : 'text-left'}
            >
              <span
                className={
                  'inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ' +
                  (m.role === 'user' ? 'bg-accent text-white' : 'bg-canvas')
                }
              >
                {m.content}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Skriv en melding…"
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <Button onClick={send} disabled={loading}>
            {loading ? '…' : 'Send'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
