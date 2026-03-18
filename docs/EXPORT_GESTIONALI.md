# Export verso gestionali (TeamSystem, Profis, Ipsoa, ecc.)

## Cosa c’è oggi

- **Excel generico Easydocs**: colonne standard, intestazione colorata, adatto a revisione e archivio.
- **CSV generico**: come sopra, separatore virgola.
- **CSV “Contabilità IT”** (`preset=accounting_it`): separatore **`;`**, importi in formato **italiano** (es. `69,00`), colonne tipiche per import in molti software italiani. È il **primo passo** verso l’integrazione senza dover mappare a mano decimali e separatori.

## Cosa manca per “template TeamSystem / Profis / Ipsoa”

Ogni gestionale ha spesso:

- ordine colonne fisso,
- codici causale / IVA / conto,
- a volte **record a lunghezza fissa** o XML proprietario.

**Non si può promettere “già pronto per tutti” senza:**

1. documentazione ufficiale o **file di import campione** fornito dal commercialista, oppure  
2. una sessione di **allineamento** (1 gestionale alla volta).

## Roadmap proposta

1. **Fase A (fatto / in corso)**: preset CSV contabilità IT + Excel generico.  
2. **Fase B**: primo template **nome gestionale** (es. TeamSystem) dopo ricezione tracciato.  
3. **Fase C**: libreria “Template” in app: scelta gestionale → download file pronto, zero mapping colonne.

## Messaggio commerciale onesto

- Oggi: *“Esporti in Excel o in CSV già formattato per l’import tipico dei gestionali italiani; i tracciati dedicati per [nome software] li aggiungiamo su richiesta con un file campione.”*  
- Dopo Fase B: *“Template pronto per TeamSystem (o altro) incluso nel piano.”*
