# Checklist deploy – Easydocs

Usa questa lista quando fai (o verifichi) il deploy su Vercel.

---

## 1. Codice su GitHub

- [ ] `git add .` → `git commit -m "..."` → `git push origin main`
- Il push è già stato fatto: Vercel riceve l’ultimo commit e fa il build da solo.

---

## 2. Vercel – progetto e build

- [ ] Vai su **[vercel.com](https://vercel.com)** → accedi → seleziona il progetto **Easydocs** (o importa il repo da GitHub se è la prima volta).
- [ ] In **Deployments**: aspetta che l’ultimo deploy sia **Ready** (build verde). Se fallisce, apri i **Build Logs** e controlla l’errore.

---

## 3. Vercel – variabili d’ambiente

- [ ] **Settings** → **Environment Variables**.
- [ ] Verifica che ci siano **tutte e 4** (per **Production** e, se usi preview, **Preview**):

| Variabile | Dove prenderla |
|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (segreta) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) → API keys |

- [ ] Se hai appena aggiunto o modificato una variabile: **Deployments** → ⋮ sull’ultimo deploy → **Redeploy**.

---

## 4. Supabase – Auth (login/signup in produzione)

- [ ] Supabase → **Authentication** → **URL Configuration**.
- [ ] **Site URL**: imposta l’URL dell’app (es. `https://easydocs-xxx.vercel.app` o il tuo dominio).
- [ ] **Redirect URLs**: aggiungi `https://tuo-dominio.vercel.app/**` (e il dominio custom se ce l’hai).

---

## 5. Supabase – Storage (upload documenti)

- [ ] Supabase → **Storage**: se non esiste, crea un bucket **documents** (privato).
- [ ] **SQL Editor** → incolla ed esegui le policy del file **`supabase/storage.sql`** del progetto (le parti con `create policy`).

---

## 6. Prova in produzione

- [ ] Apri l’URL dell’app (es. dal tab Deployments di Vercel).
- [ ] Registrati o fai login.
- [ ] Crea uno studio se richiesto.
- [ ] Vai in **Documenti** → **Carica** → carica un PDF o un’immagine di una fattura.
- [ ] Controlla che il documento compaia e che l’estrazione parta (stato "processing" → "extracted" o "needs_review").

---

## Riepilogo

| Step | Dove | Cosa |
|------|------|------|
| 1 | GitHub | Codice pushato (già fatto) |
| 2 | Vercel → Deployments | Build completata (Ready) |
| 3 | Vercel → Settings → Env | 4 variabili impostate |
| 4 | Supabase → Auth | Site URL + Redirect URLs |
| 5 | Supabase → Storage | Bucket `documents` + policy da `storage.sql` |
| 6 | Browser | Apri l’app e prova login + upload |

Se un passo fallisce, annota il messaggio di errore (build log o console browser) e correggiamo quello.

---

## La pagina non si carica (bianca, spinner, errore)

1. **Vercel → Deployments**  
   L’ultimo deploy è **Ready** (verde)? Se è fallito (rossa X), apri **Build Logs** e controlla l’errore.

2. **Variabili d’ambiente**  
   **Settings → Environment Variables**: devono esserci **tutte e 4** (anche `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Se le hai aggiunte dopo il deploy, fai **Redeploy** (Deployments → ⋮ → Redeploy).

3. **Browser**  
   Apri **DevTools** (F12) → tab **Console**. Se compaiono errori tipo “Mancano NEXT_PUBLIC_SUPABASE_URL…” allora su Vercel mancano le variabili o non è stato fatto un nuovo deploy dopo averle impostate.

4. **URL corretto**  
   Usa l’URL del deploy in produzione (es. `https://easydocs-xxx.vercel.app`), che trovi in Vercel nel tab Deployments cliccando sul dominio.
