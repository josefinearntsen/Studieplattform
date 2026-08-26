import { Sidebar } from '@/components/Sidebar';
import { DEMO_MODE } from '@/lib/data';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        {DEMO_MODE && (
          <div className="border-b border-line bg-accentSoft px-6 py-2 text-center text-xs text-accent">
            Demo-modus: viser eksempeldata. Koble til Supabase (se README) for å bruke dine egne fag.
          </div>
        )}
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
