/**
 * Byttbart AI-lag. Bytt leverandør via AI_PROVIDER env-variabel.
 * API-nøkler leses KUN server-side (route handlers / server actions),
 * aldri eksponert til klienten.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiCompletionResult {
  text: string;
}

async function completeWithAnthropic(messages: ChatMessage[]): Promise<AiCompletionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY er ikke satt');

  const system = messages.find((m) => m.role === 'system')?.content;
  const rest = messages.filter((m) => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const text = (data.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');
  return { text };
}

async function completeWithOpenAI(messages: ChatMessage[]): Promise<AiCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY er ikke satt');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content ?? '' };
}

/**
 * NTNU IDUN HPC — gratis, OpenAI-kompatibelt LLM-API for NTNU-studenter.
 * Krever NTNU-nett eller NTNU VPN (fungerer ikke fra f.eks. en Vercel-server).
 * Se: https://www.hpc.ntnu.no/idun/documentation/ai-coding-assistant-and-large-language-models-llms-on-idun/
 */
async function completeWithNtnu(messages: ChatMessage[]): Promise<AiCompletionResult> {
  const apiKey = process.env.NTNU_API_KEY;
  if (!apiKey) throw new Error('NTNU_API_KEY er ikke satt');

  const model = process.env.NTNU_MODEL || 'openai/gpt-oss-120b';

  const res = await fetch('https://llm.hpc.ntnu.no/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `NTNU LLM API error: ${res.status}. Sjekk at du er på NTNU-nett/VPN. ${body}`.trim()
    );
  }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content ?? '' };
}

export async function completeChat(messages: ChatMessage[]): Promise<AiCompletionResult> {
  const provider = process.env.AI_PROVIDER ?? 'anthropic';
  if (provider === 'openai') return completeWithOpenAI(messages);
  if (provider === 'ntnu') return completeWithNtnu(messages);
  return completeWithAnthropic(messages);
}