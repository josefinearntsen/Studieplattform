# Studieplattform

En personlig studieplattform for NTNU-studier: kalender, fagoversikt, øvinger,
eksamen og en AI-studieassistent samlet på ett sted, bygget rundt spørsmålet
**"Hva bør jeg gjøre nå?"**

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase
(Postgres, Auth, Storage, pgvector).

---

## 1. Kjør appen lokalt (demo-modus — fungerer med én gang)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uten Supabase-credentials i `.env.local` kjører appen automatisk i
**demo-modus**: dashboard, kalender, fag, øvinger og eksamen vises med
realistiske eksempeldata (tydelig merket i UI). Dette lar deg se og teste hele
opplevelsen før du kobler til ekte data.

Åpne http://localhost:3000

---

## 2. Koble til ekte data (Supabase)

1. Opprett et gratis prosjekt på https://supabase.com
2. Kopiér **Project URL** og **anon public key** fra
   *Project Settings → API* inn i `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
   SUPABASE_SERVICE_ROLE_KEY=xxxx
   ```
3. Aktiver pgvector-extensionen: *Database → Extensions → vector → Enable*
4. Kjør databaseskjemaet: åpne *SQL Editor* i Supabase og lim inn innholdet av
   `supabase/migrations/0001_init.sql`, kjør det.
5. (Valgfritt) Legg inn demo-data: bytt ut `:demo_user_id` i
   `supabase/seed.sql` med din bruker-id (finnes i *Authentication → Users*
   etter du har logget inn én gang), kjør filen.
6. Restart `npm run dev` — appen bytter automatisk fra demo-modus til ekte
   innlogging og dine egne fag.

Innlogging bruker Supabase sin magic-link (e-post). Arkitekturen støtter
flere brukere, men alt er scoped til én bruker via Row Level Security.

---

## 3. Koble til AI (Anthropic eller OpenAI)

Legg inn én av disse i `.env.local`:

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

eller

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

AI Tutor-siden (`/tutor`) bruker dette via `/api/tutor`. Leverandøren kan
byttes uten kodeendringer — se `src/lib/ai/provider.ts`.

---

## 4. Google Calendar-integrasjon

Krever et Google Cloud-prosjekt med Calendar API aktivert:

1. https://console.cloud.google.com → nytt prosjekt
2. Aktiver "Google Calendar API"
3. Opprett OAuth 2.0-credentials (Web application)
4. Legg redirect URI: `http://localhost:3000/api/integrations/google/callback`
5. Legg `GOOGLE_CLIENT_ID` og `GOOGLE_CLIENT_SECRET` i `.env.local`

Databasetabellen `user_integrations` og innstillingssiden (`/settings`) er
klare for dette — selve OAuth-callback-ruten (`/api/integrations/google/*`)
er ikke bygget ennå fordi den krever dine faktiske credentials for å testes
riktig. Det er neste steg når du har satt opp punktene over.

---

## 5. Canvas-integrasjon

Under `/settings` kan du (når Supabase er koblet til) legge inn Canvas URL
og et personlig API-token (genereres i Canvas under
*Account → Settings → New Access Token*). Canvas-klienten
(`src/lib/canvas/` — foreløpig ikke opprettet) er neste steg og vil hente
assignments, modules og undervisningsplan via Canvas LMS REST API.

Helt uavhengig av dette fungerer appen fint med **manuell** registrering av
øvinger og undervisningsplan (Library-siden), som spec'et krever.

---

## 6. Deploy

Enklest med Vercel:

```bash
npm i -g vercel
vercel
```

Legg inn de samme miljøvariablene som i `.env.local` under
*Vercel → Project → Settings → Environment Variables*.

---

## Arkitektur

```
src/
  app/
    (app)/            # alle sider bak sidebar-navigasjonen
      dashboard/       # "Hva bør jeg gjøre nå" - hovedsiden
      today/           # Daily Study Brief
      calendar/
      courses/[id]/    # fagdetalj: timeline, knowledge map, forelesninger, øvinger
      assignments/
      exams/           # eksamensfase-logikk
      study/           # Study Mode (quiz/flashcards/active recall - UI klar, AI-generering neste steg)
      library/         # upload center
      search/          # globalt søk
      tutor/           # AI-chat
      settings/        # integrasjoner
    api/
      tutor/           # server-side AI-kall (nøkler aldri i frontend)
      courses/         # opprett fag + NTNU-oppslag
  lib/
    data.ts            # ENESTE sted sidene henter data — demo vs. Supabase
    study-logic.ts     # anbefalingsmotor ("Hva bør jeg gjøre nå", ukesfokus, eksamensfase)
    ai/provider.ts      # byttbar AI-leverandør
    supabase/          # klienter (browser + server)
supabase/
  migrations/0001_init.sql   # hele datamodellen (16 tabeller) + RLS
  seed.sql                    # demo-data
```

**Designprinsipp:** all prioritering (ukesfokus, eksamensfase, hva som vises
først) er **deterministisk logikk** i `study-logic.ts`, ikke AI-gjetting. AI
brukes til å *generere innhold* (forklaringer, quiz, oppsummeringer av
slides), ikke til å bestemme hva som er viktig — det bestemmes av faktiske
data (frister, progresjon, eksamensdato).

---

## Status: hva er bygget vs. hva er neste steg

**Bygget og fungerende (MVP, prioritet 1–9 i spec):**
Auth-arkitektur, full database (16 tabeller + RLS), Dashboard med
anbefalingsmotor, Kalender, Fagoversikt + fagdetalj med knowledge map,
Øvinger, Eksamen med fase-logikk, Today/Daily brief, globalt søk, AI Tutor
(chat mot Anthropic/OpenAI), Settings/Integrations-skjelett, demo-modus som
gjør at alt fungerer uten noen credentials.

**Klargjort i datamodell, men krever din handling for å fullføres (prioritet
15–19 i spec, slik du selv ba om i pkt. 40–41):**
- Google Calendar OAuth-callback (trenger dine Google-credentials)
- Canvas API-klient (trenger Canvas-token)
- NTNU-scraping er implementert som best-effort (`/api/courses`), bør
  forsterkes når du ser hvordan NTNUs sider faktisk er strukturert
- Karakterweb (ingen offentlig API — lenke-basert løsning som spec'et tillater)
- RAG-pipeline: `document_chunks`-tabellen med pgvector er klar, men
  chunking/embedding-jobben som fyller den er ikke skrevet ennå
- Quiz-/flashcard-generering fra opplastede slides (AI-kall er klare i
  `ai/provider.ts`, selve prompt-logikken for pkt. 11/13/15 gjenstår)
- Spaced repetition-algoritmen (feltene `next_review_at`/`interval_days`
  finnes i skjemaet, men oppdateringslogikken er ikke skrevet)

Disse er bevisst ikke halvveis bygget samtidig som MVP, i tråd med
prioriteringen i pkt. 40 i kravspesifikasjonen din — si ifra hvilken av disse
du vil at jeg tar fatt på først.
