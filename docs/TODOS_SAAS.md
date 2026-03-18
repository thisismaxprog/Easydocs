# EasyDocs SaaS — Prossime fasi

Elenco di funzionalità e migliorie previste per le prossime iterazioni.

---

## Fase 2 (priorità alta)

- [ ] **Export template gestionali (ultimo miglio)**
  - Oggi: CSV “contabilità IT” (; e decimali IT) come base
  - Prossimo: template dedicati TeamSystem / Profis / Ipsoa (tracciato ufficiale o file campione dal commercialista)
  - Vedi `docs/EXPORT_GESTIONALI.md`

- [ ] **Scadenze IVA / promemoria**
  - Oggi: dashboard “clienti senza caricamenti da 30 gg”
  - Prossimo: date scadenza configurabili per studio + notifiche email

- [ ] **Import CSV clienti**
  - Pulsante "Importa clienti" in elenco clienti
  - Upload CSV → anteprima tabella → mapping colonne su campi sistema
  - Validazione duplicati e campi obbligatori
  - Import righe valide + riepilogo successi/errori
  - Template CSV scaricabile (campi: company_name, vat_number, tax_code, email, contact_name, phone, internal_code)

- [ ] **Flusso invito clienti**
  - Da scheda cliente: "Invia invito" → generazione token e (mock) invio email con link `/join?token=...`
  - Pagina `/join?token=...`: cliente vede dati azienda, conferma identità, imposta password o magic link
  - Dopo completamento: utente collegato al record `client` (tabella `client_users` o collegamento auth → client)
  - Stati invito: not_invited, invited, accepted, expired

- [ ] **Documenti: filtri e riassegnazione**
  - Filtro per cliente, per classification_status (assigned / suggested / unmatched)
  - Ordinamento per data upload
  - Ricerca per filename / cliente
  - Riassegnazione manuale documento a altro cliente (con audit)

- [ ] **Activity / Audit log**
  - Timeline attività per azioni principali: client created/updated, invite sent/accepted, document uploaded/assigned
  - Struttura estesa per auditabilità futura

---

## Fase 3 (architettura e matching)

- [ ] **Struttura per matching intelligente**
  - Tabella `document_extracted_entities` (vat_number_found, tax_code_found, company_name_found, invoice_number, issue_date, total_amount)
  - Tabella `document_match_candidates` (document_id, client_id, score, reason)
  - Interfaccia servizio di scoring (match scoring service) estendibile con logica AI
  - Campi già presenti su `documents`: match_confidence, match_reason

- [ ] **Impostazioni avanzate**
  - Profilo studio: logo, nome, P.IVA
  - Preferenze inviti
  - Categorie documenti (placeholder)
  - Gestione team (membri, ruoli admin/collaborator)
  - Placeholder integrazioni (software contabili, ecc.)

---

## Backlog / futuro

- **Email ingestion**: ricezione documenti via email e assegnazione a cliente/cartella
- **OCR completo**: pipeline OCR dedicata (es. Tesseract, Google Vision) + testo ricercabile
- **Classificazione AI**: classificazione automatica tipo documento e suggerimento cliente da entità estratte
- **Integrazioni**: export verso software contabili, fatturazione elettronica
- **Portale cliente**: area riservata per il cliente (login) con elenco propri documenti e upload (client_portal)
- **Ruoli granulari**: permessi per sezione (solo documenti, solo clienti, ecc.)
