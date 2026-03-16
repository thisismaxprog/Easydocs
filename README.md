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
   - `supabase/migrations/001_upgrade_saas.sql` (estensione clienti, documenti, inviti, ruoli)
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

## Modello dati (upgrade SaaS)

- **Firm (studio)**: workspace principale; può avere più utenti (ruoli: owner, admin, collaborator).
- **Clients**: anagrafica estesa (ragione sociale, P.IVA, codice fiscale, referente, email, telefono, note, stato invito, `upload_token` univoco).
- **Documents**: `source_type` (firm_upload, upload_link, client_portal, email, unknown), `classification_status` (assigned, suggested, unmatched), `uploaded_by_user_id`, campi per matching futuro (`match_confidence`, `match_reason`).
- **Client invitations**: tabella `client_invitations` per flusso invito (token, scadenza, stato); da completare con email e pagina `/join?token=...`.

## Link di caricamento cliente

Ogni cliente ha un **link di caricamento** univoco (`/upload/[token]`):

1. Dalla scheda **Cliente** (Dashboard → Clienti → clic su un cliente) viene mostrato il link e il pulsante **Copia link**.
2. Il cliente apre il link (senza login): vede il nome dello studio/cliente e un’area drag & drop per caricare file (PDF, immagini).
3. I documenti caricati tramite questo link vengono associati automaticamente a quel cliente (`source_type = upload_link`, `client_id` impostato).
4. L’API pubblica `GET/POST /api/upload-link` gestisce la validazione del token e l’upload (service role per scrivere su Storage e su `documents`).

## Assegnazione documenti

- **Upload da studio** (Dashboard/Documenti): l’utente può scegliere opzionalmente un cliente; `source_type = firm_upload`, `classification_status = assigned`.
- **Upload da link cliente**: il token identifica il cliente; `source_type = upload_link`, `client_id` e `classification_status = assigned`.
- **Futuro**: matching automatico (P.IVA, codice fiscale, nome da OCR) con `document_extracted_entities` e `document_match_candidates`; per ora l’architettura è predisposta, la logica deterministica è solo “upload link → cliente noto”.

## Limitazioni e roadmap

- **OCR / Vision**: supporto per immagini e PDF senza testo (OpenAI Vision e fallback pdf-to-img) già incluso; OCR completo separato in roadmap.
- **Inviti clienti**: tabella e campi pronti; flusso “Invia invito” → email con link `/join?token=...` → registrazione cliente legata al record è in fase 2 (placeholder/mock email).
- **Import CSV clienti**: previsto in fase 2 (mapping colonne, validazione, template scaricabile).
- Vedi `docs/TODOS_SAAS.md` per le prossime fasi.

## Struttura principali route

| Route | Descrizione |
|-------|-------------|
| `/login`, `/signup` | Auth |
| `/create-firm` | Onboarding: crea lo studio al primo accesso |
| `/overview` | Dashboard: KPI, clienti, documenti, attività |
| `/clients` | Anagrafica clienti, filtri, Aggiungi cliente |
| `/clients/[id]` | Dettaglio cliente, link di caricamento, documenti del cliente |
| `/documents` | Elenco documenti, filtri, Carica, Export CSV |
| `/documents/[id]` | Preview, campi estratti, Approva, cronologia |
| `/upload/[token]` | Pagina pubblica per caricare documenti (link cliente) |
| `/settings` | Nome studio, elenco membri |
| `/help` | FAQ e contatti |

## Deploy (Vercel)

1. Collega il repo a Vercel e imposta le variabili d’ambiente (stesse di `.env.local`).
2. Build: `npm run build`.  
   Assicurati che `SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY` siano impostate (necessarie per elaborazione documenti e export).

---

Easydocs — MVP per studi commercialisti.
