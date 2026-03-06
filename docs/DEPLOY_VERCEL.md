# Deploy su Vercel (Easydocs)

## 1. Prepara il codice

- Assicurati che il progetto sia su **GitHub**, **GitLab** o **Bitbucket** (Vercel si connette al repo).
- In locale: commit e push di tutto.
  ```bash
  git add .
  git commit -m "Ready for deploy"
  git push
  ```

## 2. Crea il progetto su Vercel

1. Vai su **[vercel.com](https://vercel.com)** e accedi (o registrati con GitHub).
2. Clicca **"Add New..."** → **"Project"**.
3. **Import** il repository del progetto (es. `il vero Saas idea` o il nome del repo).
4. **Configure Project**:
   - **Framework Preset**: Next.js (di solito rilevato in automatico).
   - **Root Directory**: lascia `.` (root) se il progetto Next.js è nella root del repo.
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `.next` (default).
   - **Install Command**: `npm install` (default).

## 3. Variabili d’ambiente

Nella stessa schermata (o dopo in **Settings → Environment Variables**) aggiungi **tutte** queste variabili. Usa **Production**, **Preview** e **Development** se vuoi che funzionino anche su branch e preview.

| Nome | Valore | Note |
|------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Da Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Chiave **anon public** |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Chiave **service_role** (segreta) |
| `OPENAI_API_KEY` | `sk-...` | Chiave API OpenAI per l’estrazione documenti |

- Non lasciare nessuna vuota, altrimenti build o runtime possono fallire.
- Clicca **Save** dopo averle inserite.

## 4. Deploy

1. Clicca **"Deploy"**.
2. Attendi la build (1–3 minuti). Se qualcosa fallisce, apri i **Build Logs** per vedere l’errore.
3. A fine deploy avrai un URL tipo `https://easydocs-xxx.vercel.app`.

## 5. Dominio personalizzato (opzionale)

- **Settings** → **Domains** → aggiungi il tuo dominio (es. `app.easydocs.it`).
- Segui le istruzioni Vercel per configurare CNAME/DNS presso il tuo registrar.

## 6. Supabase: URL di produzione

Per far funzionare login/signup e redirect in produzione:

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL**: imposta l’URL di produzione (es. `https://easydocs-xxx.vercel.app` o il tuo dominio).
3. **Redirect URLs**: aggiungi:
   - `https://easydocs-xxx.vercel.app/**`
   - `https://tuodominio.com/**` (se usi un dominio custom).

Salva e riprova login/registrazione dal sito in produzione.

---

## Riepilogo

| Step | Dove | Cosa |
|------|------|------|
| 1 | Repo Git | Codice pushato |
| 2 | vercel.com | New Project → import repo |
| 3 | Vercel → Env Vars | 4 variabili (Supabase URL, anon, service role, OpenAI) |
| 4 | Deploy | Clic Deploy e attendi build |
| 5 | Supabase Auth | Site URL + Redirect URLs con l’URL Vercel |

Fine.
