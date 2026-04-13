# Export verso gestionali (TeamSystem, Danea, Zucchetti, ecc.)

## Cosa c'è oggi

| Preset | Separatore | Date | Importi | Note |
|--------|-----------|------|---------|------|
| **Easydocs (generico)** | `,` | YYYY-MM-DD | internazionale | Archivio / revisione |
| **Gestionale IT (generico)** | `;` | YYYY-MM-DD | italiano `69,00` | Import generico |
| **TeamSystem** | `;` | DD/MM/YYYY | italiano | Registro IVA acq./vend. |
| **Danea Easyfatt** | `;` | DD/MM/YYYY | italiano | Import fatture/ricevute |
| **Zucchetti** | `;` | DD/MM/YYYY | italiano | Registro documenti |

Ogni template include: data, numero documento, tipo (mappato per il gestionale),
ragione sociale, P.IVA, **imponibile**, **aliquota IVA%**, **imposta IVA**, totale.
Imponibile e IVA vengono dall'estrazione AI; se non disponibili il totale
va nella colonna imponibile e IVA resta vuota.

## Colonne per gestionale

### TeamSystem
`Data | N.Documento | Tipo Doc. | Fornitore/Cliente | P.IVA | Imponibile | Aliq.IVA% | Imposta IVA | Totale | Note`

Tipi documento: `Fattura`, `Ricevuta/Scontrino`, `Estratto conto`, `Bolletta`, `Altro`

### Danea Easyfatt
`Tipo | Data | Numero | Denominazione | Partita IVA | Imponibile | Aliquota IVA | Imposta IVA | Totale`

Tipi documento: `Fattura`, `Ricevuta fiscale`, `Estratto conto`, `Bolletta`, `Altro`

### Zucchetti
`DataDoc | NroDoc | TipoDoc | RagioneSociale | PartitaIVA | Imponibile | AliqIVA | ImpIVA | Totale | Note`

Tipi documento: `FATT`, `RIC`, `BANCA`, `UTIL`, `ALTRO`

## Disclaimer sui tracciati

I template sono basati su documentazione pubblica e tracciati campione
diffusi nella comunità dei commercialisti italiani.
**Non sostituiscono il piano dei conti** (codice conto, causale contabile)
che ogni studio configura nel proprio gestionale.

Per la piena compatibilità:
1. Richiedere allo studio un **file CSV campione** già importato nel gestionale.
2. Allineare l'ordine colonne / codici usando il campione come riferimento.
3. Aggiungere il template "certificato" come preset dedicato per quello studio.

## Messaggio commerciale

> *"Esporti direttamente nel formato del tuo gestionale: TeamSystem, Danea o Zucchetti.
> Il file è già pronto con separatore corretto, date in DD/MM/YYYY e importi italiani.
> Per allineare codici conto e causali specifici del tuo studio, mandaci un file
> campione e lo configuriamo."*

## Roadmap

- [x] **Fase A**: preset `accounting_it` + TeamSystem + Danea + Zucchetti
- [ ] **Fase B**: template certificato (con file campione da studio pilota)
- [ ] **Fase C**: Settings studio → "Gestionale in uso" → export automatico senza scegliere ogni volta
- [ ] **Fase D**: altri gestionali (Profis, Bluenext, Ipsoa, Fiscal Focus)
