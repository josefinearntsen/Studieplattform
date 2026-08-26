'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-lg font-semibold">Studieplattform</h1>
        <p className="mb-6 text-sm text-muted">Logg inn med e-post for å fortsette.</p>

        {sent ? (
          <p className="text-sm text-good">
            Sjekk innboksen din — vi har sendt en innloggingslenke til {email}.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="din@ntnu.no epost"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
            {error && <p className="text-xs text-warn">{error}</p>}
            <Button type="submit" className="w-full">
              Send innloggingslenke
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
