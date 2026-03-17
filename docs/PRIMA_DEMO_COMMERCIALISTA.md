# Prima di mostrare Easydocs al commercialista

Checklist minima per una demo convincente. Non serve avere tutto il “Fase 2” (import CSV, inviti, ecc.): quello che c’è ora è già presentabile.

---

## 1. Produzione funzionante

- [ ] **Vercel**: ultimo deploy **Ready**; variabili d’ambiente impostate (le 4: Supabase URL, anon key, service role, `OPENAI_API_KEY`). Vedi `docs/CHECKLIST_DEPLOY.md`.
- [ ] **Supabase**: Auth → Site URL e Redirect URLs con l’URL dell’app; Storage → bucket `documents` + policy; se usi il link di caricamento per i clienti, aver eseguito `supabase/fix-upload-token.sql` e verificato che i clienti abbiano l’`upload_token`.
- [ ] **Prova tu**: login, creazione studio (se primo accesso), caricamento di almeno un documento (PDF o immagine), verifica che compaia in Documenti e che l’estrazione parta (stato “extracted” o “needs_review”). Poi Export → Scarica Excel e controlla che il file si apra con i dati.

Se qualcosa non va, usa la sezione “Se qualcosa non va” in `docs/COSA_FARE_ADESSO.md` e la checklist in `docs/CHECKLIST_DEPLOY.md`.

---

## 2. Dati demo (consigliato)

Per non mostrare schermate vuote:

- [ ] **Almeno 2–3 clienti** (anche di prova) con nome e P.IVA.
- [ ] **Alcuni documenti** già presenti: almeno una fattura e uno scontrino (anche solo 2–3 in totale), con stato “extracted” o “approvato”, così il commercialista vede:
  - Elenco documenti con totali e tipo (Fattura/Scontrino).
  - Dettaglio documento con campi estratti e anteprima.
  - Totale in fondo alla lista documenti e, se apre una scheda cliente, il totale documenti per quel cliente.
- [ ] **Export**: prova a scaricare l’Excel per un mese che contenga quelle date documento; verifica che le righe ci siano e che l’intestazione sia colorata (blu Easydocs).

Così in 5 minuti puoi mostrare: login → Clienti → Documenti → apertura di un documento → Export Excel.

---

## 3. Cose opzionali (non bloccanti)

- **Totale scontrino 6900 invece di 69,00**: se in qualche documento il totale estratto è sbagliato (es. 6900 al posto di 69), per la demo si può correggere a mano nel dettaglio documento e salvare; una correzione strutturale (estrazione/salvataggio) si può fare dopo il feedback del commercialista.
- **Pagina Aiuto**: se esiste già, puoi mostrarla; altrimenti non è indispensabile per la prima demo.
- **Copy / onboarding**: due righe in Overview o in Documenti (“Carica fatture e scontrini, rivedi i dati estratti e esporta in Excel”) possono aiutare, ma non sono obbligatorie.

---

## 4. Cosa NON serve per questa demo

- Import CSV clienti  
- Flusso invito clienti / join  
- Matching automatico documento–cliente  
- Impostazioni avanzate (logo, team, integrazioni)  
- Portale cliente  

Tutto questo rientra nelle fasi successive (vedi `docs/TODOS_SAAS.md`).

---

## Riepilogo

| Priorità | Cosa fare |
|----------|-----------|
| **Obbligatorio** | Produzione ok (deploy + variabili + Supabase), prova completa di login → upload → export Excel |
| **Consigliato** | 2–3 clienti e 2–3 documenti (fattura + scontrino) già presenti per mostrare elenco, totali e export |
| **Opzionale** | Correzione totale 69 vs 6900, pagina Aiuto, due righe di copy |

Quando 1 e 2 sono a posto, puoi far vedere il SaaS al commercialista e raccogliere feedback; il resto si può pianificare dopo.
