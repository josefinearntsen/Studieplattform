# Studieplattform

Personlig studieplattform for NTNU-fag: kalender, fagoversikt, øvinger, eksamen
og en AI-studieassistent samlet ett sted. Dashboardet er bygget rundt "hva bør
jeg gjøre nå" — hva som vises først er vanlig kode basert på frister og
forelesningsplan, ikke noe en AI gjetter seg til.

Stack: Next.js 14 (App Router), TypeScript, Tailwind, Supabase (Postgres,
Auth, Storage, pgvector).

## Kjøre lokalt

```bash
npm install
npm run dev
```

Åpne http://localhost:3000. Uten Supabase-nøkler i `.env.local` faller appen
tilbake til demo-modus med eksempeldata.

Supabase, Google Calendar og AI-leverandør (NTNU IDUN) er allerede koblet til
i `.env.local`. Nye databaseendringer legges som egne filer i
`supabase/migrations/` og kjøres med `supabase db push`, eller limes inn i
SQL Editor på supabase.com.

## Canvas

Ikke bygget ennå. Settings-siden har felt for URL og API-token, men det
finnes ingen klient som faktisk henter noe derfra.

## Deploy

Enklest med Vercel:

```bash
npm i -g vercel
vercel
```

Legg inn de samme miljøvariablene som i `.env.local` under Project →
Settings → Environment Variables.

## Arkitektur

```
src/
  app/
    (app)/               # sidene bak sidebar-navigasjonen
      dashboard/
      today/
      calendar/           # uke-/månedsvisning
      courses/[id]/       # timeline, knowledge map, forelesninger, øvinger
      assignments/
      exams/
      study/              # UI klar, selve innholdsgenereringen gjenstår
      library/            # opplasting + AI-analyse av pensum/planer
      search/
      tutor/
      settings/
    api/
      tutor/
      courses/            # opprett fag + NTNU-oppslag
      library/             # opplasting, (re)analyse og sletting av dokumenter
      integrations/google/
  lib/
    data.ts               # eneste sted sidene henter data fra — demo vs. Supabase
    agenda.ts / agenda-fetch.ts   # slår sammen forelesninger, frister og Google Calendar til én tidslinje
    documents.ts           # tekstuttrekk (PDF/txt/md) + AI-analyse av opplastede dokumenter
    study-logic.ts         # hva som vises på dashboard, ukesfokus, eksamensfase
    google-calendar.ts
    ai/provider.ts         # byttbar AI-leverandør
    supabase/               # klienter (browser + server)
supabase/
  migrations/              # 0001 kjerneskjema, 0002 kalendervalg, 0003 dokumentstatus + storage-bucket
  seed.sql
```

## Hva er bygget

- Auth og database (Supabase, RLS per bruker)
- Dashboard med anbefalingslogikk
- Kalender: uke- og månedsvisning, forelesninger, frister og Google
  Calendar-hendelser/-gjøremål i samme tidslinje
- Fagoversikt og fagdetalj med knowledge map
- Øvinger, eksamen med fase-logikk
- Today
- Globalt søk
- AI Tutor (chat)
- Library: last opp pensum/undervisningsplan (PDF, txt eller md). AI
  analyserer dokumentet og fyller automatisk inn hva neste forelesning
  handler om og hva du bør lese før, direkte på forelesningene — det dukker
  opp på Today, Dashboard og kalenderen uten noe ekstra steg
- Google Calendar-integrasjon (kalender og tasks)
- Demo-modus som gjør at alt kan testes uten noen credentials

## Hva mangler

- Canvas-klient — feltet finnes i Settings, men henter ikke noe ennå
- NTNU-oppslag ved nytt fag (`/api/courses`) er enkel scraping av
  emnesiden, ikke robust for alle sider
- Karakterweb — ingen offentlig API, må trolig løses med en lenke i stedet
- RAG/embeddings: `document_chunks`-tabellen med pgvector finnes, men
  chunking og embedding er ikke koblet på ennå. Dokumentanalysen sender i
  dag hele teksten (kuttet til ca. 12 000 tegn) rett til AI-en per
  dokument — ikke søk på tvers av alt pensum
- Quiz/flashcards generert fra opplastet innhold
- Spaced repetition — feltene finnes i skjemaet, men ingen logikk oppdaterer
  dem ennå
