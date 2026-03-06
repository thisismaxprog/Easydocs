import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HelpPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aiuto</h1>
        <p className="text-muted-foreground">
          Domande frequenti e contatti.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domande frequenti</CardTitle>
          <CardDescription>Risposte rapide alle domande più comuni</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium">Come carico un documento?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Usa il pulsante «Carica» in alto a destra o dalla pagina Documenti. Seleziona un file PDF o un’immagine e, se vuoi, associalo a un cliente. Il sistema estrarrà automaticamente i dati quando il testo è leggibile (PDF digitali).
            </p>
          </div>
          <div>
            <h3 className="font-medium">Cosa succede se il PDF è scansionato?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              In questo MVP non è presente un OCR completo. Il documento viene salvato e lo stato sarà «Da revisionare»: potrai inserire manualmente i campi dalla scheda del documento.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Come esporto i dati in CSV?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vai in Documenti e clicca «Export CSV». Scegli il mese e se esportare tutto lo studio o un singolo cliente. Verranno inclusi solo i documenti con stato «Approvato».
            </p>
          </div>
          <div>
            <h3 className="font-medium">Posso invitare altri utenti allo studio?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              La gestione inviti è prevista in un prossimo aggiornamento. Per ora in Impostazioni puoi vedere l’elenco dei membri.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatti</CardTitle>
          <CardDescription>Supporto e assistenza</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Per assistenza tecnica o richieste: contatta il team di sviluppo tramite il canale indicato dal tuo amministratore.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
