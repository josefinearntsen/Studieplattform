import { NextResponse } from 'next/server';
import { completeChat } from '@/lib/ai/provider';

export async function POST(req: Request) {
  const { message, courseContext } = await req.json();

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Mangler melding' }, { status: 400 });
  }

  try {
    // NB: I en full RAG-implementasjon hentes relevante document_chunks
    // (embeddings-søk mot pgvector) her og legges inn som kontekst,
    // i stedet for å sende hele dokumentbiblioteket i hver prompt.
    const { text } = await completeChat([
      {
        role: 'system',
        content:
          'Du er en studieassistent for en NTNU-student i Datateknologi. ' +
          'Svar konkret og pedagogisk. Referer til fagstoff når det er relevant.' +
          (courseContext ? `\n\nKontekst om faget: ${courseContext}` : ''),
      },
      { role: 'user', content: message },
    ]);

    return NextResponse.json({ reply: text });
    } catch (err: any) {
    console.error('AI tutor error:', err);
    return NextResponse.json(
      { error: `AI-feil: ${err.message}` },
      { status: 503 }
    );
  }
}
