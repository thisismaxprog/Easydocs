# Cosa fare adesso – Easydocs

Segui questi passi in ordine.

---

## 1. Salva e fai il push del codice

Il nuovo upload (dal browser diretto a Supabase) è già nel progetto. Deve essere su Git e su Vercel.

**In Cursor (terminale in basso):**

```bash
cd "/Users/max/Desktop/il vero Saas idea"
git add .
git status
git commit -m "Upload diretto browser → Storage, niente più blocco"
git push origin main
```

- Se `git push` chiede login, accedi a GitHub.
- Dopo il push, Vercel fa il deploy da solo (se il repo è collegato).

---

## 2. Controlla le variabili su Vercel

1. Vai su [vercel.com](https://vercel.com) → il tuo progetto Easydocs.
2. **Settings** → **Environment Variables**.
3. Verifica che ci siano tutte e 4, con **Production** (e se vuoi anche **Preview**) selezionato:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
4. Se hai appena aggiunto o modificato qualcosa, vai in **Deployments** → sui tre puntini dell’ultimo deploy → **Redeploy** (così le nuove variabili vengono usate).

---

## 3. Controlla Supabase (Storage)

L’upload ora va dal **browser** al bucket Storage. Servono bucket e policy.

1. Vai su [supabase.com](https://supabase.com) → il tuo progetto.
2. **Storage** (menu a sinistra):
   - Se non c’è un bucket **documents**, clicca **New bucket** → nome `documents`, **privato** (non pubblico) → Crea.
3. **SQL Editor** → **New query**:
   - Apri il file **`supabase/storage.sql`** del progetto.
   - Copia le parti che contengono **create policy** (dalla riga “Policy: users can read…” in poi).
   - Incolla nell’editor e clicca **Run**.

Così l’utente loggato può caricare file nel path del proprio studio.

---

## 4. Prova l’app

**In produzione (Vercel):**

1. Aspetta che il deploy sia **Ready** (Deployments).
2. Apri il link dell’app (es. `https://tuoprogetto.vercel.app`).
3. Fai login (o registrati se serve).
4. Se non hai ancora uno studio, crealo (“Crea il tuo studio”).
5. Vai in **Documenti** (o Overview) → **Carica**.
6. Scegli un file (PDF con testo o un’immagine) e clicca **Carica**.
7. La rotella dovrebbe andare via in pochi secondi e il documento comparire in lista; in seguito vedrai lo stato (es. “processing” → “extracted” o “needs_review”).

**In locale (opzionale):**

```bash
cd "/Users/max/Desktop/il vero Saas idea"
npm run dev
```

Poi apri [http://localhost:3000](http://localhost:3000) e ripeti i passi da 3 a 7. In locale usa le stesse variabili che hai in `.env.local`.

---

## 5. Se qualcosa non va

- **Errore “new row violates row-level security”**  
  Succede su tabella `documents` o `clients`: abbiamo già spostato le scritture con la service role. Se compare ancora, scrivimi il messaggio completo.

- **Upload che resta “Caricamento…”**  
  Controlla la **console** del browser (F12 → Console): se c’è un errore rosso, copialo e incollalo qui.

- **“Errore upload” / “Permission denied” su Storage**  
  Ripeti il passo 3 (bucket `documents` + policy da `storage.sql`). Assicurati che le policy siano state create senza errori nel SQL Editor.

- **Documento caricato ma niente estrazione**  
  Controlla che `OPENAI_API_KEY` sia impostata su Vercel (e in `.env.local` in locale). In Supabase → Table Editor → **documents**: lo stato del documento dovrebbe passare da `uploaded` a `processing` e poi a `extracted` o `needs_review`.

---

## Riepilogo

| # | Cosa fare |
|---|-----------|
| 1 | `git add .` → `git commit` → `git push` |
| 2 | Vercel: controllare le 4 variabili d’ambiente e fare Redeploy se serve |
| 3 | Supabase: bucket `documents` + eseguire le policy da `storage.sql` |
| 4 | Aprire l’app (Vercel o localhost) e provare a caricare un documento |
| 5 | In caso di errore: messaggio in console o toast e controlli sopra |

Quando hai fatto i passi 1–4, dimmi se l’upload va a buon fine e se vedi il documento in lista e l’estrazione (anche solo “needs_review”). Se qualcosa fallisce, incolla il messaggio di errore e ti dico il passo preciso da correggere.
