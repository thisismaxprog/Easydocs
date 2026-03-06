# Easydocs

MVP production-grade per studi commercialisti: gestione clienti, upload documenti, estrazione dati con AI, revisione e approvazione, export CSV, audit log. Multi-tenant (ogni studio vede solo i propri dati).

## Stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** + design system (blu elettrico, light/dark)
- **shadcn/ui** + Radix + lucide-react
- **react-hook-form** + zod + @hookform/resolvers
- **next-themes** (toggle tema)
- **Supabase**: Auth, Postgres, Storage, RLS
- **OpenAI API** (estrazione JSON da testo)
- **pdf-parse** (testo da PDF digitali)
- Deploy: **Vercel**

## Requisiti

- Node.js 18+
- Account [Supabase](https://supabase.com) e [OpenAI](https://platform.openai.com)

## Setup Supabase

1. Crea un nuovo progetto su [Supabase](https://app.supabase.com).
2. In **SQL Editor** esegui nell’ordine:
   - `supabase/schema.sql` (tabelle, indici, trigger)
   - `supabase/rls.sql` (policy RLS)
3. **Storage**: crea un bucket chiamato `documents` (privato).  
   Opzionale: esegui `supabase/storage.sql` per creare il bucket e le policy via SQL (alcuni progetti potrebbero richiedere di creare il bucket da Dashboard e poi solo le policy da SQL).
4. In **Authentication > Providers** abilita Email (e opzionalmente Magic Link).

## Variabili d’ambiente

Copia `.env.example` in `.env.local` e compila:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`: URL progetto Supabase (Settings > API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chiave anon/public
- `SUPABASE_SERVICE_ROLE_KEY`: chiave service role (solo server, non esporre al client)
- `OPENAI_API_KEY`: chiave API OpenAI per l’estrazione

## Avvio in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). Dopo la registrazione verrai reindirizzato a **Crea studio** e poi alla **Overview**.

## Come testare upload e processing

1. **Registrati** (Signup) e **crea uno studio** (nome a piacere).
2. In **Clienti** aggiungi almeno un cliente (opzionale per i test).
3. In **Documenti** (o dalla Overview) clicca **Carica**: scegli un PDF con testo selezionabile (non solo scansionato) e opzionalmente un cliente.
4. Il documento passa da `uploaded` → `processing` → `extracted` o `needs_review`.  
   - PDF digitali: estrazione automatica con OpenAI; se la confidenza è bassa o ci sono problemi (P.IVA, totali) lo stato diventa `needs_review`.
   - PDF scansionati/immagini: in questo MVP non c’è OCR; il documento viene salvato con stato `needs_review` e puoi compilare i campi a mano dalla pagina del documento.
5. Dettaglio documento: **Preview** (anteprima file), **Campi estratti** (modifica e Salva), **Approve** / **Da revisionare**, **Cronologia** (audit).
6. **Export CSV**: solo documenti in stato `approved`; scegli mese e (opzionale) cliente, poi Scarica.

## Limitazioni MVP e roadmap

- **OCR**: non incluso. Documenti solo immagine o PDF scansionato restano in `needs_review` con inserimento manuale. Roadmap: integrazione OCR (es. Tesseract o servizio cloud) per estrazione testo da scan.
- **Inviti membri**: la pagina Impostazioni mostra l’elenco membri; l’invito di nuovi utenti allo studio è previsto in un aggiornamento.
- **Relazione documenti–clienti**: in PostgREST la relazione da `documents.client_id` verso `clients` può essere esposta come `client` (singolare). Se le query che usano `clients(...)` dovessero dare errore, sostituire con `client(...)` nelle select.

## Struttura principali route

| Route | Descrizione |
|-------|-------------|
| `/login`, `/signup` | Auth |
| `/create-firm` | Onboarding: crea lo studio al primo accesso |
| `/overview` | Dashboard: KPI, ultimi documenti, attività |
| `/clients` | Anagrafica clienti + Aggiungi cliente |
| `/documents` | Elenco documenti, filtri, Carica, Export CSV |
| `/documents/[id]` | Preview, campi estratti, Approva, cronologia |
| `/settings` | Nome studio, elenco membri |
| `/help` | FAQ e contatti |

## Deploy (Vercel)

1. Collega il repo a Vercel e imposta le variabili d’ambiente (stesse di `.env.local`).
2. Build: `npm run build`.  
   Assicurati che `SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY` siano impostate (necessarie per elaborazione documenti e export).

---

Easydocs — MVP per studi commercialisti.
