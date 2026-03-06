# Guida: creare il progetto Supabase per Easydocs

Segui questi passi per avere il database e lo storage pronti.

---

## 1. Crea il progetto su Supabase

1. Vai su **[supabase.com](https://supabase.com)** e accedi (o registrati).
2. Clicca **"New project"**.
3. Compila:
   - **Name**: ad es. `easydocs`
   - **Database password**: scegli una password forte e **salvala** (serve per accedere al DB).
   - **Region**: scegli la più vicina (es. Frankfurt).
4. Clicca **"Create new project"** e attendi 1–2 minuti.

---

## 2. Copia URL e chiavi API

1. Nel menu sinistro apri **Settings** (icona ingranaggio) → **API**.
2. Annota (le userai in `.env.local`):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (chiave pubblica) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (chiave segreta, non esporre al frontend) → `SUPABASE_SERVICE_ROLE_KEY`

Esempio:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Esegui lo schema del database

1. Nel menu sinistro apri **SQL Editor**.
2. Clicca **"New query"**.
3. Apri il file **`supabase/schema.sql`** di questo progetto e **copia tutto** il contenuto.
4. Incollalo nell’editor SQL su Supabase.
5. Clicca **"Run"** (o Ctrl+Enter).  
   In basso deve comparire **"Success. No rows returned"**.

---

## 4. Attiva le policy RLS

1. Sempre in **SQL Editor**, apri un’altra **"New query"**.
2. Apri **`supabase/rls.sql`** e **copia tutto** il contenuto.
3. Incollalo nell’editor e clicca **"Run"**.  
   Deve andare a buon fine senza errori.

---

## 5. Crea il bucket Storage

1. Nel menu sinistro apri **Storage**.
2. Clicca **"New bucket"**.
3. Imposta:
   - **Name**: `documents`
   - **Public bucket**: **OFF** (privato).
   - (Opzionale) **File size limit**: es. 10 MB.
   - (Opzionale) **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
4. Clicca **"Create bucket"**.

---

## 6. Policy per lo Storage

Le policy per il bucket `documents` usano la funzione `user_firm_ids()` che abbiamo creato con lo schema. Puoi aggiungerle così:

1. Vai in **SQL Editor** → **New query**.
2. Apri **`supabase/storage.sql`** e copia il contenuto.
3. **Attenzione**: la prima parte fa un `INSERT` sul bucket. Se il bucket l’hai già creato a mano (passo 5), quella riga può dare conflitto. In quel caso:
   - **Opzione A**: esegui solo le policy (da `create policy "Users can read...` in poi).
   - **Opzione B**: commenta o elimina il blocco `INSERT INTO storage.buckets ...` e poi esegui il resto.

In alternativa puoi creare le policy da **Storage** → **documents** → **Policies** → **New policy** e usare i template “For full customization”, con le stesse regole (lettura/scrittura solo per utenti il cui `firm_id` è nel path).

---

## 7. Auth (email)

1. Vai in **Authentication** → **Providers**.
2. Assicurati che **Email** sia **Enabled**.
3. (Opzionale) in **Authentication** → **URL Configuration** imposta:
   - **Site URL**: `http://localhost:3000` per sviluppo, oppure il tuo dominio in produzione.
   - **Redirect URLs**: aggiungi `http://localhost:3000/**` e il tuo dominio di produzione.

---

## 8. Variabili d’ambiente in locale

1. Nella root del progetto copia `.env.example` in `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Apri `.env.local` e incolla **Project URL**, **anon** e **service_role** al posto dei placeholder:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://il-tuo-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=la-tua-anon-key
   SUPABASE_SERVICE_ROLE_KEY=la-tua-service-role-key
   OPENAI_API_KEY=sk-la-tua-openai-key
   ```

---

## 9. Verifica rapida

1. Avvia l’app:
   ```bash
   npm run dev
   ```
2. Apri **http://localhost:3000**.
3. Vai su **Registrati**, crea un account con email/password.
4. Dovresti essere reindirizzato a **Crea il tuo studio**: inserisci un nome e clicca **Crea studio**.
5. Dovresti arrivare alla **Overview** senza errori.

Se qualcosa non funziona, controlla la **Console** del browser e i **Log** in Supabase (Authentication e Database).

---

## Riepilogo ordine operazioni

| # | Dove | Cosa |
|---|------|------|
| 1 | Supabase Dashboard | Crea progetto |
| 2 | Settings → API | Copia URL e chiavi |
| 3 | SQL Editor | Esegui `supabase/schema.sql` |
| 4 | SQL Editor | Esegui `supabase/rls.sql` |
| 5 | Storage | Crea bucket `documents` |
| 6 | SQL Editor (o Storage Policies) | Esegui policy da `supabase/storage.sql` |
| 7 | Authentication | Abilita Email, controlla URL/redirect |
| 8 | Progetto locale | `.env.local` con le 4 variabili |
| 9 | Terminale | `npm run dev` e test registrazione + creazione studio |

Fine. Il progetto Supabase per Easydocs è pronto.
